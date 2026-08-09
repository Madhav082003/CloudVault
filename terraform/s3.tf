# S3 Bucket for document storage
resource "aws_s3_bucket" "cloudvault_documents" {
  bucket = var.s3_bucket_name

  tags = {
    Name    = "${var.project_name}-documents"
    Project = var.project_name
  }
}

# Block all public access to S3 bucket
resource "aws_s3_bucket_public_access_block" "cloudvault_documents" {
  bucket = aws_s3_bucket.cloudvault_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning for document history
resource "aws_s3_bucket_versioning" "cloudvault_documents" {
  bucket = aws_s3_bucket.cloudvault_documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudvault_documents" {
  bucket = aws_s3_bucket.cloudvault_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
