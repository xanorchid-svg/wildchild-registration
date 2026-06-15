// charge-installments/index.ts
// Called daily by Supabase cron (or manually from admin).
// Finds payment_installments where due_date <= today and status = 'pending',
// then charges the saved Stripe Customer's default payment method.

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const results: object[] = [];
  const errors:  object[] = [];

  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Fetch all due pending installments
    const { data: installments, error: fetchErr } = await supabase
      .from("payment_installments")
      .select("*")
      .eq("status", "pending")
      .lte("due_date", today);

    if (fetchErr) throw fetchErr;
    if (!installments || installments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No installments due today.", results: [], errors: [] }),
        { headers: { "Content-Type": "application/json", ...CORS } }
      );
    }

    for (const inst of installments) {
      try {
        // Mark as attempting
        await supabase
          .from("payment_installments")
          .update({ attempted_at: new Date().toISOString() })
          .eq("id", inst.id);

        // Get saved payment method for this customer
        const paymentMethods = await stripe.paymentMethods.list({
          customer: inst.stripe_customer_id,
          type: "card",
        });

        if (!paymentMethods.data.length) {
          throw new Error(`No saved payment method for customer ${inst.stripe_customer_id}`);
        }

        const paymentMethod = paymentMethods.data[0];

        // Create and confirm off-session PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
          amount:         Math.round(inst.amount * 100),
          currency:       "usd",
          customer:       inst.stripe_customer_id,
          payment_method: paymentMethod.id,
          confirm:        true,
          off_session:    true,
          metadata: {
            registration_id:    inst.registration_id,
            installment_id:     inst.id,
            parent_user_id:     inst.parent_user_id || "",
          },
        });

        // Update installment as paid
        await supabase
          .from("payment_installments")
          .update({
            status:                    "paid",
            stripe_payment_intent_id:  paymentIntent.id,
            attempted_at:              new Date().toISOString(),
          })
          .eq("id", inst.id);

        // Update registration payment_status if all installments paid
        const { data: remaining } = await supabase
          .from("payment_installments")
          .select("id")
          .eq("registration_id", inst.registration_id)
          .eq("status", "pending");

        if (!remaining || remaining.length === 0) {
          await supabase
            .from("registrations")
            .update({ payment_status: "paid" })
            .eq("id", inst.registration_id);
        }

        results.push({ installment_id: inst.id, status: "charged", amount: inst.amount });
      } catch (instErr: unknown) {
        const msg = instErr instanceof Error ? instErr.message : String(instErr);

        // Mark as failed
        await supabase
          .from("payment_installments")
          .update({
            status:        "failed",
            error_message: msg,
            attempted_at:  new Date().toISOString(),
          })
          .eq("id", inst.id);

        // Flag registration for attention
        await supabase
          .from("registrations")
          .update({ payment_status: "payment_issue" })
          .eq("id", inst.registration_id);

        errors.push({ installment_id: inst.id, error: msg });
      }
    }

    return new Response(
      JSON.stringify({ processed: installments.length, results, errors }),
      { headers: { "Content-Type": "application/json", ...CORS } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS } }
    );
  }
});
