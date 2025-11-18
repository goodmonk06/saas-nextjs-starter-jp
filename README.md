# SaaS Starter JP

日本向けSaaSの汎用スターター。認証・課金・ユーザー管理・管理画面までを含む、本番環境に近い実装を提供します。

## Overview（概要）

このプロジェクトは、日本市場向けのSaaSアプリケーションを素早く立ち上げるための完全なスターターテンプレートです。

**Phase 2 ステータス:**
- ✅ エンドツーエンドで動作する垂直スライス実装済み
- ✅ ローカル開発環境整備済み（Docker対応）
- ✅ テスト環境構築済み
- ✅ Seedデータ準備済み

## Tech Stack（技術スタック）

### フロントエンド
- **Next.js 14** (App Router) - React フレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストCSS
- **shadcn/ui** - 高品質なUIコンポーネント

### バックエンド
- **NextAuth.js v4** - 認証・セッション管理
- **Prisma** - タイプセーフなORM
- **PostgreSQL** - リレーショナルデータベース
- **Zod** - スキーマバリデーション

### 外部サービス
- **Stripe** - サブスクリプション決済

### 開発ツール
- **Vitest** - 高速なユニットテスト
- **ESLint** - コード品質チェック
- **Docker & Docker Compose** - コンテナ化とローカル開発

## Domain Model Summary（ドメインモデル）

### 主要エンティティ

#### User（ユーザー）
- ユーザーアカウント情報
- 認証情報（email/password）
- プラン情報（FREE/PRO）
- Stripe顧客情報

**リレーション:**
- `accounts` (1:N) - OAuth アカウント連携用
- `sessions` (1:N) - セッション管理用

#### Subscription（サブスクリプション）
Userモデルに統合されています:
- `plan`: FREE | PRO
- `stripeCustomerId`: Stripe顧客ID
- `stripeSubscriptionId`: サブスクリプションID
- `stripeCurrentPeriodEnd`: 課金期間終了日

## Getting Started（セットアップ）

### Requirements（前提条件）

- **Node.js** 20.x 以降
- **PostgreSQL** 16.x 以降（またはDocker）
- **npm** または **yarn** または **pnpm**

### Option 1: Docker を使用（推奨）

最も簡単な開始方法です。

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourusername/saas-nextjs-starter-jp.git
cd saas-nextjs-starter-jp

# 2. 環境変数を設定
cp .env.example .env
# .env を編集して NEXTAUTH_SECRET を設定:
# NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 3. Docker Compose で開発環境を起動（DBのみ）
docker compose -f docker-compose.dev.yml up -d

# 4. 依存関係をインストール
npm install

# 5. データベースマイグレーション
npm run db:migrate

# 6. Seedデータ投入
npm run db:seed

# 7. 開発サーバー起動
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

### Option 2: ローカルPostgreSQLを使用

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourusername/saas-nextjs-starter-jp.git
cd saas-nextjs-starter-jp

# 2. 環境変数を設定
cp .env.example .env
# DATABASE_URL を自分のPostgreSQL接続文字列に変更
# NEXTAUTH_SECRET を生成して設定

# 3. 依存関係をインストール
npm install

# 4. データベースマイグレーション
npm run db:migrate

# 5. Seedデータ投入
npm run db:seed

# 6. 開発サーバー起動
npm run dev
```

### Option 3: 完全にDockerで起動

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourusername/saas-nextjs-starter-jp.git
cd saas-nextjs-starter-jp

# 2. 環境変数を設定
cp .env.example .env

# 3. Docker Compose でビルド＆起動
docker compose up --build
```

アプリケーションは http://localhost:3000 で起動します。

## Example Flow（実装された垂直スライス）

### User Profile Management（ユーザープロフィール管理）

完全に動作するエンドツーエンドの機能実装例：

#### 1. ユーザー登録
1. http://localhost:3000/auth/signup にアクセス
2. 名前、メール、パスワードを入力
3. アカウント作成後、自動的にダッシュボードへリダイレクト

#### 2. プロフィール取得
```bash
# API経由でプロフィール取得
curl -X GET http://localhost:3000/api/users/me \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

レスポンス例:
```json
{
  "success": true,
  "data": {
    "id": "clxxx...",
    "name": "テストユーザー",
    "email": "test@example.com",
    "plan": "FREE",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### 3. プロフィール更新
1. http://localhost:3000/settings にアクセス
2. 名前やメールアドレスを変更
3. 「変更を保存」ボタンをクリック
4. リアルタイムでUIとセッションが更新される

または API 経由:
```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"name": "新しい名前"}'
```

### デモアカウント

Seedスクリプトにより、以下のデモアカウントが作成されます:

| Email | Password | Plan |
|-------|----------|------|
| demo-free@example.com | demo1234 | FREE |
| demo-pro@example.com | demo1234 | PRO |

これらのアカウントでログインして、すぐに機能を試すことができます。

## Available Scripts（利用可能なコマンド）

### 開発
```bash
npm run dev          # 開発サーバー起動 (http://localhost:3000)
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
npm run lint         # ESLintでコードチェック
```

### テスト
```bash
npm test             # Vitestでユニットテスト実行
npm run test:ui      # Vitest UIモードで実行
```

### データベース
```bash
npm run db:generate  # Prisma Clientを生成
npm run db:push      # スキーマをDBに反映（開発用）
npm run db:migrate   # マイグレーションを作成＆適用
npm run db:seed      # Seedデータを投入
npm run db:studio    # Prisma Studioを起動
npm run db:reset     # DBをリセット（全データ削除）
```

## API エンドポイント

### User Management
- `GET /api/users/me` - 現在のユーザー情報取得
- `PATCH /api/users/me` - ユーザー情報更新

### Authentication
- `POST /api/auth/signup` - 新規ユーザー登録
- NextAuth endpoints: `/api/auth/*`

### Stripe
- `POST /api/stripe/checkout` - Checkout Session作成
- `POST /api/stripe/portal` - Customer Portal Session作成
- `POST /api/webhooks/stripe` - Stripe Webhook受信

すべてのAPIレスポンスは以下の形式で統一されています:

**成功時:**
```json
{
  "success": true,
  "data": { ... }
}
```

**エラー時:**
```json
{
  "success": false,
  "error": {
    "message": "エラーメッセージ",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Testing（テスト）

### ユニットテストの実行

```bash
# すべてのテストを実行
npm test

# ウォッチモードで実行
npm test -- --watch

# カバレッジレポート生成
npm test -- --coverage

# UI モードで実行
npm run test:ui
```

### テスト対象
- `src/lib/__tests__/validations.test.ts` - バリデーションロジック
- `src/lib/__tests__/api-response.test.ts` - APIレスポンス処理

## Project Structure（プロジェクト構造）

```
saas-nextjs-starter-jp/
├── prisma/
│   ├── schema.prisma          # データベーススキーマ
│   └── seed.ts                # Seedスクリプト
├── src/
│   ├── app/
│   │   ├── (authenticated)/   # 認証必須ページ
│   │   │   ├── dashboard/
│   │   │   ├── billing/
│   │   │   └── settings/      # ✨ 実装済み垂直スライス
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── users/         # ✨ User管理API
│   │   │   ├── stripe/
│   │   │   └── webhooks/
│   │   ├── auth/              # 認証ページ
│   │   └── ...
│   ├── components/
│   │   ├── ui/                # shadcn/ui コンポーネント
│   │   └── nav.tsx
│   ├── lib/
│   │   ├── __tests__/         # ✨ ユニットテスト
│   │   ├── validations/       # ✨ Zodスキーマ
│   │   ├── api-response.ts    # ✨ 統一されたAPI応答
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── stripe.ts
│   └── hooks/
├── Dockerfile                  # ✨ プロダクションビルド
├── docker-compose.yml          # ✨ 本番環境用
├── docker-compose.dev.yml      # ✨ 開発環境用
├── vitest.config.ts            # ✨ テスト設定
└── README.md
```

✨ = Phase 2で追加/強化された部分

## Environment Variables（環境変数）

`.env.example`を参照してください。主要な環境変数:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # openssl rand -base64 32

# Stripe (Optional - 課金機能を使う場合)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="price_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Future Extensions（今後の拡張案）

このスターターをベースに以下のような機能を追加できます：

### 認証関連
- [ ] メール認証（メールアドレス確認）
- [ ] パスワードリセット機能
- [ ] OAuth プロバイダー追加（Google、GitHub等）
- [ ] 二要素認証（2FA）

### ユーザー管理
- [ ] プロフィール画像アップロード
- [ ] アカウント削除機能
- [ ] メール通知設定

### チーム/組織機能
- [ ] マルチテナント対応
- [ ] チーム招待機能
- [ ] ロールベースアクセス制御（RBAC）

### 課金機能拡張
- [ ] 年間プラン追加
- [ ] 使用量ベース課金
- [ ] クーポン/プロモーションコード
- [ ] 請求書PDF生成

### 管理機能
- [ ] 管理者ダッシュボード
- [ ] ユーザー管理画面
- [ ] アクティビティログ
- [ ] メトリクス・分析

### 開発者体験
- [ ] E2Eテスト（Playwright）
- [ ] Storybookによるコンポーネントカタログ
- [ ] CI/CDパイプライン
- [ ] API ドキュメント自動生成

## Deployment（デプロイ）

### Vercel（推奨）

```bash
# Vercel CLIをインストール
npm i -g vercel

# デプロイ
vercel

# 環境変数を設定
# Vercel Dashboard > Settings > Environment Variables
```

### Railway

```bash
# Railway CLIをインストール
npm i -g @railway/cli

# ログイン
railway login

# プロジェクト初期化
railway init

# デプロイ
railway up
```

### Docker（任意のクラウド）

```bash
# イメージをビルド
docker build -t saas-starter .

# コンテナを実行
docker run -p 3000:3000 --env-file .env saas-starter
```

## Troubleshooting（トラブルシューティング）

### データベース接続エラー
```bash
# Docker Composeでデータベースが起動しているか確認
docker compose -f docker-compose.dev.yml ps

# データベースログを確認
docker compose -f docker-compose.dev.yml logs db
```

### Prismaマイグレーションエラー
```bash
# マイグレーションをリセット
npm run db:reset

# 再度マイグレーション実行
npm run db:migrate
```

### NextAuth セッションエラー
- `NEXTAUTH_SECRET` が設定されているか確認
- `NEXTAUTH_URL` が正しいURLになっているか確認
- ブラウザのクッキーをクリア

## Contributing（貢献）

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## License

MIT

---

**🚀 Phase 2 完了 - 本番レベルのスターターテンプレート**

このリポジトリは、実際のSaaSプロダクト開発の土台として使用できます。
エンドツーエンドで動作する実装、テスト、Docker環境、Seedデータがすべて揃っています。
