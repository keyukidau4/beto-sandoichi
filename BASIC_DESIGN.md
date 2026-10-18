# Bánh mì App - 基本設計書

## 1. プロジェクト概要

### 1.1 目的
本プロジェクトは、ベトナムの伝統的なサンドイッチ「バインミー（Bánh mì）」をオンラインで注文・配送できるWebアプリケーションを開発することを目的としています。ユーザーは商品を閲覧・カートに追加・注文でき、管理者は商品・注文・在庫を管理できます。

### 1.2 ターゲットユーザー
- 一般ユーザー：バインミーを注文したい顧客
- 管理者：店舗の運営・管理を行う担当者

### 1.3 スコープ
- ユーザー認証（登録・ログイン・パスワード再設定）
- 商品カタログ（カテゴリ別表示・商品詳細）
- ショッピングカート・チェックアウト機能
- 注文管理（ユーザー側：履歴・詳細、管理者側：ステータス更新）
- 配送先管理（住所登録・選択）
- 管理者ダッシュボード（商品管理・注文管理・ユーザー管理）
- レスポンシブデザイン（PC・タブレット・スマホ対応）

### 1.4 技術スタック
| カテゴリ | 技術 | 備考 |
|---|---|---|
| フロントエンド | React.js + Vite | SPA構築 |
| UIフレームワーク | Tailwind CSS | スタイリング |
| バックエンド | Node.js + Express.js | REST API |
| データベース | MongoDB (Mongoose) | NoSQL |
| 認証 | JWT (JSON Web Token) | アクセストークン |
| ファイルアップロード | Cloudinary | 商品画像の保存 |
| 決済 | なし（現金支払い・配送時決済想定） | MVP範囲内 |
| その他 | dotenv, cors, bcryptjs, axios | 基本ライブラリ |

## 2. システムアーキテクチャ

### 2.1 全体構成図
```
[ブラウザ（フロントエンド）] <-> [APIサーバー（Express）] <-> [MongoDB]
                              <-> [Cloudinary（画像）]
```

### 2.2 ディレクトリ構造

#### バックエンド (`backend/`)
```
backend/
├── config/          # DB接続・設定
├── controllers/     # ビジネスロジック
├── middlewares/     # 認証・権限・エラーハンドリング
├── models/          # Mongooseスキーマ
├── routes/          # APIルート定義
├── utils/           # ヘルパー関数
├── validations/     # 入力バリデーション
├── uploads/         # 一時アップロード用（ローカル開発時）
├── server.js        # エントリーポイント
└── .env             # 環境変数
```

#### フロントエンド (`frontend/`)
```
frontend/
├── src/
│   ├── assets/      # 静的ファイル
│   ├── components/  # 再利用可能コンポーネント
│   ├── contexts/    # Context API（Auth, Cart等）
│   ├── hooks/       # カスタムフック
│   ├── layouts/     # レイアウトコンポーネント
│   ├── pages/       # ページコンポーネント
│   ├── routes/      # ルーティング設定
│   ├── services/    # API呼び出し（axios）
│   ├── utils/       # ユーティリティ関数
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── tailwind.config.js
└── vite.config.js
```

## 3. データベース設計

### 3.1 User（ユーザー）
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| _id | ObjectId | ○ | 主キー |
| name | String | ○ | 氏名 |
| email | String | ○ | メールアドレス（一意） |
| password | String | ○ | ハッシュ化されたパスワード |
| phone | String | × | 電話番号 |
| role | String | ○ | `user` または `admin`（デフォルト: `user`） |
| addresses | [Address] | × | 配送先一覧 |
| isVerified | Boolean | ○ | メール認証済みフラグ（将来拡張用） |
| createdAt | Date | ○ | 作成日時 |
| updatedAt | Date | ○ | 更新日時 |

#### Addressサブスキーマ
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| fullName | String | ○ | 宛名 |
| phone | String | ○ | 電話番号 |
| addressLine | String | ○ | 詳細住所 |
| ward | String | ○ | 区・町 |
| district | String | ○ | 郡・区 |
| city | String | ○ | 都市・省 |
| isDefault | Boolean | ○ | デフォルト住所フラグ |

### 3.2 Category（カテゴリ）
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| _id | ObjectId | ○ | 主キー |
| name | String | ○ | カテゴリ名（一意） |
| slug | String | ○ | URL用スラッグ（一意） |
| description | String | × | 説明文 |
| image | String | × | カテゴリ画像URL |
| isActive | Boolean | ○ | 有効フラグ（デフォルト: true） |
| createdAt | Date | ○ | 作成日時 |
| updatedAt | Date | ○ | 更新日時 |

### 3.3 Product（商品）
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| _id | ObjectId | ○ | 主キー |
| name | String | ○ | 商品名 |
| slug | String | ○ | スラッグ（一意） |
| description | String | × | 商品説明 |
| price | Number | ○ | 価格（VND） |
| category | ObjectId | ○ | Categoryへの参照 |
| images | [String] | × | 商品画像URL配列 |
| stock | Number | ○ | 在庫数（デフォルト: 0） |
| isActive | Boolean | ○ | 販売中フラグ（デフォルト: true） |
| sold | Number | ○ | 販売数（デフォルト: 0） |
| createdAt | Date | ○ | 作成日時 |
| updatedAt | Date | ○ | 更新日時 |

### 3.4 Cart（カート）
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| _id | ObjectId | ○ | 主キー |
| user | ObjectId | ○ | Userへの参照（一意） |
| items | [CartItem] | ○ | カート商品リスト |
| createdAt | Date | ○ | 作成日時 |
| updatedAt | Date | ○ | 更新日時 |

#### CartItemサブスキーマ
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| product | ObjectId | ○ | Productへの参照 |
| quantity | Number | ○ | 数量（最小: 1） |
| price | Number | ○ | 注文時価格（価格変動対策） |

### 3.5 Order（注文）
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| _id | ObjectId | ○ | 主キー |
| orderNumber | String | ○ | 注文番号（一意、自動生成） |
| user | ObjectId | ○ | Userへの参照 |
| items | [OrderItem] | ○ | 注文商品リスト |
| shippingAddress | Address | ○ | 配送先情報（スナップショット） |
| paymentMethod | String | ○ | 支払い方法（`cod`） |
| paymentStatus | String | ○ | 支払い状況（`pending`/`paid`/`failed`） |
| orderStatus | String | ○ | 注文状況（`pending`/`confirmed`/`preparing`/`shipping`/`delivered`/`cancelled`） |
| subtotal | Number | ○ | 小計 |
| shippingFee | Number | ○ | 配送料 |
| discount | Number | ○ | 割引額（デフォルト: 0） |
| total | Number | ○ | 合計金額 |
| note | String | × | 備考 |
| cancelledBy | ObjectId | × | キャンセル実行者（User） |
| cancelReason | String | × | キャンセル理由 |
| createdAt | Date | ○ | 作成日時 |
| updatedAt | Date | ○ | 更新日時 |

#### OrderItemサブスキーマ
| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| product | ObjectId | ○ | Productへの参照 |
| productName | String | ○ | 商品名（スナップショット） |
| image | String | ○ | 商品画像（スナップショット） |
| quantity | Number | ○ | 数量 |
| price | Number | ○ | 単価（スナップショット） |

## 4. API設計

### 4.1 認証API
| メソッド | エンドポイント | 説明 | 権限 |
|---|---|---|---|
| POST | `/api/auth/register` | ユーザー登録 | 公開 |
| POST | `/api/auth/login` | ログイン | 公開 |
| POST | `/api/auth/logout` | ログアウト | 認証済み |
| GET | `/api/auth/me` | 現在のユーザー情報取得 | 認証済み |
| PUT | `/api/auth/change-password` | パスワード変更 | 認証済み |
| POST | `/api/auth/forgot-password` | パスワード再設定要求 | 公開 |
| POST | `/api/auth/reset-password` | パスワード再設定 | 公開 |

### 4.2 ユーザーAPI
| メソッド | エンドポイント | 説明 | 権限 |
|---|---|---|---|
| GET | `/api/users/profile` | プロフィール取得 | 認証済み |
| PUT | `/api/users/profile` | プロフィール更新 | 認証済み |
| POST | `/api/users/addresses` | 配送先追加 | 認証済み |
| PUT | `/api/users/addresses/:id` | 配送先更新 | 認証済み |
| DELETE | `/api/users/addresses/:id` | 配送先削除 | 認証済み |
| PUT | `/api/users/addresses/:id/default` | デフォルト配送先設定 | 認証済み |

### 4.3 カテゴリAPI
| メソッド | エンドポイント | 説明 | 権限 |
|---|---|---|---|
| GET | `/api/categories` | カテゴリ一覧取得 | 公開 |
| GET | `/api/categories/:slug` | カテゴリ詳細取得 | 公開 |
| POST | `/api/categories` | カテゴリ作成 | 管理者 |
| PUT | `/api/categories/:id` | カテゴリ更新 | 管理者 |
| DELETE | `/api/categories/:id` | カテゴリ削除 | 管理者 |

### 4.4 商品API
| メソッド | エンドポイント | 説明 | 権限 |
|---|---|---|---|
| GET | `/api/products` | 商品一覧取得（検索・フィルタ・ページネーション） | 公開 |
| GET | `/api/products/:slug` | 商品詳細取得 | 公開 |
| POST | `/api/products` | 商品作成 | 管理者 |
| PUT | `/api/products/:id` | 商品更新 | 管理者 |
| DELETE | `/api/products/:id` | 商品削除 | 管理者 |
| PUT | `/api/products/:id/stock` | 在庫更新 | 管理者 |

### 4.5 カートAPI
| メソッド | エンドポイント | 説明 | 権限 |
|---|---|---|---|
| GET | `/api/cart` | カート取得 | 認証済み |
| POST | `/api/cart/add` | 商品をカートに追加 | 認証済み |
| PUT | `/api/cart/update` | カート内数量更新 | 認証済み |
| DELETE | `/api/cart/remove/:productId` | カートから商品削除 | 認証済み |
| DELETE | `/api/cart/clear` | カート空にする | 認証済み |

### 4.6 注文API
| メソッド | エンドポイント | 説明 | 権限 |
|---|---|---|---|
| POST | `/api/orders` | 注文作成 | 認証済み |
| GET | `/api/orders/my-orders` | 自分の注文履歴 | 認証済み |
| GET | `/api/orders/:id` | 注文詳細取得 | 認証済み |
| PUT | `/api/orders/:id/cancel` | 注文キャンセル | 認証済み（自分の注文のみ・条件付き） |
| GET | `/api/orders` | 全注文一覧 | 管理者 |
| PUT | `/api/orders/:id/status` | 注文ステータス更新 | 管理者 |

## 5. 機能要件詳細

### 5.1 認証機能
- メール・パスワードによる登録
- bcryptjsによるパスワードハッシュ化
- JWT（access token）による認証
- ログイン状態の維持（フロント側でlocalStorage管理）
- 認可：管理者専用ルートはroleチェック必須
- パスワード変更・再設定機能

### 5.2 商品機能
- カテゴリ別フィルタリング
- キーワード検索（商品名・説明）
- ソート（価格昇順・降順、新着順、人気順）
- ページネーション
- 在庫チェック（在庫切れ時は購入不可）
- 商品画像表示

### 5.3 カート機能
- 未ログイン時：localStorageに一時保存（オプション）またはログイン要求
- ログイン時：DBに保存
- 数量変更・削除
- 在庫超過時のバリデーション
- 合計金額自動計算

### 5.4 注文機能
- チェックアウト時：配送先選択必須
- 注文作成時に商品情報・価格をスナップショット保存
- 在庫の減少処理（トランザクション考慮推奨）
- 注文番号の自動生成（例：`BM-20261018-XXXXXX`）
- 注文状況の追跡

### 5.5 管理者機能
- ダッシュボード：総売上・注文数・商品数・ユーザー数の統計
- 商品CRUD（画像アップロード含む）
- カテゴリCRUD
- 注文管理：ステータス変更（pending→confirmed→preparing→shipping→delivered）
- ユーザー一覧・権限変更（任意）

## 6. フロントエンド画面設計

### 6.1 画面一覧
| 画面ID | 画面名 | 説明 | 権限 |
|---|---|---|---|
| P01 | ホーム | メインビジュアル・新着商品・カテゴリ | 公開 |
| P02 | 商品一覧 | 商品検索・フィルタ・ページネーション | 公開 |
| P03 | 商品詳細 | 商品情報・カート追加 | 公開 |
| P04 | ログイン | ログインフォーム | 公開 |
| P05 | 登録 | 会員登録フォーム | 公開 |
| P06 | カート | カート内容確認 | 認証済み |
| P07 | チェックアウト | 配送先・注文確定 | 認証済み |
| P08 | マイページ | プロフィール・配送先・注文履歴 | 認証済み |
| P09 | 注文詳細 | 注文内容・状況 | 認証済み |
| P10 | 管理者ダッシュボード | 統計情報 | 管理者 |
| P11 | 管理者 - 商品管理 | 商品一覧・作成・編集 | 管理者 |
| P12 | 管理者 - カテゴリ管理 | カテゴリ管理 | 管理者 |
| P13 | 管理者 - 注文管理 | 注文一覧・ステータス更新 | 管理者 |
| P14 | 管理者 - ユーザー管理 | ユーザー一覧 | 管理者 |

### 6.2 ルーティング構成
- `/` - ホーム
- `/products` - 商品一覧
- `/products/:slug` - 商品詳細
- `/login` - ログイン
- `/register` - 登録
- `/cart` - カート（保護）
- `/checkout` - チェックアウト（保護）
- `/account/profile` - プロフィール（保護）
- `/account/orders` - 注文履歴（保護）
- `/account/orders/:id` - 注文詳細（保護）
- `/admin` - ダッシュボード（管理者専用）
- `/admin/products` - 商品管理（管理者専用）
- `/admin/categories` - カテゴリ管理（管理者専用）
- `/admin/orders` - 注文管理（管理者専用）
- `/admin/users` - ユーザー管理（管理者専用）

## 7. 認証・認可

### 7.1 認証方式
- JWTベース認証
- トークンの保存場所：`localStorage`（アクセストークン）
- リクエストヘッダー：`Authorization: Bearer <token>`

### 7.2 認可ミドルウェア
- `authMiddleware`：トークン検証・`req.user`設定
- `adminMiddleware`：`req.user.role === 'admin'`チェック

### 7.3 セキュリティ対策
- パスワードのbcryptハッシュ化（salt rounds: 10）
- CORS設定
- `express.json`等の適切なボディパーサー
- 入力バリデーション（必須項目・型・長さ）
- 環境変数での機密情報管理（JWT_SECRET, DB_URI等）
- XSS/CSRF対策（基本的なヘッダー設定）

## 8. バリデーションルール

### 8.1 ユーザー登録
- name: 必須、2〜50文字
- email: 必須、メール形式、一意
- password: 必須、6〜32文字（英数字混在推奨）
- phone: 任意、電話番号形式

### 8.2 商品作成・更新
- name: 必須、3〜100文字
- price: 必須、正の数値
- category: 必須、有効なObjectId
- stock: 必須、0以上の整数
- images: 任意、URL形式

### 8.3 注文作成
- shippingAddressId: 必須、有効な配送先
- paymentMethod: 必須、`cod`
- note: 任意、最大500文字

## 9. エラーハンドリング

### 9.1 共通エラーレスポンス形式
```json
{
  "success": false,
  "message": "エラーメッセージ",
  "errors": [] // バリデーションエラー時
}
```

### 9.2 ステータスコード
| コード | 説明 |
|---|---|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | 不正なリクエスト（バリデーションエラー等） |
| 401 | 未認証 |
| 403 | 権限なし |
| 404 | リソースが見つからない |
| 409 | 競合（重複データ等） |
| 500 | サーバー内部エラー |

## 10. 開発環境設定

### 10.1 必要な環境変数（バックエンド）
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/banhmi_app
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

### 10.2 必要な環境変数（フロントエンド）
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 10.3 セットアップ手順
1. リポジトリをクローン
2. `backend/`で`npm install`
3. `frontend/`で`npm install`
4. `.env`ファイルを各ディレクトリに作成
5. MongoDBを起動
6. バックエンド起動：`npm run dev`
7. フロントエンド起動：`npm run dev`

## 11. テスト計画（MVP）

| テスト項目 | 優先度 | 備考 |
|---|---|---|
| 認証フロー（登録・ログイン） | 高 | 基本機能 |
| 商品閲覧・検索・フィルタ | 高 | 顧客向け主要機能 |
| カート・チェックアウト | 高 | 購入フロー |
| 注文作成・履歴表示 | 高 | コア業務 |
| 管理者：商品管理 | 高 | 運営必須 |
| 管理者：注文ステータス更新 | 高 | 運営必須 |
| 在庫バリデーション | 中〜高 | エラー防止 |
| 権限チェック（管理者専用） | 高 | セキュリティ |

## 12. 今後の拡張案

- 決済ゲートウェイ統合（VNPay、Momo等）
- メール通知（注文確定・配送状況等）
- レビュー・評価機能
- プロモーション・クーポン
- 多言語対応（ベトナム語・英語・日本語）
- PWA対応（モバイルアプリ的な体験）
- リアルタイム通知（Socket.io）
- 分析ダッシュボード（売上チャート等）
- 配送追跡機能

## 13. 実装上の注意点

- 注文作成時は在庫更新と同時に行うため、原子的処理（MongoDBトランザクション）を検討
- 価格・在庫はサーバー側で再計算・検証する（フロント改ざん対策）
- 画像アップロードはCloudinaryを使用し、ファイルサイズ・形式を制限
- 管理者権限は必ずサーバー側で検証
- API応答は一貫した形式を維持
- エラーログは開発・本番環境で適切に記録（本番は最小限）

## 14. 初期データ（シード）

開発用に以下の初期データを作成する予定：
- 管理者アカウント（admin@example.com）
- 基本カテゴリ（バインミー、飲み物、サイド等）
- サンプル商品（代表的なバインミー各種）

---

**ドキュメントバージョン**: 1.0  
**最終更新日**: 2025-10-18  
**作成者**: Development Team