# EC2 Instance
resource "aws_instance" "cloudvault_server" {
  ami                    = var.ec2_ami
  instance_type          = var.ec2_instance_type
  key_name               = var.ec2_key_name
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io docker-compose-plugin git nginx
    systemctl enable docker
    systemctl start docker
    systemctl enable nginx
    systemctl start nginx
    usermod -aG docker ubuntu
    cd /home/ubuntu
    git clone https://github.com/Madhav082003/CloudVault.git
  EOF

  tags = {
    Name    = "${var.project_name}-server"
    Project = var.project_name
  }
}

# Elastic IP for EC2
resource "aws_eip" "cloudvault_eip" {
  instance = aws_instance.cloudvault_server.id
  domain   = "vpc"

  tags = {
    Name    = "${var.project_name}-eip"
    Project = var.project_name
  }
}
