import Stripe from "stripe";

export const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"] ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

/** Whether Stripe is configured (keys present) */
export const isStripeEnabled = !!process.env["STRIPE_SECRET_KEY"];
