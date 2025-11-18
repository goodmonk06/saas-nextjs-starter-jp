# SaaS Starter JP

日本向けSaaSの汎用スターター。認証・課金・ユーザー管理・管理画面までをまとめた土台。

## 技術スタック

- **Next.js 14** (App Router)
- **TypeScript**
- **NextAuth.js** - 認証
- **Prisma** - ORM
- **PostgreSQL** - データベース
- **Stripe** - サブスクリプション課金
- **Tailwind CSS** + **shadcn/ui** - UI

## 主な機能

### 認証
- メールアドレス＋パスワードでのサインアップ/ログイン
- NextAuth.jsを使用したセッション管理
- 認証ミドルウェアによるルート保護

### サブスクリプション課金
- **Freeプラン** と **Proプラン** (月額)
- Stripe Checkoutによる決済フロー
- Stripe Webhookによる自動プラン更新
- サブスクリプション管理画面（Stripe Customer Portal）

### ページ構成
- `/` - ランディングページ
- `/auth/signin` - ログイン
- `/auth/signup` - 新規登録
- `/dashboard` - ダッシュボード（認証必須）
- `/billing` - 課金管理（認証必須）
- `/settings` - アカウント設定（認証必須）

## セットアップ

### 1. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、必要な値を設定してください。

```bash
cp .env.example .env
```

必要な環境変数：
- `DATABASE_URL` - PostgreSQL接続URL
- `NEXTAUTH_URL` - アプリケーションURL
- `NEXTAUTH_SECRET` - NextAuthシークレット（`openssl rand -base64 32` で生成）
- `STRIPE_SECRET_KEY` - StripeシークレットキーSTRIPE_WEBHOOK_SECRET` - Stripe WebhookシークレットNEXT_PUBLIC_STRIPE_PRO_PRICE_ID` - StripeプライスID（Proプラン）
- `NEXT_PUBLIC_APP_URL` - アプリケーションURL（フロントエンド用）

### 2. 依存関係のインストール

```bash
npm install
# または
yarn install
# または
pnpm install
```

### 3. データベースのセットアップ

```bash
# Prismaマイグレーション実行
npx prisma migrate dev

# Prisma Clientの生成
npx prisma generate
```

### 4. Stripeの設定

1. [Stripe Dashboard](https://dashboard.stripe.com/) でアカウントを作成
2. テスト環境のAPIキーを取得
3. Productsページで「Pro」プランを作成（月額課金）
4. プライスIDを `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` に設定
5. Webhookエンドポイントを設定: `https://your-domain.com/api/webhooks/stripe`
   - イベント: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 5. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
```

http://localhost:3000 でアプリケーションが起動します。

## プロダクト派生時の注意点

このスターターから自社プロダクトを派生させる際の重要なポイント：

### セキュリティ

- **環境変数の管理**
  - `.env` ファイルは絶対にGitにコミットしない
  - 本番環境では強力な `NEXTAUTH_SECRET` を使用する
  - Stripeのキーは必ずテスト環境と本番環境を分ける

- **認証の強化**
  - パスワードポリシーの見直し（現在は8文字以上のみ）
  - メール認証の追加を検討
  - 2要素認証（2FA）の実装を検討
  - レート制限の実装（ブルートフォース対策）

- **CORS設定**
  - 本番環境では適切なCORS設定を行う
  - `NEXT_PUBLIC_APP_URL` を本番URLに変更する

### データベース

- **本番データベース**
  - PostgreSQLの本番環境を用意（Railway、Supabase、AWS RDSなど）
  - バックアップ戦略を立てる
  - マイグレーションの管理方法を決める

- **スキーマのカスタマイズ**
  - `prisma/schema.prisma` を自社要件に合わせて変更
  - 必要に応じてモデルを追加（例: Team, Project, Invitationなど）
  - インデックスを適切に設定してパフォーマンスを最適化

### Stripe課金

- **プランのカスタマイズ**
  - 料金、機能、制限を自社プロダクトに合わせて変更
  - 複数のプラン（Basic, Pro, Enterpriseなど）への対応
  - 年間プランの追加を検討

- **Webhook**
  - 本番環境では必ずWebhookシークレットを設定する
  - Webhookの署名検証を必ず行う（実装済み）
  - リトライ処理とエラーハンドリングを強化

- **テスト**
  - Stripe CLIを使用してローカルでWebhookをテスト
  - テストモードで十分にテストしてから本番移行

### UI/UX

- **ブランディング**
  - ロゴ、カラースキーム、フォントを変更
  - `tailwind.config.ts` でテーマカラーをカスタマイズ
  - OGP画像、ファビコンを設定

- **多言語対応**
  - 必要に応じてi18n（国際化）を実装
  - next-intlなどのライブラリを検討

- **レスポンシブ対応**
  - モバイルファーストで設計
  - 各画面サイズで動作確認

### 機能拡張

- **追加すべき機能の例**
  - プロフィール編集
  - パスワードリセット
  - メール通知機能
  - チーム/組織管理（マルチテナント化）
  - 使用量制限（プランごとの機能制限）
  - アクティビティログ
  - 管理者ダッシュボード

### パフォーマンス

- **最適化**
  - 画像の最適化（Next.js Image コンポーネント活用）
  - Server Componentsを活用してクライアント側のJSを削減
  - データベースクエリの最適化
  - キャッシング戦略の実装

### 監視・ログ

- **エラートラッキング**
  - Sentry、Bugsnagなどのエラートラッキングツールを導入
  - ログ収集・分析の仕組みを構築

- **アナリティクス**
  - Google Analytics、Plausibleなどのアナリティクスツールを導入
  - ユーザー行動の追跡と分析

### コンプライアンス

- **法的要件**
  - プライバシーポリシー、利用規約の作成
  - GDPR、個人情報保護法への対応
  - 特定商取引法に基づく表記（日本）

- **決済関連**
  - Stripeの利用規約を確認
  - 返金ポリシーの策定

### デプロイ

- **推奨プラットフォーム**
  - Vercel（Next.js最適化済み）
  - Railway（フルスタック対応）
  - AWS、GCPなどのクラウドプロバイダー

- **CI/CD**
  - GitHub Actionsなどで自動デプロイを設定
  - ステージング環境と本番環境を分ける
  - デプロイ前のテスト自動化

## ディレクトリ構造

```
saas-nextjs-starter-jp/
├── prisma/
│   └── schema.prisma          # データベーススキーマ
├── src/
│   ├── app/
│   │   ├── (authenticated)/   # 認証必須ページ
│   │   │   ├── dashboard/
│   │   │   ├── billing/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth + サインアップ
│   │   │   ├── stripe/        # Stripe Checkout/Portal
│   │   │   └── webhooks/      # Stripe Webhook
│   │   ├── auth/              # 認証ページ
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui コンポーネント
│   │   └── nav.tsx            # ナビゲーション
│   ├── lib/
│   │   ├── auth.ts            # NextAuth設定
│   │   ├── prisma.ts          # Prismaクライアント
│   │   ├── stripe.ts          # Stripe設定
│   │   └── utils.ts           # ユーティリティ
│   ├── hooks/
│   │   └── use-toast.ts       # トースト通知
│   └── types/
│       └── next-auth.d.ts     # NextAuth型定義
├── .env.example
├── .gitignore
├── middleware.ts              # 認証ミドルウェア
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## よくある質問

### Q: データベースをMySQLに変更できますか？
A: はい。`prisma/schema.prisma` の `datasource db` を変更し、`DATABASE_URL` を更新してください。

### Q: Stripeの代わりに別の決済サービスを使えますか？
A: 可能です。`src/lib/stripe.ts` と関連APIルートを置き換える必要があります。

### Q: NextAuth以外の認証ライブラリを使いたいです
A: Clerk、Auth0、Supabase Authなどに置き換え可能です。認証ロジックを書き換えてください。

### Q: マルチテナント（チーム機能）を追加したいです
A: Prismaスキーマに `Team` モデルを追加し、ユーザーとチームの関連を定義してください。

## トラブルシューティング

### Prismaマイグレーションエラー
```bash
# マイグレーションをリセット
npx prisma migrate reset

# 再度マイグレーション実行
npx prisma migrate dev
```

### NextAuth セッションエラー
- `NEXTAUTH_SECRET` が設定されているか確認
- `NEXTAUTH_URL` が正しいか確認

### Stripe Webhookが動作しない
- Webhookシークレットが正しいか確認
- ローカル開発では Stripe CLI を使用

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## ライセンス

MIT

---

このスターターをベースに、素晴らしいSaaSプロダクトを作ってください！
