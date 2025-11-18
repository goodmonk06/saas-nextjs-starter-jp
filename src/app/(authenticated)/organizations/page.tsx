"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Plus } from "lucide-react"

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  plan: string
  members: any[]
  _count: {
    members: number
    invitations: number
  }
  createdAt: string
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/organizations")
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">組織</h1>
          <p className="text-muted-foreground mt-2">
            所属している組織の一覧と管理
          </p>
        </div>
        <Button asChild>
          <Link href="/organizations/new">
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Link>
        </Button>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">組織がありません</p>
            <p className="text-sm text-muted-foreground mb-4">
              新しい組織を作成して、チームでの作業を開始しましょう
            </p>
            <Button asChild>
              <Link href="/organizations/new">
                <Plus className="w-4 h-4 mr-2" />
                組織を作成
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {org.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      @{org.slug}
                    </CardDescription>
                  </div>
                  <Badge variant={org.plan === "FREE" ? "secondary" : "default"}>
                    {org.plan}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {org.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {org.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{org._count.members} メンバー</span>
                  </div>
                  {org._count.invitations > 0 && (
                    <div>
                      <span>{org._count.invitations} 招待中</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/organizations/${org.id}`}>詳細を見る</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
