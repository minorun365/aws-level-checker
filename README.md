# AWSレベル判定くん

あなたのAWSアウトプット（ブログや登壇資料など）の技術レベルを判定します。

https://checker.minoruonda.com/

![画面イメージ](https://github.com/user-attachments/assets/3971d54b-5608-4a6a-965f-8161e36472db)


## アーキテクチャ

![アーキテクチャ図](https://github.com/user-attachments/assets/645ec273-560d-406d-9694-84c34a957e9d)


## 紹介記事

[あなたのブログのAWS技術レベルを判定するアプリ作りました！ - Qiita](https://qiita.com/minorun365/items/226867be3d122c2cfe4f)


## 手動で構築してみたい方向けの超簡易手順

以下の順番でリソース作成してみてください。詳細はChatGPTやClaudeに頼めば手順作ってくれます。

### バックエンド編

- Bedrockのモデルを有効化する
- Cognitoのユーザープールを作成する
- Lambdaレイヤーを作成する
- Lambda関数を作成する
- API GatewayでAPIとステージを作成する

### フロントエンド編

- S3バケットを作成し、フロントエンドのアプリケーションファイルをアップロードする
- CloudFrontのディストリビューションを作成する
- Route 53でドメインを取得し、ホストゾーンを作成する
- ACMで証明書を発行し、CloudFrontにドメイン名を設定する


## 大きめのアップデート履歴

- 2025/3/4: モデルをClaude 3.7 Sonnetにアップデートしました
