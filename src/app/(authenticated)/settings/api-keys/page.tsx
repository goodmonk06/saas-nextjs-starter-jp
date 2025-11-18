"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { Key, Plus, Copy, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ApiKey {
  id: string
  name: string
  prefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

interface NewApiKey extends ApiKey {
  key: string
}

export default function ApiKeysPage() {
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newApiKey, setNewApiKey] = useState<NewApiKey | null>(null)
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/api-keys")
      if (res.ok) {
        const data = await res.json()
        setApiKeys(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "エラー",
        description: "APIキー名を入力してください",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setNewApiKey(data.data)
        setNewKeyName("")
        setCreateDialogOpen(false)
        setShowNewKeyDialog(true)
        fetchApiKeys()
      } else {
        const error = await res.json()
        toast({
          title: "エラー",
          description: error.message || "APIキーの作成に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create API key:", error)
      toast({
        title: "エラー",
        description: "APIキーの作成に失敗しました",
        variant: "destructive",
      })
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm("本当にこのAPIキーを削除しますか？削除後は復元できません。")) {
      return
    }

    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "APIキーを削除しました",
        })
        fetchApiKeys()
      } else {
        const error = await res.json()
        toast({
          title: "エラー",
          description: error.message || "APIキーの削除に失敗しました",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to revoke API key:", error)
      toast({
        title: "エラー",
        description: "APIキーの削除に失敗しました",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "コピーしました",
      description: "APIキーをクリップボードにコピーしました",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">APIキー</h1>
        <p className="text-muted-foreground mt-2">
          プログラムからAPIにアクセスするためのキーを管理します
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>重要な注意事項</AlertTitle>
        <AlertDescription>
          APIキーは作成時に一度だけ表示されます。必ず安全な場所に保管してください。
          APIキーが漏洩した場合は、すぐに削除して新しいキーを作成してください。
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                APIキー
              </CardTitle>
              <CardDescription>
                {apiKeys.length} 個のアクティブなAPIキー
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  新規作成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新しいAPIキーを作成</DialogTitle>
                  <DialogDescription>
                    APIキーの名前を入力してください
                  </DialogDescription>
                </DialogHeader>
                <div>
                  <Label htmlFor="name">名前</Label>
                  <Input
                    id="name"
                    placeholder="例: Production API"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreate()
                      }
                    }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleCreate}>作成</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              読み込み中...
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">APIキーがありません</p>
              <p className="text-sm text-muted-foreground mb-4">
                新しいAPIキーを作成してプログラムからAPIにアクセスしましょう
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名前</TableHead>
                  <TableHead>キー</TableHead>
                  <TableHead>最終使用</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead className="text-right">アクション</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {apiKey.prefix}...
                      </code>
                    </TableCell>
                    <TableCell>
                      {apiKey.lastUsedAt ? (
                        new Date(apiKey.lastUsedAt).toLocaleDateString("ja-JP")
                      ) : (
                        <Badge variant="secondary">未使用</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(apiKey.createdAt).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevoke(apiKey.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New API Key Dialog */}
      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>APIキーを作成しました</DialogTitle>
            <DialogDescription>
              このキーは一度だけ表示されます。必ず安全な場所に保管してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>重要</AlertTitle>
              <AlertDescription>
                このAPIキーは二度と表示されません。今すぐコピーして安全な場所に保管してください。
              </AlertDescription>
            </Alert>
            <div>
              <Label>APIキー</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newApiKey?.key || ""}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(newApiKey?.key || "")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowNewKeyDialog(false)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
