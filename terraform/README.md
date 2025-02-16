# AWS Level Checker IaC

## 概要

AWS Level Checkerのインフラをコード化（IaC）したものです。

- Terraform: S3, CloudFront, Cognito（既存リソースの参照）
- AWS SAM: API Gateway, Lambda

## アーキテクチャ

### フロントエンド
- S3: 静的ウェブサイトホスティング
- CloudFront: コンテンツ配信
- ACM: SSL/TLS証明書

### バックエンド
- API Gateway: RESTful API
- Lambda: サーバーレス関数
- S3: PDFファイル保存
- Cognito: ユーザー認証（既存リソースを利用）

## 前提条件

- AWS CLI
- Terraform
- AWS SAM CLI
- 既存のCognitoリソースのID
- ACM証明書（us-east-1リージョン）

## セットアップ手順

### 1. Terraformの初期化（開発環境の場合）

```zsh
# 開発環境のディレクトリに移動
cd terraform/environments/dev

# terraform.tfvarsファイルの作成
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvarsを編集して必要な値を設定
nano terraform.tfvars

# Terraformの初期化
terraform init

# 実行計画の確認
terraform plan

# リソースの作成
terraform apply
```

### 2. SAMテンプレートのデプロイ

バックエンドのデプロイ手順については、[backend/README.md](../backend/README.md)を参照してください。

## 環境ごとの設定

### 開発環境

- フロントエンド
  - S3バケット名: alc-dev-frontend
  - ドメイン: dev-checker.minoruonda.com
- バックエンド
  - PDFアップロード用S3: dev-alc-uploaded-pdf
  - スタック名: alc-dev

### 本番環境

- フロントエンド
  - S3バケット名: alc-prd-frontend
  - ドメイン: checker.minoruonda.com
- バックエンド
  - PDFアップロード用S3: alc-prd-uploaded-pdf
  - スタック名: alc-prd

## API エンドポイント

- POST /load-pdf: PDFファイルのアップロードと処理
- POST /load-url: URLからのコンテンツ取得と処理
- POST /evaluate: AWSアウトプットのレベル判定
- POST /tweet: 判定結果のツイート生成

## 既存リソースから新リソースへの移行手順

1. Terraformで新しいS3バケットを作成
2. 既存のS3バケットから新しいバケットにデータを移行
   ```zsh
   aws s3 sync s3://alc-uploaded-documents s3://dev-alc-uploaded-pdf  # 開発環境の場合
   ```
3. SAMテンプレートを新しいS3バケット名で再デプロイ
4. フロントエンドの環境変数を更新してデプロイ
5. CloudFrontのドメイン名を別アカウントのRoute53に設定

## 注意事項

- Cognitoリソースは既存のものを参照する形で設定しています
- terraform.tfvarsファイルには機密情報が含まれるため、Gitにコミットしないでください
- 本番環境へのデプロイは十分なテスト後に実施してください
- CloudFrontのキャッシュ設定を適切に管理してください
- Route53は別アカウントで管理されているため、CloudFrontのドメイン名を使用してDNSレコードを作成する必要があります
