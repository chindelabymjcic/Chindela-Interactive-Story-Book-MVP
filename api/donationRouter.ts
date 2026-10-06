import { z } from "zod";
import type Stripe from "stripe";
import { createRouter, publicQuery } from "./middleware";
import { getStripe, checkoutError, checkoutReturnBase } from "./lib/stripe";
import { DonationLimits } from "@contracts/constants";

// General donations are deliberately public: no login, no child, no age group,
// no subscription. Stripe Checkout collects the card and email, and is the
// system of record for these payments -- the webhook only sends receipts.
export const donationRouter = createRouter({
  createCheckout: publicQuery
    .input(
      z.object({
        amountGBPPence: z.number().int().min(DonationLimits.minGBPPence).max(DonationLimits.maxGBPPence),
        donorName: z.string().trim().max(100).optional(),
        donorEmail: z.string().trim().email().max(255).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const returnBase = checkoutReturnBase(ctx.req);
      const metadata: Record<string, string> = { kind: "general_donation" };
      if (input.donorName) metadata.donorName = input.donorName;

      const params: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        submit_type: "donate",
        line_items: [
          {
            price_data: {
              currency: "gbp",
              unit_amount: input.amountGBPPence,
              product_data: {
                name: "Donation to Chindela by MJ CIC",
                description: "Thank you for supporting the welfare and bright future of children.",
              },
            },
            quantity: 1,
          },
        ],
        ...(input.donorEmail ? { customer_email: input.donorEmail } : {}),
        metadata,
        payment_intent_data: { metadata, description: "Chindela general donation" },
        success_url: `${returnBase}/donate?donation=success`,
        cancel_url: `${returnBase}/donate?donation=cancel`,
      };

      let session: Stripe.Checkout.Session;
      try {
        session = await getStripe().checkout.sessions.create(params);
      } catch (err) {
        throw checkoutError("donation checkout", err);
      }
      if (!session.url) {
        console.error("[stripe] donation checkout returned no url", { sessionId: session.id });
        throw checkoutError("donation checkout", new Error("Checkout Session has no url"));
      }
      return { checkoutUrl: session.url };
    }),
});
