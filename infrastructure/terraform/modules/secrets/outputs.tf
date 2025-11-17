output "secrets_arn" {
  description = "ARN of the application secrets"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

output "secrets_name" {
  description = "Name of the application secrets"
  value       = aws_secretsmanager_secret.app_secrets.name
}

output "sentry_dsn_arn" {
  description = "ARN of the Sentry DSN secret"
  value       = var.sentry_dsn != "" ? aws_secretsmanager_secret.sentry_dsn[0].arn : ""
}
