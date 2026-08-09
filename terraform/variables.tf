variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for naming resources"
  type        = string
  default     = "cloudvault"
}

variable "ec2_instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ec2_ami" {
  description = "Ubuntu 24.04 LTS AMI for ap-south-1"
  type        = string
  default     = "ami-0f58b397bc5c1f2e8"
}

variable "ec2_key_name" {
  description = "EC2 key pair name for SSH access"
  type        = string
  default     = "cloudvault-key"
}

variable "db_name" {
  description = "RDS database name"
  type        = string
  default     = "cloudvault"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "cloudvault"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for document storage"
  type        = string
  default     = "cloudvault-documents-madhav"
}
