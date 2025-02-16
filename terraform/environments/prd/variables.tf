variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "プロジェクト名"
  type        = string
  default     = "aws-level-checker"
}

variable "tfstate_bucket" {
  description = "Terraformの状態管理用S3バケット名"
  type        = string
  default     = "alc-terraform-state"
}

variable "document_bucket_name" {
  description = "ドキュメント用S3バケット名"
  type        = string
}

variable "frontend_bucket_name" {
  description = "フロントエンド用S3バケット名"
  type        = string
}

variable "domain_name" {
  description = "CloudFrontで使用するドメイン名"
  type        = string
}

variable "allowed_origin" {
  description = "CORSで許可するオリジン"
  type        = string
}

variable "existing_cognito_user_pool_id" {
  description = "既存のCognito User Pool ID"
  type        = string
}

variable "existing_cognito_client_id" {
  description = "既存のCognito Client ID"
  type        = string
}
