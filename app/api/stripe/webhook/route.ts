// app/api/stripe/webhook/route.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/utils/supabase-admin";
import { withCors } from "@/utils/cors";

interface CustomSubscriptionItem extends Stripe.SubscriptionItem {
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
}

// Helper function to convert Unix timestamp to ISO 8601 format
function unixToIso8601(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toISOString(); // Convert seconds to milliseconds
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Helper function for consistent logging
function logWebhookEvent(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  let dataString;

  if (data instanceof Error) {
    dataString = `Error: ${data.message}\nStack: ${data.stack}`;
  } else if (data) {
    dataString = JSON.stringify(data, null, 2);
  } else {
    dataString = "";
  }

  console.log(`[${timestamp}] WEBHOOK: ${message}`, dataString);
}

// ✅ Replace the old config export with these App Router runtime configs
export const runtime = "nodejs"; // Optional: explicitly set runtime
export const dynamic = "force-dynamic"; // Disable caching for webhooks

export const POST = withCors(async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  try {
    logWebhookEvent("Received webhook request");
    logWebhookEvent("Stripe signature", sig);

    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    logWebhookEvent(`Event received: ${event.type}`, event.data.object);

    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.pending_update_applied":
      case "customer.subscription.pending_update_expired":
      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;

        // **1. Safely extract the first subscription item**
        const subscriptionItem = subscription.items.data[0] as CustomSubscriptionItem | undefined;
        // **2. Define a clean object with the required period data**
        // Use optional chaining (`?.`) and the nullish coalescing operator (`??`)
        // to safely get the values, ensuring current_period_start/end are
        // treated as 'number | null' which is what your original fix required.
        const periodData = {
          current_period_start: subscriptionItem?.current_period_start ?? null,
          current_period_end: subscriptionItem?.current_period_end ?? null,
          cancel_at_period_end: subscriptionItem?.cancel_at_period_end ?? false,
        };

        if (subscriptionItem) {
          logWebhookEvent("Subscription item data used", periodData);
        } else {
          // Log a warning if the item isn't there, but we can proceed with nulls
          logWebhookEvent("Warning: No subscription items found in the event. Period fields will be null.");
        }

        // Prepare the update data
        const updateObject = {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status,
          cancel_at_period_end: periodData.cancel_at_period_end, // Use safe value
          updated_at: new Date().toISOString(),

          // **3. Conditionally convert to ISO 8601**
          // Check if the safely extracted value is a number (truthy and not null) before conversion
          current_period_end: periodData.current_period_end
            ? unixToIso8601(periodData.current_period_end) // Convert to ISO 8601
            : null,
          current_period_start: periodData.current_period_start
            ? unixToIso8601(periodData.current_period_start) // Convert to ISO 8601
            : null,
        };

        // Log the data right before the update or insert operation
        logWebhookEvent("Data to be inserted/updated", updateObject);

        // Check if the row exists based on either stripe_subscription_id or stripe_customer_id
        const { data: existingSubs, error: fetchError } = await supabaseAdmin.from("subscriptions").select("*").or(`stripe_customer_id.eq.${subscription.customer},stripe_subscription_id.eq.${subscription.id}`).limit(1); // Limit the query to 1 row

        if (fetchError) {
          logWebhookEvent("Error fetching existing subscription", fetchError);
          throw new Error(`Fetch failed: ${fetchError.message}`);
        }

        // Handle cases where no matching subscription is found
        if (!existingSubs || existingSubs.length === 0) {
          logWebhookEvent("No existing subscription found, inserting new one...");
          const { data: newData, error: insertError } = await supabaseAdmin
            .from("subscriptions")
            .insert([
              {
                stripe_customer_id: subscription.customer as string,
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                cancel_at_period_end: subscription.cancel_at_period_end,
                current_period_end: updateObject.current_period_end,
                current_period_start: updateObject.current_period_start,
                updated_at: updateObject.updated_at,
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (insertError) {
            logWebhookEvent("Error inserting new subscription", insertError);
            throw new Error(`Insert failed: ${insertError.message}`);
          }

          logWebhookEvent(`Successfully inserted new subscription ${subscription.id}`, newData);
        } else {
          // If we found an existing subscription, update it
          logWebhookEvent("Found existing subscription, updating...", existingSubs[0]);
          const { error: updateError } = await supabaseAdmin.from("subscriptions").update(updateObject).eq("id", existingSubs[0].id); // Update based on the subscription row ID

          if (updateError) {
            logWebhookEvent("Error updating subscription", updateError);
            throw new Error(`Update failed: ${updateError.message}`);
          }

          logWebhookEvent(`Successfully updated subscription ${subscription.id}`);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const { error: deleteError } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: false,
            current_period_end: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (deleteError) {
          logWebhookEvent("Error deleting subscription", deleteError);
          throw new Error(`Delete update failed: ${deleteError.message}`);
        }

        logWebhookEvent(`Successfully deleted subscription ${subscription.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logWebhookEvent("Webhook error", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
});
