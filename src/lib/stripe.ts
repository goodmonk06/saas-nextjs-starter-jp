import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
})

export const getStripeCustomerId = async (userId: string, email: string) => {
  const { prisma } = await import("./prisma")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId
  }

  // Stripe顧客を作成
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })

  // DBに保存
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}
