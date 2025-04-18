# プロバイダーの設定
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment = "dev"
      Project     = var.project
      IaC         = "Terraform"
    }
  }
}

# PDF用S3バケットモジュールの呼び出し
module "document_bucket" {
  source = "../../modules/s3"

  bucket_name = var.document_bucket_name
  allowed_origins = [
    var.allowed_origin
  ]
}

# フロントエンド用モジュールの呼び出し
module "frontend" {
  source = "../../modules/frontend"

  bucket_name = var.frontend_bucket_name
  domain_name = var.domain_name
}

# Secrets Manager用モジュールの呼び出し
module "secrets" {
  source = "../../modules/secrets"

  environment = "dev"
  project     = var.project
}

# 既存のCognitoリソースの参照
data "aws_cognito_user_pool" "existing" {
  user_pool_id = var.existing_cognito_user_pool_id
}

data "aws_cognito_user_pool_client" "existing" {
  user_pool_id = data.aws_cognito_user_pool.existing.id
  client_id    = var.existing_cognito_client_id
}

# 環境固有の変数定義
terraform {
  backend "s3" {
    bucket = "alc-terraform-state"
    key    = "dev/terraform.tfstate"
    region = "us-east-1"
  }
}

# 出力値の定義
output "document_bucket_name" {
  description = "作成したドキュメント用S3バケットの名前"
  value       = module.document_bucket.bucket_name
}

output "document_bucket_arn" {
  description = "作成したドキュメント用S3バケットのARN"
  value       = module.document_bucket.bucket_arn
}

output "frontend_bucket_name" {
  description = "作成したフロントエンド用S3バケットの名前"
  value       = module.frontend.bucket_name
}

output "frontend_bucket_arn" {
  description = "作成したフロントエンド用S3バケットのARN"
  value       = module.frontend.bucket_arn
}

output "cloudfront_domain_name" {
  description = "CloudFrontのドメイン名"
  value       = module.frontend.cloudfront_domain_name
}

output "website_endpoint" {
  description = "フロントエンドのエンドポイント"
  value       = module.frontend.website_endpoint
}

output "langfuse_secret_arn" {
  description = "作成したLangfuseシークレットのARN"
  value       = module.secrets.secret_arn
}

output "langfuse_secret_name" {
  description = "作成したLangfuseシークレットの名前"
  value       = module.secrets.secret_name
}

output "cognito_user_pool_id" {
  description = "既存のCognito User Pool ID"
  value       = data.aws_cognito_user_pool.existing.id
}

output "cognito_client_id" {
  description = "既存のCognito Client ID"
  value       = data.aws_cognito_user_pool_client.existing.id
}
