variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "us-east-1"  # 既存のリソースと同じリージョンを指定
}

variable "environment" {
  description = "環境名（dev/prd）"
  type        = string
}

variable "project" {
  description = "プロジェクト名"
  type        = string
  default     = "aws-level-checker"
}

# 既存のCognitoリソースのIDを参照するための変数
variable "existing_cognito_user_pool_id" {
  description = "既存のCognito User Pool ID"
  type        = string
}

variable "existing_cognito_client_id" {
  description = "既存のCognito Client ID"
  type        = string
}

# S3バケット名の変数
variable "document_bucket_name" {
  description = "PDFドキュメントを保存するS3バケット名"
  type        = string
  default     = "alc-uploaded-pdf"  # SAMテンプレートのデフォルト値と同じ
}
