import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing stripe-signature or STRIPE_WEBHOOK_SECRET");
    return new Response("Unauthorized", { status: 401 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("Received Stripe event:", event.type);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const piId = pi.id;

        // Update registrations
        const { error: regError } = await supabase
          .from("registrations")
          .update({ payment_status: "paid" })
          .eq("stripe_payment_intent_id", piId);

        if (regError) console.error("Error updating registrations:", regError);

        // Update harmony_bookings
        const { error: harmonyError } = await supabase
          .from("harmony_bookings")
          .update({ payment_status: "paid" })
          .eq("stripe_payment_intent_id", piId);

        if (harmonyError) console.error("Error updating harmony_bookings:", harmonyError);

        // Update payment_installments
        const { error: installError } = await supabase
          .from("payment_installments")
          .update({ status: "paid", attempted_at: new Date().toISOString() })
          .eq("stripe_payment_intent_id", piId);

        if (installError) console.error("Error updating payment_installments:", installError);

        console.log("Marked paid for PaymentIntent:", piId);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const piId = pi.id;
        const errorMsg = pi.last_payment_error?.message ?? "Payment failed";

        const { error: regError } = await supabase
          .from("registrations")
          .update({ payment_status: "payment_issue" })
          .eq("stripe_payment_intent_id", piId);

        if (regError) console.error("Error updating registrations:", regError);

        const { error: harmonyError } = await supabase
          .from("harmony_bookings")
          .update({ payment_status: "payment_issue" })
          .eq("stripe_payment_intent_id", piId);

        if (harmonyError) console.error("Error updating harmony_bookings:", harmonyError);

        // Update failed installment with error
        const { error: installError } = await supabase
          .from("payment_installments")
          .update({
            status: "failed",
            attempted_at: new Date().toISOString(),
            error_message: errorMsg,
          })
          .eq("stripe_payment_intent_id", piId);

        if (installError) console.error("Error updating payment_installments:", installError);

        console.log("Marked payment_issue for PaymentIntent:", piId);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId = charge.payment_intent as string;

        if (!piId) {
          console.warn("charge.refunded: no payment_intent on charge", charge.id);
          break;
        }

        const { error: regError } = await supabase
          .from("registrations")
          .update({ payment_status: "refunded" })
          .eq("stripe_payment_intent_id", piId);

        if (regError) console.error("Error updating registrations:", regError);

        const { error: harmonyError } = await supabase
          .from("harmony_bookings")
          .update({ payment_status: "refunded" })
          .eq("stripe_payment_intent_id", piId);

        if (harmonyError) console.error("Error updating harmony_bookings:", harmonyError);

        console.log("Marked refunded for PaymentIntent:", piId);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }
  } catch (err) {
    console.error("Error processing webhook event:", err);
    return new Response("Internal error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
