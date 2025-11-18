import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground">
          ようこそ、{session.user?.name}さん
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>現在のプラン</CardTitle>
            <CardDescription>あなたの利用プラン</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {session.user?.plan === "PRO" ? "Pro" : "Free"}
            </div>
            {session.user?.plan === "PRO" && session.user?.stripeCurrentPeriodEnd && (
              <p className="text-sm text-muted-foreground mt-2">
                次回更新日:{" "}
                {new Date(session.user.stripeCurrentPeriodEnd).toLocaleDateString(
                  "ja-JP"
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>アカウント情報</CardTitle>
            <CardDescription>登録情報</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">名前:</span> {session.user?.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">メール:</span> {session.user?.email}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>よく使う機能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/billing"
                className="block text-sm text-primary hover:underline"
              >
                {session.user?.plan === "PRO"
                  ? "サブスクリプションを管理"
                  : "Proプランにアップグレード"}
              </a>
              <a
                href="/settings"
                className="block text-sm text-primary hover:underline"
              >
                アカウント設定
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>スターターテンプレートについて</CardTitle>
          <CardDescription>
            このテンプレートの使い方
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ul className="list-disc list-inside space-y-2">
            <li>このダッシュボードは、SaaSアプリケーションのベースとして使用できます</li>
            <li>認証、課金、ユーザー管理の基本機能が実装されています</li>
            <li>プロジェクトのニーズに合わせてカスタマイズしてください</li>
            <li>READMEに詳細なドキュメントが記載されています</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
