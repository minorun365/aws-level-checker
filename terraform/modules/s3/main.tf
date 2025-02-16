# PDFドキュメント保存用のS3バケット
resource "aws_s3_bucket" "document" {
  bucket = var.bucket_name

  # バケットの中身を削除してからバケットを削除できるようにする
  force_destroy = true
}

# バケットのバージョニング設定
resource "aws_s3_bucket_versioning" "document" {
  bucket = aws_s3_bucket.document.id
  versioning_configuration {
    status = "Enabled"
  }
}

# バケットの暗号化設定
resource "aws_s3_bucket_server_side_encryption_configuration" "document" {
  bucket = aws_s3_bucket.document.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# バケットのパブリックアクセス設定
resource "aws_s3_bucket_public_access_block" "document" {
  bucket = aws_s3_bucket.document.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CORSの設定
resource "aws_s3_bucket_cors_configuration" "document" {
  bucket = aws_s3_bucket.document.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
