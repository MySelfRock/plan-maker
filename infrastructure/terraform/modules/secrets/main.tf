# Generate random secrets
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = true
}

# Application Secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${var.name_prefix}/app/secrets"
  description = "Application secrets for PlanMaker SaaS"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    NODE_ENV                = var.environment
    JWT_SECRET              = random_password.jwt_secret.result
    JWT_REFRESH_SECRET      = random_password.jwt_refresh_secret.result
    JWT_EXPIRES_IN          = "15m"
    JWT_REFRESH_EXPIRES_IN  = "7d"
    
    # These should be provided externally or via terraform variables
    GEMINI_API_KEY          = var.gemini_api_key
    GOOGLE_CLIENT_ID        = var.google_client_id
    GOOGLE_CLIENT_SECRET    = var.google_client_secret
    
    # SMTP Configuration
    SMTP_HOST               = var.smtp_host
    SMTP_PORT               = var.smtp_port
    SMTP_USER               = var.smtp_user
    SMTP_PASSWORD           = var.smtp_password
    EMAIL_FROM              = var.email_from
    
    # Sentry
    SENTRY_DSN              = var.sentry_dsn
    
    # API Configuration
    API_PREFIX              = "/api/v1"
    CORS_ORIGINS            = var.cors_origins
    
    # Rate Limiting
    RATE_LIMIT_TTL          = "60"
    RATE_LIMIT_MAX          = "100"
  })
}

# Sentry DSN (separate for easy reference)
resource "aws_secretsmanager_secret" "sentry_dsn" {
  count       = var.sentry_dsn != "" ? 1 : 0
  name        = "${var.name_prefix}/sentry/dsn"
  description = "Sentry DSN for error tracking"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "sentry_dsn" {
  count         = var.sentry_dsn != "" ? 1 : 0
  secret_id     = aws_secretsmanager_secret.sentry_dsn[0].id
  secret_string = var.sentry_dsn
}
