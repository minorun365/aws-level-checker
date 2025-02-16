output "bucket_name" {
  description = "作成したS3バケットの名前"
  value       = aws_s3_bucket.frontend.id
}

output "bucket_arn" {
  description = "作成したS3バケットのARN"
  value       = aws_s3_bucket.frontend.arn
}

output "cloudfront_domain_name" {
  description = "CloudFrontのドメイン名"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFrontディストリビューションのID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "website_endpoint" {
  description = "フロントエンドのエンドポイント"
  value       = "https://${var.domain_name}"
}
