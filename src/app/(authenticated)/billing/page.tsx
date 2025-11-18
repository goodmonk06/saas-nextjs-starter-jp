"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Check } from "lucide-react"

const STRIPE_PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_xxx"

export default function BillingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("success")) {
      toast({
        title: "サブスクリプション開始",
        description: "Proプランへのアップグレードが完了しました",
      })
      router.replace("/billing")
    }
    if (searchParams.get("canceled")) {
      toast({
        title: "キャンセル",
        description: "サブスクリプションの購入がキャンセルされました",
        variant: "destructive",
      })
      router.replace("/billing")
    }
  }, [searchParams, toast, router])

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: STRIPE_PRO_PRICE_ID }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました")
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">課金管理</h1>
        <p className="text-muted-foreground">
          プランの管理とサブスクリプションの設定
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Free プラン</CardTitle>
            <CardDescription>基本機能を無料で利用</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">¥0</div>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">基本機能</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">1ユーザー</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">コミュニティサポート</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {session?.user?.plan === "FREE" ? (
              <Button variant="outline" className="w-full" disabled>
                現在のプラン
              </Button>
            ) : null}
          </CardFooter>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Pro プラン</CardTitle>
            <CardDescription>すべての機能を利用可能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">¥1,980 / 月</div>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">すべての機能</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">無制限ユーザー</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">優先サポート</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-500" />
                <span className="text-sm">高度な分析</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            {session?.user?.plan === "PRO" ? (
              <Button
                onClick={handleManageSubscription}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "読み込み中..." : "サブスクリプションを管理"}
              </Button>
            ) : (
              <Button
                onClick={handleSubscribe}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "読み込み中..." : "Proにアップグレード"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      {session?.user?.plan === "PRO" && (
        <Card>
          <CardHeader>
            <CardTitle>サブスクリプション情報</CardTitle>
            <CardDescription>現在のサブスクリプション状態</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">プラン:</span> Pro
              </p>
              {session.user?.stripeCurrentPeriodEnd && (
                <p className="text-sm">
                  <span className="font-medium">次回更新日:</span>{" "}
                  {new Date(session.user.stripeCurrentPeriodEnd).toLocaleDateString(
                    "ja-JP"
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
