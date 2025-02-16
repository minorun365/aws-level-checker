output "secret_arn" {
  description = "作成したシークレットのARN"
  value       = aws_secretsmanager_secret.langfuse.arn
}

output "secret_name" {
  description = "作成したシークレットの名前"
  value       = aws_secretsmanager_secret.langfuse.name
}
