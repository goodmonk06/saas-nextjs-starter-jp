import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create demo users
  const demoPassword = await hash("demo1234", 12)

  const freeUser = await prisma.user.upsert({
    where: { email: "demo-free@example.com" },
    update: {},
    create: {
      email: "demo-free@example.com",
      name: "デモユーザー（Free）",
      password: demoPassword,
      plan: "FREE",
    },
  })

  const proUser = await prisma.user.upsert({
    where: { email: "demo-pro@example.com" },
    update: {},
    create: {
      email: "demo-pro@example.com",
      name: "デモユーザー（Pro）",
      password: demoPassword,
      plan: "PRO",
      stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })

  console.log("✅ Created demo users:")
  console.log("   Free user:", freeUser.email, "/ password: demo1234")
  console.log("   Pro user:", proUser.email, "/ password: demo1234")
  console.log("")
  console.log("🎉 Seeding completed!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
