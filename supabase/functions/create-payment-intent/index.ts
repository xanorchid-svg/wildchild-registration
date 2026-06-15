import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const {
      amount,
      currency = "usd",
      metadata = {},
      customerEmail,
      customerName,
      existingCustomerId,
      saveCard = false,
    } = await req.json();

    // ── Stripe Customer ──────────────────────────────────────────────────────
    // Always create/reuse a customer so name + email show in Stripe dashboard.
    let customerId = existingCustomerId || null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: customerEmail || undefined,
        name:  customerName  || undefined,
        metadata,
      });
      customerId = customer.id;
    } else {
      // Update existing customer with latest name/email in case it changed
      await stripe.customers.update(customerId, {
        email: customerEmail || undefined,
        name:  customerName  || undefined,
      });
    }

    // ── Payment Intent ───────────────────────────────────────────────────────
    const intentParams: Stripe.PaymentIntentCreateParams = {
      amount:      Math.round(amount * 100), // dollars → cents
      currency,
      customer:    customerId,
      description: customerName ? `Wild Child enrollment — ${customerName}` : "Wild Child enrollment",
      metadata,
      ...(saveCard ? { setup_future_usage: "off_session" } : {}),
    };

    const paymentIntent = await stripe.paymentIntents.create(intentParams);

    return new Response(
      JSON.stringify({
        clientSecret:     paymentIntent.client_secret,
        stripeCustomerId: customerId,
      }),
      { headers: { "Content-Type": "application/json", ...CORS } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...CORS } }
    );
  }
});
