# PopViewers Audience Intelligence Platform

![Version](https://img.shields.io/badge/version-v1.0.0-blue)
![Status](https://img.shields.io/badge/status-Production-success)
![AWS](https://img.shields.io/badge/Hosted%20on-AWS-orange)

A cloud-native audience intelligence platform that enables studios, streaming services, production companies, and event organizers to collect structured audience feedback through mobile-first surveys and securely manage responses through an administrative portal.

---

# Overview

PopViewers transforms audience engagement by replacing traditional paper surveys with a scalable digital platform.

Audience members simply scan a QR code, complete a guided survey on their mobile device, and submit feedback in real time. Administrators securely access responses, export data, and prepare insights for future reporting and analytics.

The platform is designed for movie premieres, television screenings, festivals, conventions, and live entertainment events.

---

# Current Production Features

## Audience Experience

- QR Code event access
- Mobile-first survey flow
- Multi-step guided experience
- Audience demographic collection
- Streaming platform preferences
- Content discovery preferences
- Genre preferences
- Buzz Score rating
- Recommendation scoring
- Written audience feedback
- Secure submission confirmation

---

## Administrative Experience

- Secure staff login
- JWT authentication
- AWS Secrets Manager credential management
- View submitted responses
- CSV export
- Campaign management API
- Title management API

---

## Security

- HTTPS everywhere
- JWT-based authentication
- Protected administrative endpoints
- AWS Secrets Manager
- IAM least-privilege access
- Secure backend environment configuration

---

# Technology Stack

## Frontend

- React
- Vite
- CSS
- Fetch API

---

## Backend

- FastAPI
- SQLAlchemy
- Gunicorn
- Uvicorn
- JWT Authentication

---

## Database

- PostgreSQL (Amazon RDS)

---

## Infrastructure

- AWS EC2
- Application Load Balancer
- Auto Scaling Group
- Amazon RDS
- Amazon S3
- Amazon CloudFront
- AWS Secrets Manager
- AWS IAM
- CloudFormation
- Cloudflare DNS

---

## CI/CD

- GitHub Actions
- Automated backend deployment
- Automated frontend deployment
- Automatic backend bootstrap on new EC2 instances

---

# Production Architecture

```
                        Internet
                             │
                             ▼
                      Cloudflare DNS
                             │
          ┌──────────────────┴──────────────────┐
          ▼                                     ▼
 app.popviewers.com                    api.popviewers.com
          │                                     │
          ▼                                     ▼
     CloudFront                     Application Load Balancer
          │                                     │
          ▼                                     ▼
      Amazon S3                    Auto Scaling Group (EC2)
                                                │
                                                ▼
                                              Nginx
                                                │
                                                ▼
                                            Gunicorn
                                                │
                                                ▼
                                             FastAPI
                                                │
                                                ▼
                                     Amazon RDS PostgreSQL
```

Supporting AWS Services

- GitHub Actions
- AWS Secrets Manager
- Amazon S3 Deployment Bucket
- CloudFormation
- IAM

---

# Repository Structure

```text
popviewers-app/

backend/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── auth.py
│
├── requirements.txt
│
frontend/
├── src/
├── public/
└── package.json
│
infrastructure/
├── cloudformation/
│   ├── 01-network.yaml
│   ├── 02-security.yaml
│   ├── 03-rds.yaml
│   ├── 04-compute.yaml
│   └── 06-frontend.yaml
│
scripts/
│
docs/
├── Architecture.md
├── Infrastructure.md
├── Deployment.md
├── API.md
├── Security.md
├── Operations-Runbook.md
├── Disaster-Recovery.md
└── Phase2-Roadmap.md
│
README.md
CHANGELOG.md
```

---

# Local Development

## Backend

Create a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies

```bash
pip install -r backend/requirements.txt
```

Run the API

```bash
uvicorn app.main:app --reload
```

Swagger UI

```
http://127.0.0.1:8000/docs
```

---

## Frontend

Install dependencies

```bash
cd frontend
npm install
```

Run the development server

```bash
npm run dev
```

---

# Production Deployment

Infrastructure is managed using AWS CloudFormation.

Deploy order

1. Network
2. Security
3. Database
4. Compute
5. Frontend

Backend deployments are automatically performed through GitHub Actions.

Frontend deployments automatically update the CloudFront-hosted application.

---

# Security Model

Public Endpoints

- GET /health
- POST /responses
- POST /admin/login
- GET /campaigns
- GET /titles

Protected Endpoints

- GET /responses

Authentication

JWT Bearer Tokens

Secrets

AWS Secrets Manager

---

# Current Release

**Version**

v1.0.0

**Status**

Production

**Deployment**

ViewerCon Pilot

---

# Documentation

Detailed documentation is available in the `docs/` directory.

- Architecture
- Infrastructure
- Deployment
- Operations Runbook
- API Reference
- Security Guide
- Disaster Recovery
- Phase 2 Roadmap

---

# Roadmap

Upcoming Phase 2 features include:

- Audience Intelligence Dashboard
- Data visualizations
- AI-powered sentiment analysis
- Campaign management interface
- Multi-user organizations
- Executive reporting
- Event analytics
- Role-based access control
- Advanced search and filtering

---

# License

Copyright © 2026 9o5 Enterprises, LLC.

All rights reserved.