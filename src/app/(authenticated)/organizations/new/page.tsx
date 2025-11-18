"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NewOrganizationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        toast({
          title: "組織を作成しました",
          description: `${formData.name} が正常に作成されました`,
        })
        router.push(`/organizations/${data.data.id}`)
      } else {
        const error = await res.json()
        toast({
          title: "エラー",
          description: error.message || "組織の作成に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create organization:", error)
      toast({
        title: "エラー",
        description: "組織の作成に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug from name if slug is empty
      slug: prev.slug === ""
        ? name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        : prev.slug,
    }))
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          新しい組織を作成
        </h1>
        <p className="text-muted-foreground mt-2">
          チームで作業するための新しい組織を作成します
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>組織情報</CardTitle>
          <CardDescription>
            組織の基本情報を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">組織名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="例: Acme Corporation"
                required
                maxLength={100}
              />
              <p className="text-sm text-muted-foreground mt-1">
                組織の正式名称を入力してください
              </p>
            </div>

            <div>
              <Label htmlFor="slug">スラッグ *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, ""),
                  }))
                }
                placeholder="例: acme-corp"
                required
                pattern="[a-z0-9-]+"
                minLength={2}
                maxLength={50}
              />
              <p className="text-sm text-muted-foreground mt-1">
                URLで使用される一意の識別子（英小文字、数字、ハイフンのみ）
              </p>
            </div>

            <div>
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="組織の説明を入力してください（任意）"
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.description.length} / 500文字
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "作成中..." : "組織を作成"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
