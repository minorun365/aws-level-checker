# Secrets Managerのシークレット作成
resource "aws_secretsmanager_secret" "langfuse" {
  name = "alc-langfuse-${var.environment}"
  description = "Langfuse API credentials for ${var.environment} environment"

  tags = {
    Environment = var.environment
    Project     = var.project
  }
}

# シークレットの初期値を設定（空のJSON）
resource "aws_secretsmanager_secret_version" "langfuse" {
  secret_id = aws_secretsmanager_secret.langfuse.id
  secret_string = jsonencode({
    "LANGFUSE_PUBLIC_KEY": "",
    "LANGFUSE_SECRET_KEY": ""
  })
}
