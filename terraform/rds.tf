# RDS Subnet Group (uses all default VPC subnets)
resource "aws_db_subnet_group" "cloudvault" {
  name       = "${var.project_name}-subnet-group"
  subnet_ids = data.aws_subnets.default.ids

  tags = {
    Name    = "${var.project_name}-subnet-group"
    Project = var.project_name
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "cloudvault_db" {
  identifier        = "${var.project_name}-db"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.cloudvault.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]

  # Security: not publicly accessible
  publicly_accessible = false

  # Free tier settings
  skip_final_snapshot     = true
  backup_retention_period = 7
  deletion_protection     = false

  tags = {
    Name    = "${var.project_name}-db"
    Project = var.project_name
  }
}
