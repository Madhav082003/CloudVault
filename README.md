# ☁️ CloudVault

> A production-grade cloud document management platform built on AWS

**Live Demo:** [http://13.234.183.182](http://13.234.183.182)

---

## 🚀 What is CloudVault?

CloudVault is a secure, scalable document management system that allows users to upload, manage, and download files from anywhere. Built with a modern full-stack architecture and deployed on AWS using industry-standard DevOps practices.

---

## 🏗️ Architecture

```
                        ┌─────────────────────────────────┐
                        │         AWS Cloud (ap-south-1)   │
                        │                                   │
  User Browser ────────▶│  Elastic IP: 13.234.183.182      │
                        │         │                         │
                        │    ┌────▼────┐                    │
                        │    │  Nginx  │  (Reverse Proxy)   │
                        │    └────┬────┘                    │
                        │    /    │    \api                  │
                        │   ▼          ▼                    │
                        │ React    FastAPI                   │
                        │ (dist)  (Docker :8000)            │
                        │              │                     │
                        │    ┌─────────┴──────────┐         │
                        │    │                    │         │
                        │  ┌─▼──┐            ┌───▼───┐     │
                        │  │ S3 │            │  RDS  │     │
                        │  │    │            │Postgres│     │
                        │  └────┘            └───────┘     │
                        └─────────────────────────────────-─┘
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** — High-performance Python REST API
- **SQLAlchemy** — ORM for database operations
- **PostgreSQL (RDS)** — Production database
- **JWT** — Secure authentication
- **boto3** — AWS SDK for S3 integration

### Frontend
- **React 19 + Vite** — Modern UI framework
- **React Router** — Client-side routing
- **Axios** — HTTP client with JWT interceptors

### Infrastructure (AWS)
- **EC2 (t3.micro)** — Application server
- **RDS PostgreSQL (db.t3.micro)** — Managed database
- **S3** — Document storage with AES-256 encryption
- **Elastic IP** — Static public IP
- **CloudWatch** — Monitoring & CPU alarms
- **Security Groups** — Network access control

### DevOps
- **Docker + Docker Compose** — Containerization
- **Nginx** — Reverse proxy & static file serving
- **Terraform** — Infrastructure as Code
- **GitHub Actions** — CI/CD pipeline (auto-deploy on push)

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing
- 📁 **File Management** — Upload, download, delete documents (PDF, Word, Excel, Images, ZIP, Video)
- 🔍 **Search** — Real-time document search
- 📊 **Analytics** — File type breakdown, storage stats, upload trends
- ⚙️ **Settings** — Change password, delete account
- 🖱️ **Drag & Drop** — Intuitive file upload interface
- 📱 **Responsive** — Works on all screen sizes
- 🔒 **Secure Storage** — Files stored in private S3 bucket (AES-256 encrypted)
- 🤖 **AI Assistant** — Coming soon (RAG-based document Q&A)

---

## 📁 Project Structure

```
CloudVault/
├── backend/                  # FastAPI application
│   ├── routes/
│   │   ├── auth.py           # Authentication endpoints
│   │   └── documents.py      # Document CRUD endpoints
│   ├── main.py               # FastAPI app entry point
│   ├── models.py             # SQLAlchemy models
│   ├── schemas.py            # Pydantic schemas
│   ├── auth.py               # JWT logic
│   ├── s3.py                 # S3 operations
│   ├── database.py           # DB connection
│   ├── config.py             # Environment config
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Settings.jsx
│   │   ├── components/
│   │   │   └── Sidebar.jsx
│   │   └── api/
│   │       └── axios.js
│   └── package.json
├── terraform/                # Infrastructure as Code
│   ├── main.tf
│   ├── ec2.tf
│   ├── rds.tf
│   ├── s3.tf
│   ├── security_groups.tf
│   ├── variables.tf
│   └── outputs.tf
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD pipeline
└── docker-compose.yml
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login (returns JWT) |
| GET | `/auth/me` | Get current user |
| POST | `/auth/change-password` | Change password |
| DELETE | `/auth/delete-account` | Delete account |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/documents/upload` | Upload file to S3 |
| GET | `/documents/` | List all documents |
| GET | `/documents/stats` | Storage statistics |
| GET | `/documents/analytics` | Usage analytics |
| GET | `/documents/download/{id}` | Download file |
| DELETE | `/documents/{id}` | Delete file |

---

## 🚀 Local Development

### Prerequisites
- Python 3.13+
- Node.js 18+
- AWS account with S3 bucket

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Fill in your AWS credentials and SECRET_KEY

uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Docker (Recommended)
```bash
docker compose up --build
```

---

## ☁️ AWS Infrastructure (Terraform)

```bash
cd terraform
terraform init
terraform plan    # Preview changes
# terraform apply  # Deploy (only if setting up fresh)
```

---

## 🔄 CI/CD Pipeline

Every push to `main` branch automatically:
1. SSHs into EC2
2. Pulls latest code
3. Rebuilds Docker container
4. Verifies deployment

---

## 🔒 Security

- Passwords hashed with **bcrypt**
- JWT tokens with expiry
- S3 bucket is **private** (no public access)
- RDS is **not publicly accessible** (VPC only)
- Port 8000 (FastAPI) is **not exposed** to internet
- Environment variables stored in `.env` (never committed)

---

## 👨‍💻 Author

**Madhav** — Final Year B.Tech ECE, JIIT Noida

---

*Built as part of a 10-day cloud engineering project*
