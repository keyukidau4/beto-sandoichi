# BanhMi App — バックエンド API

ベトナムサンドイッチ（バンミ）と飲み物のオンライン注文サービスの **バックエンド（REST API）** です。
日本市場を想定した飲食配送ビジネスを支えるサーバサイドを **Express + TypeScript + MongoDB** で実装しています。

---

## 1. プロジェクト概要

| 項目 | 内容 |
| --- | --- |
| サービス名 | BanhMi App（バンミアプリ） |
| 想定市場 | 日本国内（日本語表記の決済手段・住所形式に対応） |
| 業種 | 飲食店のオンライン注文・配送サービス |
| 提供価値 | 顧客：かんたん注文とポイント還元／店舗：受注・在庫・会員・メールの一体管理 |
| 対象ユーザー | 一般顧客（購入者）／店舗スタッフ／管理者 |

### ビジネスの特徴（日本市場向け）

- **代引き（代金引換）** — 日本で最も一般的な決済手段を第一決済として実装
- **ポイント制度** — 100円ごとに1ポイント付与。承認済み会員は **ポイント全額払い** が可能
- **振込（銀行振込）によるポイント付与** — 顧客が銀行振込でポイントを購入し、管理者が付与する業務フロー
- **承認制の会員管理** — 登録直後は「承認待ち（pending）」。管理者の承認後でないとポイント払い不可（不正利用の防止）
- **日本の住所形式** — 郵便番号を「3桁＋4桁（例：〒112-0014）」に分割して登録
- **メールマーケティング** — 承認通知・注文確認などの自動メールに加え、テンプレートベースの一括送信に対応

---

## 2. 技術スタック

| 技術 | 用途 |
| --- | --- |
| Express 5 + TypeScript | Web フレームワーク / 型安全な API 実装 |
| MongoDB + Mongoose 8 | ドキュメント DB / ODM |
| JWT + bcryptjs | 認証（httpOnly Cookie + パスワードハッシュ） |
| Joi | リクエストボディのバリデーション |
| Helmet / CORS / express-rate-limit | セキュリティヘッダ・CORS・レート制限 |
| Multer + Cloudinary | 商品画像のアップロード・CDN 保存 |
| Nodemailer / Mailtrap | 自動メール・メールマーケティング送信 |
| Winston / Morgan / prom-client | ログ・アクセスログ・メトリクス |
| Jest + Supertest + mongodb-memory-server | 単体テスト・統合テスト（実 DB 不要） |

---

## 3. アーキテクチャ全体像

```mermaid
flowchart TB
    subgraph Client["クライアント（フロントエンド / SPA）"]
        FE["React App :5173<br/>httpOnly Cookie で JWT を送信"]
    end

    subgraph Express["Express サーバ :5000"]
        subgraph MW["ミドルウェアチェーン"]
            SEC["securityHeaders → helmet → cors"]
            LIM["validateCommonPatterns → requestSizeLimiter → generalLimiter"]
            BODY["express.json / urlencoded → cookieParser → sanitizeInput"]
            LOG["requestLogger → securityLogger → apiUsageMonitor"]
            ERR["errorLogger → globalErrorHandler"]
        end

        subgraph Routes["ルーティング /api/*"]
            R1["auth"]
            R2["products"]
            R3["orders"]
            R4["points"]
            R5["users"]
            R6["admin / adminOrders"]
            R7["admin/email"]
            R8["staff"]
            R9["upload"]
        end

        subgraph Core["コア層"]
            CTRL["Controllers<br/>リクエスト/レスポンス処理"]
            SVC["Services<br/>PointService / StockService / Email 系サービス"]
            MDL["Models (Mongoose)<br/>User / BuyerProfile / Product / Order /<br/>PointTransaction / StockHistory / ProductView /<br/>ContactRequest / EmailTemplate / EmailHistory"]
        end
    end

    subgraph External["外部サービス"]
        DB[("MongoDB")]
        CLOUD["Cloudinary<br/>商品画像 CDN"]
        MAIL["SMTP / Mailtrap<br/>メール送信"]
    end

    FE -->|"fetch + credentials: include"| SEC
    SEC --> LIM --> BODY --> LOG --> Routes
    Routes --> CTRL --> SVC --> MDL
    MDL --> DB
    SVC --> CLOUD
    SVC --> MAIL
    Routes --> ERR

    style FE fill:#e1f5fe
    style SVC fill:#fff3e0
    style DB fill:#e8f5e9
```

### ディレクトリ構成

```
backend/src/
├── index.ts            # サーバ起動（ミドルウェア順序を定義）
├── config/             # database / cloudinary / email / environment
├── controllers/        # 各 API のリクエスト処理
├── middleware/         # auth, validation, security, monitoring, errorHandler
├── models/             # Mongoose スキーマ（soft delete: del_flg）
├── routes/             # 10 モジュールのルーティング
├── services/           # 業務ロジック（point / stock / email 系 7 サービス）
├── scripts/            # メールテンプレート初期投入
├── types/              # 型定義
└── utils/              # バリデーション・テストユーティリティ
```

---

## 4. API ルート一覧

```mermaid
flowchart LR
    subgraph AUTH["/api/auth — 認証"]
        A1["POST /register<br/>POST /login<br/>POST /logout<br/>GET /me"]
    end
    subgraph PROD["/api/products — 商品"]
        P1["GET / , GET /:id（公開）<br/>POST /:id/view（閲覧数計測）"]
        P2["POST / PUT / DELETE（admin）"]
    end
    subgraph ORD["/api/orders — 注文"]
        O1["POST / , GET / , GET /:id<br/>（購入者）"]
        O2["GET /admin/all<br/>PUT /:id/status（admin）"]
    end
    subgraph PT["/api/points — ポイント"]
        T1["GET /balance, /history<br/>POST /validate"]
        T2["admin: 付与・履歴・注文報酬"]
    end
    subgraph USR["/api/users — 会員・問合せ"]
        U1["POST /contact, GET /contact"]
        U2["admin: 一覧・統計・承認・<br/>一括更新・ポイント更新"]
    end
    subgraph ADM["/api/admin — 管理"]
        AD1["GET /analytics"]
        AD2["メールテンプレート CRUD<br/>send-email / users-for-email"]
    end
    subgraph EO["/api/admin/orders — 注文管理"]
        E1["GET / , GET /:id<br/>PUT /:id/status"]
    end
    subgraph EM["/api/admin/email — メール機能"]
        EM1["テンプレート CRUD + プレビュー"]
        EM2["一括送信 + 進捗 + 履歴 + 再送"]
    end
    subgraph STF["/api/staff — 在庫（staff/admin）"]
        S1["inventory / low-stock<br/>stats / history"]
        S2["products/:id + history"]
    end
    subgraph UPL["/api/upload — アップロード"]
        X1["POST /（Multer → Cloudinary）"]
    end
```

---

## 5. ミドルウェアチェーン（リクエスト処理順）

```mermaid
flowchart TD
    Req["HTTP リクエスト"] --> S1["1. securityHeaders"]
    S1 --> S2["2. helmet（セキュリティヘッダ）"]
    S2 --> S3["3. cors（フロント :5173 を許可）"]
    S3 --> S4["4. validateCommonPatterns<br/>（危険なパターン検出）"]
    S4 --> S5["5. requestSizeLimiter<br/>（ボディサイズ制限）"]
    S5 --> S6["6. generalLimiter<br/>（IP ベースのレート制限）"]
    S6 --> S7["7. express.json / urlencoded<br/>（JSON 構文検証つき）"]
    S7 --> S8["8. cookieParser"]
    S8 --> S9["9. sanitizeInput（XSS 対策・DOMPurify）"]
    S9 --> S10["10. requestLogger / securityLogger /<br/>apiUsageMonitor（Winston / prom-client）"]
    S10 --> Route["11. 該当ルートへ"]
    Route --> Auth["authenticate（JWT Cookie 検証）"]
    Auth --> Role["authorize（ロール判定）"]
    Role --> Valid["validateBody / validateObjectId（Joi）"]
    Valid --> Ctrl["Controller → Service → Model"]
    Ctrl --> Err["errorLogger → globalErrorHandler"]
    Err --> Res["統一エラーレスポンス"]

    style Auth fill:#ffebee
    style Role fill:#ffebee
    style Valid fill:#fff3e0
```

---

## 6. 認証・認可フロー

```mermaid
sequenceDiagram
    participant C as クライアント
    participant M as authenticate ミドルウェア
    participant JWT as JWT 検証
    participant DB as MongoDB (users)
    participant A as authorize ミドルウェア

    Note over C,DB: 6.1 ログイン
    C->>DB: POST /api/auth/login（email + password）
    DB->>DB: bcrypt で照合、JWT を生成（24h）
    DB-->>C: Set-Cookie: token-banhmi（httpOnly / secure）

    Note over C,A: 6.2 認可付きリクエスト
    C->>M: 任意エンドポイント（Cookie 付き）
    M->>JWT: req.cookies['token-banhmi'] を検証
    alt 無効・期限切れ
        M-->>C: 401 Access denied
    else 有効
        JWT->>DB: userId でユーザー取得
        alt blacklisted
            M-->>C: 403 Account suspended
        else 正常
            M->>M: req.user に設定
            M->>A: next()
            A->>A: ロール照合（admin / staff / buyer）
            alt ロール不適合
                A-->>C: 403 Insufficient permissions
            else 正常
                A-->>C: Controller へ
            end
        end
    end
```

**会員ステータス遷移:**

```mermaid
stateDiagram-v2
    [*] --> pending: 会員登録（POST /auth/register）<br/>BuyerProfile 同時作成
    pending --> approved: 管理者が承認<br/>（自動メール送信）
    approved --> blacklisted: 利用停止
    blacklisted --> approved: 復帰
    pending --> blacklisted: 不正利用検知

    note right of pending: 代引きのみ利用可
    note right of approved: ポイント払い解禁
```

---

## 7. 注文作成フロー（中核業務）

```mermaid
sequenceDiagram
    participant U as 顧客（購入者）
    participant R as /api/orders
    participant C as orderController
    participant P as PointService
    participant S as StockService
    participant E as AutomatedEmailService
    participant DB as MongoDB

    U->>R: POST /api/orders（items + paymentType）
    R->>R: authenticate → orderLimiter → Joi 検証
    R->>C: createOrder

    C->>DB: BuyerProfile を取得
    C->>C: 各商品の在庫確認・小計計算<br/>（単価 + オプション費用 × 数量）

    alt 決済：代引き（代金引換）
        C->>DB: 在庫を減算（$inc）
        C->>P: 100円 = 1pt の報酬ポイント算出
        C->>DB: Order(status = pending) を作成
    else 決済：ポイント（承認済み会員のみ）
        C->>C: user.status == approved を検証
        C->>P: validatePointsForPayment（残高確認）
        P-->>C: 残高 OK
        C->>P: deductPoints（残高減算 + 取引記録）
        C->>DB: 在庫を減算
        C->>DB: Order(status = paid) を作成
        C->>P: 取引記録に orderId を紐付け
    end

    C->>S: recordStockChange（order_deduction を記録）
    C->>E: sendOrderConfirmationEmail（自動メール）
    C-->>U: 201 Created（注文確定）
```

---

## 8. ポイントシステム

```mermaid
flowchart TD
    subgraph Earn["獲得"]
        E1["注文報酬<br/>100円 = 1ポイント<br/>（purchase_reward）"]
        E2["銀行振込による購入<br/>管理者が付与<br/>（bank_deposit_transfer_add）"]
    end

    subgraph Use["利用"]
        U1["ポイント全額払い<br/>（purchase_deduction）<br/>※ 承認済み会員のみ"]
    end

    subgraph Admin["管理者操作"]
        AD1["個別付与・減算<br/>PUT /points/admin/users/:id/adjust"]
        AD2["注文への報酬付与<br/>POST /points/admin/orders/:id/reward"]
    end

    E1 --> BP["BuyerProfile.point を更新"]
    E2 --> BP
    U1 --> BP
    AD1 --> BP
    AD2 --> BP
    BP --> LOG["PointTransaction に全取引を記録<br/>（誰が・いつ・何のために・いくら）"]

    BP --> CHK{"残高チェック"}
    CHK -->|"不足"| NG["400: Insufficient points"]
    CHK -->|"十分"| OK["決済続行"]

    style BP fill:#fff3e0
    style LOG fill:#e8f5e9
```

---

## 9. メールシステム

```mermaid
flowchart TD
    subgraph Auto["自動メール（業務トリガー）"]
        A1["会員承認時 → 承認通知メール"]
        A2["注文確定時 → 注文確認メール"]
        A3["注文ステータス変更時 → 更新通知メール"]
    end

    subgraph Bulk["メールマーケティング（管理者）"]
        B1["テンプレート作成<br/>POST /admin/email-templates<br/>（プレースホルダー対応）"]
        B2["宛先選択<br/>GET /admin/users-for-email"]
        B3["プレビュー<br/>POST /email-templates/:id/preview"]
        B4["一括送信<br/>POST /admin/email/send-bulk"]
    end

    subgraph Infra["送信基盤"]
        I1["emailService<br/>テンプレート描画 + SMTP 送信"]
        I2["bulkEmailService<br/>進捗管理（send-progress）"]
        I3["emailErrorRecoveryService<br/>失敗メール再送"]
        I4["emailLoggingService<br/>EmailHistory / EmailRecipient に記録"]
        I5["emailHealthMonitor<br/>送信状況のヘルスチェック"]
    end

    A1 --> I1
    A2 --> I1
    A3 --> I1
    B1 --> I1
    B2 --> B3 --> B4 --> I2
    I1 --> I4
    I2 --> I4
    I2 --> I5
    I4 -.->|"失敗分"| I3

    style I1 fill:#e1f5fe
    style I2 fill:#e1f5fe
```

---

## 10. データモデル

```mermaid
erDiagram
    User ||--o| BuyerProfile : "1対1（buyer のみ）"
    User ||--o{ Order : "注文"
    User ||--o{ PointTransaction : "ポイント取引"
    User ||--o{ ContactRequest : "お問い合わせ"
    User ||--o{ ProductView : "商品閲覧"
    Product ||--o{ Order : "注文明細"
    Product ||--o{ ProductView : "閲覧履歴"
    Product ||--o{ StockHistory : "入出庫履歴"
    Order ||--o{ PointTransaction : "取引紐付け"
    Order ||--o{ StockHistory : "注文による在庫減"
    EmailTemplate ||--o{ EmailHistory : "送信実績"
    EmailHistory ||--o{ EmailHistory : "受信者ごと"

    User {
        string email UK
        string password "bcrypt ハッシュ"
        string role "admin / staff / buyer"
        string status "pending / approved / blacklisted"
        bool del_flg "ソフトデリート"
    }
    BuyerProfile {
        string name
        string tel
        string zip1 "3桁"
        string zip2 "4桁"
        string address1
        string address2
        number point "残高"
    }
    Product {
        string name
        string type "banhmi / drink"
        number price
        number stock
        array options "名称 + 追加費用"
    }
    Order {
        ObjectId buyerId
        array items "商品・数量・オプション・小計"
        string paymentType "代引き / ポイント"
        number totalAmount
        number pointsUsed
        number pointsEarned
        string status "pending / paid / cancelled"
    }
    PointTransaction {
        string type "purchase_reward / bank_deposit_transfer_add / purchase_deduction"
        number amount "正 = 獲得 / 負 = 利用"
        string note
    }
```

**設計上のポイント:**
- すべてのモデルに **`del_flg`（ソフトデリート）** を実装し、物理削除を回避（監査・復旧性の確保）
- クエリミドルウェアで `del_flg` ドキュメントを自動除外
- 検索性能のためのインデックスを全モデルに定義（例：`Order.buyerId + createdAt`、`Product.type + del_flg`）

---

## 11. セキュリティ設計

| 対策 | 実装 |
| --- | --- |
| 認証 | JWT（24h）を **httpOnly / secure / sameSite** Cookie に格納。JS からアクセス不可（XSS 対策） |
| パスワード | bcrypt（コスト 12）でハッシュ化。API レスポンスでは自動除外 |
| XSS | DOMPurify による入力サニタイズ |
| CSRF/CORS | 許可ドメイン制限（フロントエンド :5173）、sameSite Cookie |
| レート制限 | 一般 / 認証 / 注文 / 管理者ごとに個別リミッタ（express-rate-limit） |
| 入力検証 | Joi スキーマ（ルート + コントローラの二段階）＋ ObjectId 検証 |
| 脆弱性パターン | リクエスト共通の危険パターン検出・ボディサイズ制限 |
| 監査ログ | Winston によるリクエスト/セキュリティ/エラーログ、prom-client によるメトリクス |

---

## 12. 開発コマンド

```bash
# 依存インストール
npm install

# 開発（nodemon + ts-node）
npm run dev

# 本番ビルド / 起動
npm run build:production
npm run start:production

# テスト
npm run test:unit           # 単体テスト
npm run test:integration    # 統合テスト（mongodb-memory-server）
npm run test:coverage       # カバレッジ

# 運用ユーティリティ
npm run create:admin        # 管理者ユーザー作成
npm run seed:email-templates # メールテンプレート初期投入
```

### 環境変数（`.env.example` 参照）

| 変数 | 用途 |
| --- | --- |
| `PORT` / `NODE_ENV` | サーバポート / 環境（development / staging / production） |
| `MONGODB_URI` | MongoDB 接続文字列 |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | JWT 署名鍵 / 有効期限 |
| `CLOUDINARY_*` | 画像保存用 Cloudinary 認証情報 |
| `EMAIL_*` | SMTP / Mailtrap 送信設定 |

---

## 13. テスト戦略

- **単体テスト（unit）** — `__tests__/` 配下。コントローラ・ミドルウェアのロジックを検証
- **統合テスト（integration）** — `src/test/integration/` 配下。**mongodb-memory-server** を使い実 DB を起動せずに API 全体の結合を検証（Supertest）
- **スモークテスト** — `test:auth-api` `test:upload-complete` などの実 API 検証スクリプト

---

## 14. このプロジェクトの技術的ハイライト

採用担当・技術面接で確認いただきたいポイントです。

1. **堅牢な注文トランザクション処理** — 在庫引当・ポイント減算・注文作成・在庫履歴・確認メールを一連のフローとして実装。ポイント払いは二重支払いを防ぐ検証付き
2. **ポイントサービスの分離（PointService）** — 残高検証・加減算・取引履歴を単一サービスに集約し、再利用性とテスト容易性を確保
3. **多層セキュリティ** — レート制限（エンドポイント別）・入力サニタイズ・Joi バリデーション・httpOnly Cookie・blacklisted 拒否をミドルウェア層で段階的に適用
4. **メール基盤の設計** — 自動業務メール（承認・注文確認）とマーケティング一括送信を分離。進捗管理・失敗再送・ヘルスモニタリング・送信履歴まで実装
5. **ソフトデリート + インデックス設計** — 全モデル共通の `del_flg` とクエリミドルウェアによる自動除外、検索パターンに応じた複合インデックス
6. **監視・可観測性** — Winston 構造化ログ、API 利用監視、prom-client による Prometheus メトリクス対応
7. **本番品質のテスト** — mongodb-memory-server による統合テストで外部依存なしに API を検証
8. **日本のビジネス要件への適合** — 代引き決済、承認制会員、ポイント制度、振込付与、郵便番号形式など日本市場の業務フローをドメインモデルに反映
