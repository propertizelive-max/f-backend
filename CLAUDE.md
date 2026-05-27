# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.
# Project Context
This project is a backend system for a Furniture Web Application built using NestJS and PostgreSQL.
The platform includes:
- JWT Authentication
- Google OAuth2 Login
- Protected Routes
- Role-Based Access Control (RBAC)
- Product & Category APIs
- User Management
- Admin Dashboard APIs
- Media Upload System
- Enterprise-Level Backend Architecture
The backend follows scalable modular architecture using NestJS best practices.

# Tech Stack
- Framework: NestJS
- Language: TypeScript
- Database: PostgreSQL
- ORM: TypeORM
- Authentication: JWT + Passport
- OAuth: Google OAuth2
- Validation: class-validator
- Uploads: Multer
- Storage: Local / AWS S3
- API Style: REST API
# Development Commands
```bash
# Development
npm run start:dev
npm run start:debug
# Build
npm run build
npm run start:prod
# Code Quality
npm run lint
npm run format
# Testing
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```
# Environment Variables
```env
# App
PORT=
# PostgreSQL
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
# JWT
JWT_ACCESS_TOKEN_SECRET_KEY=
JWT_ACCESS_TOKEN_EXPIRES_IN=30m
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
# Storage
STORAGE_PROVIDER=
# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=
```
# Project Architecture
Standard NestJS modular architecture:
```bash
module/
├── dto/
├── entity/
├── interfaces/
├── guards/
├── decorators/
├── strategies/
├── module.controller.ts
├── module.service.ts
├── module.module.ts
```
# Core Modules
## Auth Module
Handles:
- JWT Authentication
- Google OAuth2
- Access Token Generation
- Passport Strategies
- Protected Routes
Features:
- Bearer Token Auth
- Role-Based Access
- Secure Login System

## User Module
Handles:
- User CRUD
- User Profiles
- Account Management
- Role Management

## Admin Module
Handles:
- Admin APIs
- Dashboard Stats
- User Listings
- Protected Admin Routes

## Media Module
Handles:
- Single Upload
- Bulk Upload
- Image / Video / PDF Uploads
Limits:
- Max File Size: 10 MB
- Max Upload Count: 10 Files
---
## Storage Module
Supports:
- Local Storage
- AWS S3 Storage
Dynamic Provider:
```env
STORAGE_PROVIDER=local
```
or
```env
STORAGE_PROVIDER=s3
```
---
# Authentication & Authorization
## JWT Structure
```ts
{
  sub,
  email,
  role
}
```
Token Details:
- Bearer Authentication
- 30 Minute Expiry
- Passport JWT Strategy
## RBAC
Roles:
```ts
enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
``
Guards:
- JwtAuthGuard
- RolesGuard
Example:
```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
```
# Current User Decorator

```ts
@CurrentUser()
```
Extract Property:
```ts
@CurrentUser('id')
```
# Database
- PostgreSQL + TypeORM
- UUID Primary Keys
- Entities registered in AppModule
- DTO Validation Required
- Disable synchronize in production
UUID Example:
```ts
@PrimaryGeneratedColumn('uuid')
id: string;
```
# Validation
Global ValidationPipe:
```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```
Rules:
- Validate all payloads
- Use DTOs everywhere
- Never trust client input
---
# File Upload Rules
Uses:
```ts
FileInterceptor()
FilesInterceptor()
```
Allowed Types:
- Images
- Videos
- PDF Files
Files are buffered in memory and uploaded using active storage provider.
# CODE QUALITY
## Principles
- SOLID Principles
- Clean Architecture
- Dependency Injection
- Separation of Concerns
- Modular Design
- Reusable Services
- Scalable Folder Structure
# Coding Standards
## Required
- Strict TypeScript
- DTO-based Validation
- Async/Await
- ConfigService Usage
- Thin Controllers
- Service-Based Business Logic
- Centralized Error Handling
## Avoid
- Hardcoded Secrets
- Business Logic in Controllers
- Repeated Code
- Direct env access
- Unnecessary any usage
# Security Rules
- Never expose JWT tokens
- Never commit .env files
- Always validate inputs
- Protect admin routes
- Use HTTPS in production
- Validate uploads properly
- Restrict upload size
- Sanitize uploaded files
# Production Best Practices
Required Before Production:
- Disable synchronize:true
- Enable logging
- Configure CORS
- Use Helmet
- Add Swagger Docs
- Add Rate Limiting
- Use Exception Filters
- Environment-Based Config
# Future Improvements
- Refresh Tokens
- Email Verification
- Forgot Password
- OTP Authentication
- Redis Caching
- BullMQ Queues
- Docker Deployment
- CI/CD Pipeline
- API Versioning
- Audit Logs
# Critical Rules
Always:
- Maintain clean architecture
- Keep modules isolated
- Use dependency injection
- Write reusable code
- Follow NestJS conventions
- Protect private routes
- Validate every request
- Keep code scalable
- Use proper exception handling
# Notes
This backend is designed as a scalable enterprise-grade furniture platform backend with secure authentication, modular APIs, cloud storage support, and maintainable architecture.