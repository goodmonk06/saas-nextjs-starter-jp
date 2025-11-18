"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type UserProfile = {
  id: string
  name: string | null
  email: string
  plan: string
  createdAt: string
  updatedAt: string
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  })

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/users/me")
        const result = await response.json()

        if (result.success) {
          setProfile(result.data)
          setFormData({
            name: result.data.name || "",
            email: result.data.email || "",
          })
        } else {
          toast({
            title: "エラー",
            description: result.error.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "エラー",
          description: "プロフィールの取得に失敗しました",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }

    if (session?.user) {
      fetchProfile()
    }
  }, [session, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setProfile(result.data)

        // Update NextAuth session
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: result.data.name,
            email: result.data.email,
          },
        })

        toast({
          title: "保存完了",
          description: "プロフィールを更新しました",
        })
      } else {
        toast({
          title: "エラー",
          description: result.error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "プロフィールの更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">設定</h1>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
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
          <CardTitle>その他の設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => window.location.href = "/settings/api-keys"}
            >
              APIキー管理
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>プロフィール編集</CardTitle>
            <CardDescription>
              あなたの基本情報を編集できます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="山田 太郎"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="you@example.com"
              />
              <p className="text-xs text-muted-foreground">
                メールアドレスを変更すると、次回ログイン時に新しいアドレスを使用する必要があります
              </p>
            </div>
            <div className="space-y-2">
              <Label>プラン</Label>
              <p className="text-sm text-muted-foreground">
                {profile?.plan === "PRO" ? "Pro" : "Free"}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  name: profile?.name || "",
                  email: profile?.email || "",
                })
              }}
              disabled={isLoading}
            >
              リセット
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "保存中..." : "変更を保存"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>アカウント情報</CardTitle>
            <CardDescription>システム情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">アカウントID</p>
              <p className="text-sm text-muted-foreground font-mono">
                {profile.id}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">作成日</p>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.createdAt).toLocaleDateString("ja-JP")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">最終更新日</p>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.updatedAt).toLocaleDateString("ja-JP")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
