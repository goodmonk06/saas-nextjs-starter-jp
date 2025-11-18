import { PrismaClient, MemberRole, InvitationStatus } from "@prisma/client"
import { hash } from "bcryptjs"
import crypto from "crypto"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create demo password
  const demoPassword = await hash("demo1234", 12)

  // ========================================
  // USERS
  // ========================================
  console.log("\n👤 Creating users...")

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice Johnson",
      password: demoPassword,
      plan: "FREE",
      bio: "フリーランスデザイナー。UX/UIデザインが専門です。",
      preferences: {
        theme: "light",
        language: "ja",
        notifications: true,
      },
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "Bob Smith",
      password: demoPassword,
      plan: "PRO",
      bio: "スタートアップのCTO。フルスタックエンジニア。",
      preferences: {
        theme: "dark",
        language: "ja",
      },
      stripeCustomerId: "cus_demo_bob",
      stripeSubscriptionId: "sub_demo_bob",
      stripePriceId: "price_pro",
      stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastLoginAt: new Date(),
    },
  })

  const carol = await prisma.user.upsert({
    where: { email: "carol@example.com" },
    update: {},
    create: {
      email: "carol@example.com",
      name: "Carol Williams",
      password: demoPassword,
      plan: "PRO",
      bio: "プロダクトマネージャー。アジャイル開発のエキスパート。",
      stripeCustomerId: "cus_demo_carol",
      stripeSubscriptionId: "sub_demo_carol",
      stripePriceId: "price_pro",
      stripeCurrentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  })

  const david = await prisma.user.upsert({
    where: { email: "david@example.com" },
    update: {},
    create: {
      email: "david@example.com",
      name: "David Brown",
      password: demoPassword,
      plan: "FREE",
      bio: "学生エンジニア。機械学習に興味があります。",
    },
  })

  const emma = await prisma.user.upsert({
    where: { email: "emma@example.com" },
    update: {},
    create: {
      email: "emma@example.com",
      name: "Emma Davis",
      password: demoPassword,
      plan: "ENTERPRISE",
      bio: "エンタープライズソリューションアーキテクト。",
      stripeCustomerId: "cus_demo_emma",
      stripeSubscriptionId: "sub_demo_emma",
      stripePriceId: "price_enterprise",
      stripeCurrentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })

  console.log(`✅ Created ${5} users`)

  // ========================================
  // ORGANIZATIONS
  // ========================================
  console.log("\n🏢 Creating organizations...")

  const techStartup = await prisma.organization.create({
    data: {
      name: "Tech Startup Inc.",
      slug: "tech-startup",
      description: "革新的なSaaSプロダクトを開発するスタートアップ企業",
      plan: "PRO",
      createdBy: bob.id,
      stripeCustomerId: "cus_org_tech",
      stripeSubscriptionId: "sub_org_tech",
      stripePriceId: "price_pro",
      stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      settings: {
        allowInvitations: true,
        requireTwoFactor: false,
        dataRetention: 90,
      },
      members: {
        create: [
          {
            userId: bob.id,
            role: MemberRole.OWNER,
          },
          {
            userId: alice.id,
            role: MemberRole.ADMIN,
          },
          {
            userId: carol.id,
            role: MemberRole.MEMBER,
          },
        ],
      },
    },
  })

  const designAgency = await prisma.organization.create({
    data: {
      name: "Creative Design Agency",
      slug: "creative-design",
      description: "クリエイティブなデザインソリューションを提供するエージェンシー",
      plan: "FREE",
      createdBy: alice.id,
      settings: {
        allowInvitations: true,
      },
      members: {
        create: [
          {
            userId: alice.id,
            role: MemberRole.OWNER,
          },
          {
            userId: david.id,
            role: MemberRole.MEMBER,
          },
        ],
      },
    },
  })

  const enterpriseCorp = await prisma.organization.create({
    data: {
      name: "Enterprise Solutions Corp",
      slug: "enterprise-solutions",
      description: "大企業向けエンタープライズソリューションプロバイダー",
      plan: "ENTERPRISE",
      createdBy: emma.id,
      stripeCustomerId: "cus_org_enterprise",
      stripeSubscriptionId: "sub_org_enterprise",
      stripePriceId: "price_enterprise",
      stripeCurrentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      settings: {
        allowInvitations: true,
        requireTwoFactor: true,
        dataRetention: 365,
        sso: true,
      },
      members: {
        create: [
          {
            userId: emma.id,
            role: MemberRole.OWNER,
          },
          {
            userId: bob.id,
            role: MemberRole.ADMIN,
          },
        ],
      },
    },
  })

  console.log(`✅ Created ${3} organizations`)

  // ========================================
  // INVITATIONS
  // ========================================
  console.log("\n📧 Creating invitations...")

  const invitation1 = await prisma.invitation.create({
    data: {
      email: "john@example.com",
      organizationId: techStartup.id,
      role: MemberRole.MEMBER,
      token: crypto.randomBytes(32).toString("hex"),
      invitedBy: bob.id,
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const invitation2 = await prisma.invitation.create({
    data: {
      email: "sarah@example.com",
      organizationId: enterpriseCorp.id,
      role: MemberRole.ADMIN,
      token: crypto.randomBytes(32).toString("hex"),
      invitedBy: emma.id,
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const invitation3 = await prisma.invitation.create({
    data: {
      email: "expired@example.com",
      organizationId: techStartup.id,
      role: MemberRole.MEMBER,
      token: crypto.randomBytes(32).toString("hex"),
      invitedBy: bob.id,
      status: InvitationStatus.EXPIRED,
      expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  })

  console.log(`✅ Created ${3} invitations`)

  // ========================================
  // API KEYS
  // ========================================
  console.log("\n🔑 Creating API keys...")

  const apiKey1 = await prisma.apiKey.create({
    data: {
      name: "Development API Key",
      key: crypto.createHash("sha256").update("test-key-1").digest("hex"),
      prefix: "sk_dev_test",
      userId: bob.id,
      scopes: ["read:users", "write:users"],
      lastUsedAt: new Date(),
    },
  })

  const apiKey2 = await prisma.apiKey.create({
    data: {
      name: "Production API Key",
      key: crypto.createHash("sha256").update("test-key-2").digest("hex"),
      prefix: "sk_prod_tes",
      organizationId: techStartup.id,
      scopes: ["read:all", "write:all"],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })

  const apiKey3 = await prisma.apiKey.create({
    data: {
      name: "Revoked Key",
      key: crypto.createHash("sha256").update("test-key-3").digest("hex"),
      prefix: "sk_rev_test",
      userId: alice.id,
      scopes: ["read:organizations"],
      revokedAt: new Date(),
    },
  })

  console.log(`✅ Created ${3} API keys`)

  // ========================================
  // AUDIT LOGS
  // ========================================
  console.log("\n📝 Creating audit logs...")

  const auditLogs = await prisma.auditLog.createMany({
    data: [
      {
        action: "organization.created",
        entityType: "organization",
        entityId: techStartup.id,
        userId: bob.id,
        organizationId: techStartup.id,
        metadata: {
          name: techStartup.name,
          slug: techStartup.slug,
        },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      },
      {
        action: "member.added",
        entityType: "organization_member",
        entityId: alice.id,
        userId: bob.id,
        organizationId: techStartup.id,
        metadata: {
          memberEmail: alice.email,
          role: MemberRole.ADMIN,
        },
        ipAddress: "192.168.1.1",
      },
      {
        action: "invitation.sent",
        entityType: "invitation",
        entityId: invitation1.id,
        userId: bob.id,
        organizationId: techStartup.id,
        metadata: {
          email: invitation1.email,
          role: invitation1.role,
        },
        ipAddress: "192.168.1.1",
      },
      {
        action: "api_key.created",
        entityType: "api_key",
        entityId: apiKey1.id,
        userId: bob.id,
        metadata: {
          name: apiKey1.name,
          scopes: apiKey1.scopes,
        },
        ipAddress: "192.168.1.2",
      },
      {
        action: "api_key.revoked",
        entityType: "api_key",
        entityId: apiKey3.id,
        userId: alice.id,
        metadata: {
          name: apiKey3.name,
        },
        ipAddress: "192.168.1.3",
      },
      {
        action: "user.login",
        entityType: "user",
        entityId: bob.id,
        userId: bob.id,
        metadata: {
          method: "credentials",
        },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
      },
    ],
  })

  console.log(`✅ Created ${auditLogs.count} audit logs`)

  // ========================================
  // SUMMARY
  // ========================================
  console.log("\n" + "=".repeat(50))
  console.log("🎉 Seeding completed successfully!")
  console.log("=".repeat(50))
  console.log("\n📊 Database Summary:")
  console.log("   • Users: 5")
  console.log("   • Organizations: 3")
  console.log("   • Invitations: 3 (2 pending, 1 expired)")
  console.log("   • API Keys: 3 (2 active, 1 revoked)")
  console.log("   • Audit Logs: 6")

  console.log("\n🔐 Demo Credentials:")
  console.log("   All passwords: demo1234")
  console.log("\n   Users:")
  console.log("   • alice@example.com (FREE) - Designer, OWNER of Creative Design Agency")
  console.log("   • bob@example.com (PRO) - CTO, OWNER of Tech Startup")
  console.log("   • carol@example.com (PRO) - PM, MEMBER of Tech Startup")
  console.log("   • david@example.com (FREE) - Student, MEMBER of Creative Design Agency")
  console.log("   • emma@example.com (ENTERPRISE) - Architect, OWNER of Enterprise Corp")

  console.log("\n   Organizations:")
  console.log("   • Tech Startup Inc. (PRO) - 3 members")
  console.log("   • Creative Design Agency (FREE) - 2 members")
  console.log("   • Enterprise Solutions Corp (ENTERPRISE) - 2 members")

  console.log("\n💡 Try these scenarios:")
  console.log("   1. Login as bob@example.com to manage Tech Startup")
  console.log("   2. Create API keys for programmatic access")
  console.log("   3. Invite new members to organizations")
  console.log("   4. View audit logs for security tracking")
  console.log("   5. Explore multi-organization workflows")
  console.log("")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
