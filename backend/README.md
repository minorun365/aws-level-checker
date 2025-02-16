# AWS Level Checker Backend

## ディレクトリ構造

```
backend/
├── src/
│   ├── handlers/
│   │   ├── evaluate/
│   │   │   ├── app.py
│   │   │   └── requirements.txt
│   │   ├── tweet/
│   │   │   ├── app.py
│   │   │   └── requirements.txt
│   │   ├── load_pdf/
│   │   │   ├── app.py
│   │   │   └── requirements.txt
│   │   └── load_url/
│   │       ├── app.py
│   │       └── requirements.txt
│   └── shared/
│       └── utils/
│           ├── __init__.py
│           ├── bedrock.py
│           └── langfuse.py
├── template.yaml
├── requirements.txt
└── env/
    ├── dev.json
    └── prd.json
```

## アーキテクチャ

1. API Gateway
   - 名前: aws-level-checker（環境共通）
   - 環境はステージで分離（dev/prd）
   - 統合されたエンドポイント構成：
     - /evaluate → レベル判定
     - /tweet → ツイート生成
     - /load-pdf → PDF処理
     - /load-url → URL処理

2. ハンドラーの整理
   - 各Lambda関数のコードを`src/handlers/`配下に移動
   - ファイル名を`lambda_function.py`から`app.py`に変更（より一般的な命名）
   - 各ハンドラーごとに`requirements.txt`を管理
   - ディレクトリ名とAPIパスの対応：
     - /load-pdf → load_pdf/
     - /load-url → load_url/
     - /evaluate → evaluate/
     - /tweet → tweet/

2. 共通コードの共有
   - `src/shared/`に共通ユーティリティを配置
   - Bedrock、Langfuse関連の共通コードを集約

3. 環境変数の集中管理
   - `env/`ディレクトリに環境変数ファイルを集約
   - 環境ごとにJSONファイルで管理

## 移行手順

1. 新しいディレクトリ構造の作成
```zsh
mkdir -p backend/src/handlers/{evaluate,tweet,load_pdf,load_url}
mkdir -p backend/src/shared/utils
mkdir -p backend/env
```

2. 既存コードの移行
```zsh
# 各Lambda関数のコードを移行
mv backend/evaluate_output/lambda_function.py backend/src/handlers/evaluate/app.py
mv backend/generate_tweet/lambda_function.py backend/src/handlers/tweet/app.py
mv backend/load_document/lambda_function.py backend/src/handlers/load_pdf/app.py
mv backend/load_url/lambda_function.py backend/src/handlers/load_url/app.py

# requirements.txtの移行
mv backend/load_document/requirements.txt backend/src/handlers/load_pdf/
mv backend/load_url/requirements.txt backend/src/handlers/load_url/
```

3. template.yamlの更新
   - CodeUriのパスを新しい構造に合わせて更新
   - 環境変数の参照方法を見直し

## 注意事項

- 共通コードを`shared`に移動する際は、依存関係を整理
- 環境変数ファイルは`.gitignore`に追加
- ディレクトリ名にはアンダースコア（_）を使用し、APIパスにはハイフン（-）を使用

## デプロイ手順

1. 設定ファイルの準備
```zsh
# samconfig.example.tomlをコピーしてsamconfig.tomlを作成
cp samconfig.example.toml samconfig.toml
```

2. 環境変数の設定
以下の環境変数を設定する必要があります：
- S3_BUCKET_NAME: PDFファイルを保存するS3バケット名
- BEDROCK_INFERENCE_PROFILE_ARN: Bedrock推論プロファイルのARN
- LANGFUSE_HOST: LangfuseのホストURL
- LANGFUSE_SECRET_URL: Langfuse用SecretsManagerのURL
- COGNITO_USER_POOL_ID: 既存のCognitoユーザープールID

3. デプロイの実行
```zsh
# 開発環境へのデプロイ
sam deploy --stack-name alc-dev --parameter-overrides Environment=dev

# 本番環境へのデプロイ
sam deploy --stack-name alc-prd --parameter-overrides Environment=prd
```

デプロイ後、以下の形式でAPIエンドポイントが生成されます：
- 開発環境: https://{api-id}.execute-api.{region}.amazonaws.com/dev/
- 本番環境: https://{api-id}.execute-api.{region}.amazonaws.com/prd/

Note: GitHub Actionsを使用する場合、環境変数は GitHub の Environment Secrets/Variables で管理されます。
