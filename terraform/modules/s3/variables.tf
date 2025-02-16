variable "bucket_name" {
  description = "S3バケット名"
  type        = string
}

variable "allowed_origins" {
  description = "CORSで許可するオリジン一覧"
  type        = list(string)
}
