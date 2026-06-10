# PopViewers

Audience engagement and feedback platform for collecting viewer insights through QR-based surveys and analytics dashboards.

## Overview

PopViewers enables entertainment companies, studios, event organizers, and content creators to gather audience feedback through a mobile-first survey experience.

Users scan a QR code, complete a guided survey, and submit feedback that can be analyzed through an admin dashboard and exported for reporting.

## Features

### Audience Experience

* QR code event access
* Mobile-first survey flow
* Audience profile collection
* Content discovery preferences
* Streaming platform preferences
* Title-specific feedback
* Buzz score rating
* Recommendation scoring
* Written feedback collection

### Admin Experience

* Campaign management
* Title management
* Response collection
* CSV export
* Analytics dashboard (future phase)

## Technology Stack

### Backend

* FastAPI
* SQLAlchemy
* SQLite (local development)
* PostgreSQL (production)

### Frontend

* React
* Vite
* Tailwind CSS

### Infrastructure

* GitHub
* AWS EC2
* AWS RDS PostgreSQL
* AWS S3
* AWS CloudFront

## Project Structure

```text
popviewers-app/

backend/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   └── schemas.py
├── requirements.txt
└── venv/

frontend/

docs/
├── prototype-reference.html
└── mvp-plan.md

README.md
```

## Current Progress

### Completed

* Project setup
* GitHub repository
* FastAPI backend
* SQLite database
* Campaign model
* Campaign API endpoints

### In Progress

* Title model
* Response model
* Survey submission API

### Planned

* Admin authentication
* CSV export
* React frontend
* Analytics dashboard
* AWS deployment

## Local Development

### Backend

Create virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run application:

```bash
uvicorn app.main:app --reload
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

## MVP Goal

Launch a production-ready audience feedback platform for the PopViewers Vibes & Views screening program capable of supporting approximately 2,000 users and collecting structured audience feedback for future content decisions.

