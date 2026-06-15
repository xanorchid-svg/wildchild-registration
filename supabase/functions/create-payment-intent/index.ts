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
    // If saveCard is true (payment plan), create or reuse a Stripe Customer
    // so we can charge their saved card for future installments.
    let customerId = existingCustomerId || null;

    if (saveCard) {
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: customerEmail || undefined,
          name:  customerName  || undefined,
          metadata,
        });
        customerId = customer.id;
      }
    }

    // ── Payment Intent ───────────────────────────────────────────────────────
    const intentParams: Stripe.PaymentIntentCreateParams = {
      amount:   Math.round(amount * 100), // dollars → cents
      currency,
      metadata,
      ...(customerId ? { customer: customerId } : {}),
      ...(saveCard   ? { setup_future_usage: "off_session" } : {}),
    };

    const paymentIntent = await stripe.paymentIntents.create(intentParams);

    return new Response(
      JSON.stringify({
        clientSecret:       paymentIntent.client_secret,
        stripeCustomerId:   customerId,
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
