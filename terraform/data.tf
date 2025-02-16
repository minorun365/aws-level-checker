# 既存のCognito User Poolの参照
data "aws_cognito_user_pool" "existing" {
  user_pool_id = var.existing_cognito_user_pool_id
}

# 既存のCognito User Pool Clientの参照
data "aws_cognito_user_pool_client" "existing" {
  user_pool_id = data.aws_cognito_user_pool.existing.id
  client_id    = var.existing_cognito_client_id
}

# 既存のCognito User Pool Domainの参照
data "aws_cognito_user_pool_domain" "existing" {
  domain       = data.aws_cognito_user_pool.existing.domain
  user_pool_id = data.aws_cognito_user_pool.existing.id
}

# 既存のSecrets Managerシークレットの参照
data "aws_secretsmanager_secret" "langfuse" {
  name = "alc-langfuse-${var.environment}"
}
