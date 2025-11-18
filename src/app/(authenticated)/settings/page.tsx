import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">設定</h1>
        <p className="text-muted-foreground">
          アカウント設定とプロフィール管理
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>プロフィール情報</CardTitle>
          <CardDescription>登録されている情報</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">名前</label>
            <p className="text-sm text-muted-foreground mt-1">
              {session.user?.name}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">メールアドレス</label>
            <p className="text-sm text-muted-foreground mt-1">
              {session.user?.email}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">プラン</label>
            <p className="text-sm text-muted-foreground mt-1">
              {session.user?.plan === "PRO" ? "Pro" : "Free"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>アカウント設定</CardTitle>
          <CardDescription>
            プロフィールやパスワードの変更はここで行います
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            将来的な機能拡張として、以下の設定項目を追加できます：
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
            <li>プロフィール編集</li>
            <li>パスワード変更</li>
            <li>メール通知設定</li>
            <li>2要素認証</li>
            <li>アカウント削除</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>開発者向けメモ</CardTitle>
          <CardDescription>カスタマイズのヒント</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-sm text-muted-foreground">
            このページをカスタマイズして、プロフィール編集フォームや
            その他のアカウント設定を追加してください。
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            関連ファイル:
          </p>
          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
            <li>src/app/(authenticated)/settings/page.tsx</li>
            <li>prisma/schema.prisma (Userモデル)</li>
            <li>src/lib/auth.ts (NextAuth設定)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
