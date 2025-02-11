terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # バックエンドの設定は環境ごとに異なるため、環境ディレクトリで定義
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "aws-level-checker"
      IaC         = "Terraform"
    }
  }
}
