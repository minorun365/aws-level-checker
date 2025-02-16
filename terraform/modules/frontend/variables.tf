variable "bucket_name" {
  description = "フロントエンド用S3バケット名"
  type        = string
}

variable "domain_name" {
  description = "フロントエンドのドメイン名（CloudFrontのエイリアスとして使用）"
  type        = string
}
