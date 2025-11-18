"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Users, Mail, Trash2, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: string
}

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  plan: string
  members: Member[]
  invitations: Invitation[]
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("MEMBER")
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchOrganization()
    }
  }, [params.id])

  const fetchOrganization = async () => {
    try {
      const res = await fetch(`/api/organizations/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrganization(data.data)
      } else {
        toast({
          title: "エラー",
          description: "組織の読み込みに失敗しました",
          variant: "destructive",
        })
        router.push("/organizations")
      }
    } catch (error) {
      console.error("Failed to fetch organization:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    try {
      const res = await fetch(`/api/organizations/${params.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      if (res.ok) {
        toast({
          title: "招待を送信しました",
          description: `${inviteEmail} に招待メールを送信しました`,
        })
        setInviteEmail("")
        setInviteRole("MEMBER")
        setInviteDialogOpen(false)
        fetchOrganization()
      } else {
        const error = await res.json()
        toast({
          title: "エラー",
          description: error.message || "招待の送信に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to send invitation:", error)
      toast({
        title: "エラー",
        description: "招待の送信に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("本当にこのメンバーを削除しますか？")) {
      return
    }

    try {
      const res = await fetch(
        `/api/organizations/${params.id}/members/${userId}`,
        {
          method: "DELETE",
        }
      )

      if (res.ok) {
        toast({
          title: "メンバーを削除しました",
        })
        fetchOrganization()
      } else {
        const error = await res.json()
        toast({
          title: "エラー",
          description: error.message || "メンバーの削除に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to remove member:", error)
      toast({
        title: "エラー",
        description: "メンバーの削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "招待を取り消しました",
        })
        fetchOrganization()
      } else {
        toast({
          title: "エラー",
          description: "招待の取り消しに失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to revoke invitation:", error)
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

  if (!organization) {
    return null
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8" />
          <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
          <Badge variant={organization.plan === "FREE" ? "secondary" : "default"}>
            {organization.plan}
          </Badge>
        </div>
        <p className="text-muted-foreground">@{organization.slug}</p>
        {organization.description && (
          <p className="text-sm mt-2">{organization.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {/* Members Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  メンバー
                </CardTitle>
                <CardDescription>
                  {organization.members.length} 人のメンバー
                </CardDescription>
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    メンバーを招待
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>メンバーを招待</DialogTitle>
                    <DialogDescription>
                      招待したいメンバーのメールアドレスを入力してください
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">メールアドレス</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="member@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">ロール</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">メンバー</SelectItem>
                          <SelectItem value="ADMIN">管理者</SelectItem>
                          <SelectItem value="OWNER">オーナー</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleInvite}>招待を送信</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>メール</TableHead>
                  <TableHead>ロール</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organization.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user.name || "名前未設定"}
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {organization.invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                招待中
              </CardTitle>
              <CardDescription>
                {organization.invitations.length} 件の保留中の招待
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>メール</TableHead>
                    <TableHead>ロール</TableHead>
                    <TableHead>有効期限</TableHead>
                    <TableHead className="text-right">アクション</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organization.invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{invitation.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.expiresAt).toLocaleDateString("ja-JP")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                        >
                          取り消し
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
