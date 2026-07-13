# PopViewers Audience Intelligence Platform

**Document:** System Architecture  
**Version:** 1.0.0  
**Status:** Production (ViewerCon Pilot)  
**Owner:** 9o5 Enterprises, LLC  
**Prepared For:** PopViewers Inc.  
**Last Updated:** July 2026

---

# Table of Contents

1. Executive Summary
2. Business Objectives
3. System Overview
4. High-Level Architecture
5. AWS Architecture
6. Component Responsibilities
7. Frontend Architecture
8. Backend Architecture
9. Database Architecture
10. Authentication
11. Secrets Management
12. Deployment Architecture
13. Auto Scaling Design
14. Security Model
15. Monitoring
16. Availability
17. Scalability
18. Future Architecture

---

# Executive Summary

The PopViewers Audience Intelligence Platform is a cloud-native application designed to capture audience feedback during movie screenings, television premieres, and live entertainment events.

Audience members interact with a mobile-first web application that allows them to submit demographic information and post-screening feedback. Responses are securely stored within Amazon RDS and made available to authorized administrators through a JWT-protected administrative interface.

The platform was designed with the following architectural goals:

• Mobile-first user experience
• High availability
• Secure administrative access
• Automated deployments
• Infrastructure as Code
• Horizontal scalability
• Low operational overhead
• Future support for analytics dashboards and AI-powered insights

---

# Business Objectives

The primary objectives of the platform are:

• Capture audience feedback in real time

• Replace paper surveys with digital collection

• Build structured datasets for future analytics

• Enable rapid deployment for new events

• Maintain secure separation between attendees and administrators

• Support future expansion into audience intelligence products

---

# System Overview

The system consists of two primary applications.

## Public Application

The attendee-facing application allows users to:

• Join the event

• Complete demographic information

• Submit audience feedback

• Receive confirmation of submission

No authentication is required.

---

## Administrative Application

Administrators authenticate using secure credentials stored within AWS Secrets Manager.

After authentication they can:

• View responses

• Export CSV reports

• Review collected audience data

Future releases will include dashboards and analytics.

---

# High-Level Architecture

                Internet
                     │
                     ▼
              Cloudflare DNS
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
app.popviewers.com         api.popviewers.com
         │                       │
         ▼                       ▼
     CloudFront         Application Load Balancer
         │                       │
         ▼                       ▼
      Amazon S3          Auto Scaling Group
                                 │
                                 ▼
                            Amazon EC2
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

Supporting Services

GitHub Actions
Amazon S3 Deployment Bucket
AWS Secrets Manager
AWS IAM
Amazon CloudWatch

---

# Architecture Principles

The system follows several architectural principles.

## Separation of Concerns

The frontend and backend are completely independent.

Frontend

React

↓

CloudFront

↓

S3

Backend

FastAPI

↓

ALB

↓

EC2

↓

PostgreSQL

Each component can evolve independently.

---

## Immutable Infrastructure

Production infrastructure is never modified manually.

Every AWS resource is defined through CloudFormation.

Benefits include:

• Repeatable deployments

• Version control

• Easier disaster recovery

• Infrastructure auditing

---

## Least Privilege

IAM permissions are intentionally restricted.

Examples include:

EC2

• Read deployment artifact

• Read database secret

• Read admin secret

GitHub Actions

• Upload deployment artifact

• Execute deployment

No service receives unnecessary permissions.

---

# AWS Services

## CloudFront

Purpose

Content Delivery Network

Responsibilities

• HTTPS termination

• Static asset caching

• Global edge delivery

• Compression

Origin

Amazon S3

---

## Amazon S3

Purpose

Static website hosting

Stores

• React build

• Images

• CSS

• JavaScript bundles

Deployment artifacts

• Backend releases

---

## Cloudflare

Responsibilities

DNS management

TLS

Domain management

Custom DNS records

---

## Application Load Balancer

Responsibilities

Route traffic

Terminate HTTPS

Distribute requests

Perform health checks

Current Health Endpoint

GET /health

---

## Auto Scaling Group

Purpose

Maintain backend availability.

Configuration

Minimum Instances

1

Desired Instances

1

Maximum Instances

2

Responsibilities

Replace unhealthy EC2 instances

Launch new instances automatically

Register healthy instances

---

## Amazon EC2

Runs

Amazon Linux 2023

Software

Python

Gunicorn

Nginx

FastAPI

Deployment scripts

Bootstrap Process

1. Install packages

2. Configure environment

3. Retrieve database credentials

4. Configure Secrets Manager

5. Download latest deployment artifact

6. Deploy backend

7. Start Gunicorn

8. Start Nginx

9. Register with ALB

---

## Amazon RDS

Engine

PostgreSQL

Stores

Campaigns

Titles

Survey Responses

Benefits

Managed backups

Automatic recovery

Multi-user support

Managed patching

---

## AWS Secrets Manager

Stores

Database Secret

• username

• password

Admin Secret

• username

• password

• jwt_secret

Secrets are never committed to Git repositories.

The application retrieves secrets dynamically at runtime.

---

# Design Decisions

## Why React?

• Fast

• Component-based

• Mobile friendly

• Easy deployment to S3

---

## Why FastAPI?

• High performance

• Automatic OpenAPI

• Simple validation

• Async support

---

## Why PostgreSQL?

• Relational

• Strong consistency

• Mature ecosystem

• Easy analytics integration

---

## Why Gunicorn?

Production-grade Python application server.

Provides:

Multiple workers

Process management

Automatic restarts

Timeout handling

---

## Why Nginx?

Acts as the reverse proxy.

Responsibilities

SSL proxying

Connection management

Health endpoint

Request forwarding

Static optimizations
