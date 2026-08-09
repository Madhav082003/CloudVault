output "ec2_public_ip" {
  description = "Elastic IP of the CloudVault server"
  value       = aws_eip.cloudvault_eip.public_ip
}

output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.cloudvault_server.id
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.cloudvault_db.endpoint
}

output "s3_bucket_name" {
  description = "S3 bucket for document storage"
  value       = aws_s3_bucket.cloudvault_documents.bucket
}

output "app_url" {
  description = "CloudVault application URL"
  value       = "http://${aws_eip.cloudvault_eip.public_ip}"
}
