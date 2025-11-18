# SaaS Starter JP

日本向けSaaSの汎用スターター。認証・課金・ユーザー管理・組織管理・監査ログまでを含む、エンタープライズグレードの実装を提供します。

## Overview（概要）

このプロジェクトは、日本市場向けのSaaSアプリケーションを素早く立ち上げるための完全なスターターテンプレートです。

**Phase 3 ステータス:**
- ✅ 複数の完全な垂直スライス実装済み（Organization管理、API Key管理）
- ✅ マルチテナント（組織）機能完備
- ✅ ロールベースアクセス制御（RBAC）
- ✅ 包括的なテストスイート
- ✅ 拡張可能なアーキテクチャ（アダプター、イベント、ロギング）
- ✅ リッチなシードデータ（5ユーザー、3組織、招待、APIキー等）
- ✅ 監査ログとセキュリティトラッキング
- ✅ Docker環境完備

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
- プラン情報（FREE/PRO/ENTERPRISE）
- Stripe顧客情報
- プロフィール（bio、preferences、metadata）
- ソフト削除対応（deletedAt）

**リレーション:**
- `accounts` (1:N) - OAuth アカウント連携用
- `sessions` (1:N) - セッション管理用
- `organizationMembers` (1:N) - 組織メンバーシップ
- `createdOrganizations` (1:N) - 作成した組織
- `invitations` (1:N) - 送信した招待
- `apiKeys` (1:N) - APIキー
- `auditLogs` (1:N) - 監査ログ

#### Organization（組織）
- 組織情報（name, slug, description）
- プラン（FREE/PRO/ENTERPRISE）
- Stripe連携
- カスタマイズ可能な設定（settings）
- ソフト削除対応

**リレーション:**
- `members` (1:N) - 組織メンバー
- `invitations` (1:N) - 招待
- `apiKeys` (1:N) - 組織APIキー
- `auditLogs` (1:N) - 監査ログ

#### OrganizationMember（組織メンバー）
- ロールベースアクセス制御（OWNER/ADMIN/MEMBER）
- ユーザーと組織の多対多関係を管理

#### Invitation（招待）
- メールベースの招待システム
- ステータス管理（PENDING/ACCEPTED/EXPIRED/REVOKED）
- セキュアなトークン生成
- 有効期限管理

#### ApiKey（APIキー）
- プログラマティックアクセス用
- セキュアなキー管理（SHA-256ハッシュ化）
- スコープベースの権限管理
- 使用状況トラッキング
- 有効期限と失効管理

#### AuditLog（監査ログ）
- すべてのアクション追跡
- ユーザー/組織レベルの記録
- IPアドレス、UserAgent記録
- メタデータ保存

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

## Example Flows（実装された垂直スライス）

### 1. User Profile Management（ユーザープロフィール管理）

完全に動作するエンドツーエンドの機能実装例：

#### ユーザー登録とプロフィール管理
1. http://localhost:3000/auth/signup にアクセス
2. 名前、メール、パスワードを入力
3. アカウント作成後、自動的にダッシュボードへリダイレクト
4. http://localhost:3000/settings でプロフィール編集

### 2. Organization Management（組織管理）

マルチテナント機能の完全実装：

#### 組織の作成
1. http://localhost:3000/organizations にアクセス
2. 「新規作成」ボタンをクリック
3. 組織名、スラッグ、説明を入力
4. 作成者は自動的にOWNERロールで登録

#### メンバー招待
1. 組織詳細ページで「メンバーを招待」をクリック
2. メールアドレスとロール（MEMBER/ADMIN/OWNER）を選択
3. 招待メールが送信される（開発環境ではログに表示）
4. 招待を受けたユーザーは招待を承諾して組織に参加

#### ロールベースアクセス制御
- **OWNER**: 組織の削除、全ての管理操作
- **ADMIN**: メンバー管理、招待送信、組織設定変更
- **MEMBER**: 組織の閲覧のみ

### 3. API Key Management（APIキー管理）

プログラマティックアクセスの実装：

#### APIキーの作成
1. http://localhost:3000/settings/api-keys にアクセス
2. 「新規作成」ボタンをクリック
3. キー名を入力
4. 生成されたキーを安全に保存（一度だけ表示）

#### APIキーの使用
```bash
# APIキーでの認証（実装例）
curl -X GET http://localhost:3000/api/protected-endpoint \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### デモアカウント

Seedスクリプトにより、以下のリッチなデモデータが作成されます:

#### ユーザーアカウント（全てのパスワード: demo1234）

| Email | Name | Plan | 所属組織 | ロール |
|-------|------|------|---------|--------|
| alice@example.com | Alice Johnson | FREE | Creative Design Agency | OWNER |
| alice@example.com | | | Tech Startup Inc. | ADMIN |
| bob@example.com | Bob Smith | PRO | Tech Startup Inc. | OWNER |
| bob@example.com | | | Enterprise Solutions Corp | ADMIN |
| carol@example.com | Carol Williams | PRO | Tech Startup Inc. | MEMBER |
| david@example.com | David Brown | FREE | Creative Design Agency | MEMBER |
| emma@example.com | Emma Davis | ENTERPRISE | Enterprise Solutions Corp | OWNER |

#### 組織

| 組織名 | スラッグ | プラン | メンバー数 |
|-------|---------|--------|-----------|
| Tech Startup Inc. | tech-startup | PRO | 3 |
| Creative Design Agency | creative-design | FREE | 2 |
| Enterprise Solutions Corp | enterprise-solutions | ENTERPRISE | 2 |

#### その他のデータ
- **招待**: 2件（保留中）+ 1件（期限切れ）
- **APIキー**: 3件（2件アクティブ、1件失効済み）
- **監査ログ**: 6件（様々なアクション記録）

**推奨シナリオ:**
1. bob@example.com でログインして Tech Startup を管理
2. alice@example.com でログインして複数組織のワークフローを体験
3. APIキーを作成してプログラマティックアクセスをテスト
4. 監査ログでセキュリティトラッキングを確認

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

### Organization Management
- `GET /api/organizations` - ユーザーの組織一覧取得
- `POST /api/organizations` - 新規組織作成
- `GET /api/organizations/:id` - 組織詳細取得
- `PATCH /api/organizations/:id` - 組織情報更新
- `DELETE /api/organizations/:id` - 組織削除（ソフトデリート）

### Member Management
- `GET /api/organizations/:id/members` - メンバー一覧取得
- `POST /api/organizations/:id/members` - メンバー追加
- `PATCH /api/organizations/:id/members/:userId` - メンバーロール更新
- `DELETE /api/organizations/:id/members/:userId` - メンバー削除

### Invitation Management
- `GET /api/organizations/:id/invitations` - 組織の招待一覧
- `POST /api/organizations/:id/invitations` - 新規招待送信
- `GET /api/invitations/me` - 自分宛の招待一覧
- `POST /api/invitations/accept` - 招待を承諾
- `DELETE /api/invitations/:id` - 招待を取り消し

### API Key Management
- `GET /api/api-keys` - APIキー一覧取得
- `POST /api/api-keys` - 新規APIキー作成
- `DELETE /api/api-keys/:id` - APIキー失効

### Authentication
- `POST /api/auth/signup` - 新規ユーザー登録
- NextAuth endpoints: `/api/auth/*`

### Stripe
- `POST /api/stripe/checkout` - Checkout Session作成
- `POST /api/stripe/portal` - Customer Portal Session作成
- `POST /api/webhooks/stripe` - Stripe Webhook受信

### レスポンス形式

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

**権限エラー:**
```json
{
  "success": false,
  "error": {
    "message": "この操作を実行する権限がありません",
    "code": "FORBIDDEN"
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

#### ライブラリ・ユーティリティ
- `src/lib/__tests__/validations.test.ts` - バリデーションロジック
- `src/lib/__tests__/api-response.test.ts` - APIレスポンス処理
- `src/lib/__tests__/logger.test.ts` - ロギング機能
- `src/lib/__tests__/metrics.test.ts` - メトリクス収集
- `src/lib/events/__tests__/bus.test.ts` - イベントバス

#### サービス層
- `src/services/__tests__/organization.service.test.ts` - 組織管理ロジック
- `src/services/__tests__/invitation.service.test.ts` - 招待システム
- `src/services/__tests__/api-key.service.test.ts` - APIキー管理

**テストカバレッジ:**
- ビジネスロジック
- バリデーション
- エラーハンドリング
- 権限チェック
- 非同期処理

## Project Structure（プロジェクト構造）

```
saas-nextjs-starter-jp/
├── docs/
│   └── PHASE3_OVERVIEW.md      # 🚀 Phase 3実装計画
├── prisma/
│   ├── schema.prisma           # データベーススキーマ（拡張）
│   └── seed.ts                 # 🚀 リッチなSeedデータ
├── src/
│   ├── app/
│   │   ├── (authenticated)/
│   │   │   ├── dashboard/
│   │   │   ├── billing/
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx           # プロフィール設定
│   │   │   │   └── api-keys/          # 🚀 APIキー管理
│   │   │   └── organizations/         # 🚀 組織管理
│   │   │       ├── page.tsx           # 組織一覧
│   │   │       ├── new/               # 新規作成
│   │   │       └── [id]/              # 組織詳細
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── organizations/         # 🚀 組織API
│   │   │   │   └── [id]/
│   │   │   │       ├── members/       # メンバー管理
│   │   │   │       └── invitations/   # 招待管理
│   │   │   ├── invitations/           # 🚀 招待API
│   │   │   ├── api-keys/              # 🚀 APIキーAPI
│   │   │   ├── stripe/
│   │   │   └── webhooks/
│   │   └── auth/
│   ├── components/
│   │   ├── ui/
│   │   └── nav.tsx                     # 🚀 組織リンク追加
│   ├── lib/
│   │   ├── __tests__/                  # 🚀 拡充されたテスト
│   │   │   ├── validations.test.ts
│   │   │   ├── api-response.test.ts
│   │   │   ├── logger.test.ts
│   │   │   └── metrics.test.ts
│   │   ├── adapters/                   # 🚀 プラガブル拡張ポイント
│   │   │   ├── email.ts               # メールアダプター
│   │   │   ├── storage.ts             # ストレージアダプター
│   │   │   └── analytics.ts           # 分析アダプター
│   │   ├── events/                     # 🚀 イベント駆動
│   │   │   ├── types.ts               # ドメインイベント定義
│   │   │   ├── bus.ts                 # イベントバス
│   │   │   └── __tests__/
│   │   ├── validations/
│   │   │   ├── user.ts
│   │   │   ├── organization.ts        # 🚀 組織バリデーション
│   │   │   └── api-key.ts             # 🚀 APIキーバリデーション
│   │   ├── api-response.ts
│   │   ├── logger.ts                   # 🚀 構造化ロギング
│   │   ├── metrics.ts                  # 🚀 メトリクス収集
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── stripe.ts
│   ├── services/                       # 🚀 ビジネスロジック層
│   │   ├── __tests__/
│   │   │   ├── organization.service.test.ts
│   │   │   ├── invitation.service.test.ts
│   │   │   └── api-key.service.test.ts
│   │   ├── organization.service.ts
│   │   ├── invitation.service.ts
│   │   └── api-key.service.ts
│   └── hooks/
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── vitest.config.ts
└── README.md
```

🚀 = Phase 3で追加/強化された部分

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

## Architecture Highlights（アーキテクチャのハイライト）

### 拡張可能な設計

#### Adapter Pattern（アダプターパターン）
外部サービスとの統合を簡単に切り替え可能:
- **Email**: Stub → Resend / SendGrid / AWS SES
- **Storage**: In-Memory → AWS S3 / GCS / Azure Blob
- **Analytics**: Stub → PostHog / Mixpanel / Amplitude

#### Event-Driven Architecture（イベント駆動）
- 20種類以上の型付きドメインイベント
- デカップリングされたイベントハンドラー
- 将来的にメッセージキュー（Redis, RabbitMQ）への拡張が容易

#### Observability（可観測性）
- **Logging**: 構造化ログ、コンテキスト伝播
- **Metrics**: カウンター、ゲージ、タイミング測定
- **Audit Logs**: 全アクションの追跡

### セキュリティ

- **Role-Based Access Control**: 階層的な権限管理
- **API Key Hashing**: SHA-256ハッシュ化
- **Soft Delete**: データ保持とリカバリー
- **Audit Trail**: 完全な操作履歴

### Code Quality（コード品質）

- **Type Safety**: Prisma + Zod + TypeScript
- **Testing**: 包括的なユニットテスト
- **Validation**: すべてのAPI入力を検証
- **Error Handling**: 統一されたエラーレスポンス

## Future Extensions（今後の拡張案）

このスターターをベースに以下のような機能を追加できます：

### 認証関連
- [ ] メール認証（メールアドレス確認）
- [ ] パスワードリセット機能
- [ ] OAuth プロバイダー追加（Google、GitHub等）
- [ ] 二要素認証（2FA）

### ユーザー管理
- [ ] プロフィール画像アップロード（Storageアダプター使用）
- [ ] アカウント削除機能（完全削除）
- [ ] メール通知設定

### 組織機能拡張
- [x] マルチテナント対応（✅ 実装済み）
- [x] チーム招待機能（✅ 実装済み）
- [x] ロールベースアクセス制御（✅ 実装済み）
- [ ] 組織間のリソース共有
- [ ] サブ組織/階層構造

### 課金機能拡張
- [ ] 年間プラン追加
- [ ] 使用量ベース課金
- [ ] クーポン/プロモーションコード
- [ ] 請求書PDF生成

### 管理機能
- [ ] 管理者ダッシュボード（全組織管理）
- [ ] ユーザー管理画面（検索、フィルタ）
- [x] アクティビティログ（✅ 監査ログ実装済み）
- [x] メトリクス・分析基盤（✅ メトリクス実装済み）

### 開発者体験
- [x] ユニットテスト（✅ Vitest実装済み）
- [ ] E2Eテスト（Playwright）
- [ ] Storybookによるコンポーネントカタログ
- [ ] CI/CDパイプライン（GitHub Actions）
- [ ] API ドキュメント自動生成（OpenAPI/Swagger）

### 統合
- [ ] Emailアダプター実装（ResendなどのEmailアダプター実装、Stub→本番切替）
- [ ] Storageアダプター実装（S3などのStorageアダプター実装、ファイルアップロード機能）
- [ ] Analyticsアダプター実装（PostHogなどのAnalytics統合、イベントトラッキング）
- [ ] Webhooks出力（外部システムへのイベント通知）

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

**🎉 Phase 3 完了 - エンタープライズグレードのSaaSスターター**

このリポジトリは、実際のエンタープライズSaaSプロダクトの開発基盤として使用できます。

**実装済み機能:**
- ✅ マルチテナント（組織管理）
- ✅ ロールベースアクセス制御（RBAC）
- ✅ 招待システム（メールベース）
- ✅ APIキー管理（プログラマティックアクセス）
- ✅ 監査ログ（セキュリティトラッキング）
- ✅ 構造化ロギング＆メトリクス
- ✅ イベント駆動アーキテクチャ
- ✅ プラガブルアダプター（Email, Storage, Analytics）
- ✅ 包括的なテストスイート
- ✅ リッチなシードデータ
- ✅ Docker環境完備

**詳細:** `docs/PHASE3_OVERVIEW.md` を参照してください。
