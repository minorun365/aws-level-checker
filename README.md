# aws-level-checker

あなたのAWSアウトプット（ブログや登壇資料など）の技術レベルを判定します。

https://checker.minoruonda.com/

![画面イメージ](https://github.com/user-attachments/assets/c237f538-305c-406b-9f9f-0c0eb7f0de65)


## アーキテクチャ

![アーキテクチャ図](https://github.com/user-attachments/assets/3de3251f-d929-4ee5-b62f-5a8ae06739d9)

## デプロイ方法

1. AWSインフラ一式を構築する
2. `frontend` ディレクトリで `npm run build` を実行する
3. `aws s3 sync build/ s3://<バケット名> --delete` を実行する
4. CloudFrontのキャッシュを削除する
