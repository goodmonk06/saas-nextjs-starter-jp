import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const subscription = event.data.object as Stripe.Subscription

  try {
    switch (event.type) {
      case "checkout.session.completed":
        // サブスクリプション購入完了
        if (session.mode === "subscription") {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string

          const sub = await stripe.subscriptions.retrieve(subscriptionId)

          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: {
              plan: "PRO",
              stripeSubscriptionId: subscriptionId,
              stripePriceId: sub.items.data[0].price.id,
              stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          })
        }
        break

      case "customer.subscription.updated":
        // サブスクリプション更新
        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: subscription.status === "active" ? "PRO" : "FREE",
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        break

      case "customer.subscription.deleted":
        // サブスクリプションキャンセル
        await prisma.user.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: "FREE",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        })
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
