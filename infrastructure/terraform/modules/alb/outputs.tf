output "dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "arn_suffix" {
  description = "ARN suffix of the load balancer"
  value       = aws_lb.main.arn_suffix
}

output "security_group_id" {
  description = "Security group ID of the load balancer"
  value       = aws_security_group.alb.id
}

output "target_group_arn" {
  description = "ARN of the API target group"
  value       = aws_lb_target_group.api.arn
}

output "target_group_arn_suffix" {
  description = "ARN suffix of the API target group"
  value       = aws_lb_target_group.api.arn_suffix
}
