# BitaURL - API Documentation

## 🎯 Overview

The BitaURL API is a comprehensive RESTful API designed for URL shortening, analytics, team collaboration, and platform management. Built with OpenAPI 3.0 standards, it provides robust authentication, rate limiting, and extensive functionality for both user-facing and administrative operations.

## 🏗️ API Architecture

### Base URLs
- **Production**: `https://api.bitaurl.com`
- **Staging**: `https://staging-api.bitaurl.com`
- **Development**: `http://localhost:8080`

### API Versioning
- **Current Version**: `v1`
- **Base Path**: `/api/v1`
- **Admin Path**: `/api/v1/admin`
- **Public Path**: `/api/v1/public`

### Response Format
All API responses follow a consistent structure:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-30T10:15:30Z",
  "requestId": "req_abc123"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": [
      {
        "field": "originalUrl",
        "message": "Must be a valid URL"
      }
    ]
  },
  "timestamp": "2024-01-30T10:15:30Z",
  "requestId": "req_abc123"
}
```

## 🔐 Authentication

### JWT Authentication
The API uses JWT (JSON Web Tokens) for authentication with a dual-token system:

#### Access Token
- **Lifetime**: 15 minutes
- **Usage**: API requests
- **Header**: `Authorization: Bearer <access_token>`

#### Refresh Token
- **Lifetime**: 7 days
- **Usage**: Obtaining new access tokens
- **Storage**: Secure HTTP-only cookie (recommended) or local storage

### Authentication Flow
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900,
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "plan": "PRO",
      "role": "USER"
    }
  }
}
```

### OAuth2 Integration
```http
GET /api/v1/auth/oauth/google
```

Redirects to Google OAuth consent screen, then returns to:
```http
GET /api/v1/auth/oauth/callback?code=<auth_code>&state=<state>
```

## 📋 Core API Endpoints

### 1. Authentication Endpoints

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

### 2. URL Management Endpoints

#### Create Short URL
```http
POST /api/v1/urls
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "originalUrl": "https://example.com/very/long/url",
  "title": "Example Website",
  "description": "A sample website",
  "customAlias": "my-link",
  "tags": ["marketing", "campaign"],
  "expiresAt": "2024-12-31T23:59:59Z",
  "settings": {
    "password": "secret123",
    "clickLimit": 1000,
    "geoTargeting": {
      "enabled": true,
      "rules": [
        {
          "country": "US",
          "redirectUrl": "https://us.example.com"
        }
      ]
    }
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "url_123",
    "shortCode": "abc123",
    "shortUrl": "https://bitaurl.com/abc123",
    "originalUrl": "https://example.com/very/long/url",
    "title": "Example Website",
    "description": "A sample website",
    "tags": ["marketing", "campaign"],
    "qrCode": {
      "url": "https://cdn.bitaurl.com/qr/abc123.png"
    },
    "analytics": {
      "totalClicks": 0,
      "uniqueClicks": 0
    },
    "createdAt": "2024-01-30T10:15:30Z",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

#### Get URLs
```http
GET /api/v1/urls?page=0&size=20&search=example&tags=marketing
Authorization: Bearer <access_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "url_123",
        "shortCode": "abc123",
        "shortUrl": "https://bitaurl.com/abc123",
        "originalUrl": "https://example.com",
        "title": "Example Website",
        "analytics": {
          "totalClicks": 150,
          "uniqueClicks": 89
        },
        "createdAt": "2024-01-30T10:15:30Z"
      }
    ],
    "totalElements": 45,
    "totalPages": 3,
    "size": 20,
    "number": 0
  }
}
```

#### Get URL Details
```http
GET /api/v1/urls/{urlId}
Authorization: Bearer <access_token>
```

#### Update URL
```http
PUT /api/v1/urls/{urlId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["updated", "tags"]
}
```

#### Delete URL
```http
DELETE /api/v1/urls/{urlId}
Authorization: Bearer <access_token>
```

#### Bulk Operations
```http
POST /api/v1/urls/bulk
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "action": "delete",
  "urlIds": ["url_123", "url_456", "url_789"]
}
```

### 3. Analytics Endpoints

#### Get URL Analytics
```http
GET /api/v1/analytics/{urlId}?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z
Authorization: Bearer <access_token>
```

Response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalClicks": 1250,
      "uniqueClicks": 890,
      "clickThroughRate": 12.5,
      "averageClicksPerDay": 41.7
    },
    "clicksOverTime": [
      {
        "date": "2024-01-29",
        "clicks": 45,
        "uniqueClicks": 32
      },
      {
        "date": "2024-01-30",
        "clicks": 67,
        "uniqueClicks": 48
      }
    ],
    "geographicDistribution": [
      {
        "country": "United States",
        "countryCode": "US",
        "clicks": 450,
        "percentage": 36.0
      },
      {
        "country": "United Kingdom",
        "countryCode": "UK",
        "clicks": 200,
        "percentage": 16.0
      }
    ],
    "deviceBreakdown": [
      {
        "type": "desktop",
        "clicks": 750,
        "percentage": 60.0
      },
      {
        "type": "mobile",
        "clicks": 400,
        "percentage": 32.0
      },
      {
        "type": "tablet",
        "clicks": 100,
        "percentage": 8.0
      }
    ],
    "browserBreakdown": [
      {
        "name": "Chrome",
        "clicks": 625,
        "percentage": 50.0
      },
      {
        "name": "Safari",
        "clicks": 250,
        "percentage": 20.0
      }
    ],
    "referrerBreakdown": [
      {
        "domain": "google.com",
        "clicks": 400,
        "percentage": 32.0
      },
      {
        "domain": "facebook.com",
        "clicks": 200,
        "percentage": 16.0
      },
      {
        "domain": "direct",
        "clicks": 300,
        "percentage": 24.0
      }
    ]
  }
}
```

#### Export Analytics
```http
GET /api/v1/analytics/{urlId}/export?format=csv&from=2024-01-01&to=2024-01-31
Authorization: Bearer <access_token>
```

### 4. QR Code Endpoints

#### Generate QR Code
```http
POST /api/v1/qr
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "urlId": "url_123",
  "size": 300,
  "format": "PNG",
  "style": {
    "foregroundColor": "#000000",
    "backgroundColor": "#FFFFFF",
    "logo": "https://company.com/logo.png",
    "errorCorrectionLevel": "M"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "qr_123",
    "imageUrl": "https://cdn.bitaurl.com/qr/abc123.png",
    "downloadUrl": "https://api.bitaurl.com/api/v1/qr/qr_123/download",
    "size": 300,
    "format": "PNG"
  }
}
```

#### Get QR Code
```http
GET /api/v1/qr/{qrId}
Authorization: Bearer <access_token>
```

#### Download QR Code
```http
GET /api/v1/qr/{qrId}/download
Authorization: Bearer <access_token>
```

### 5. File Management Endpoints

#### Upload File
```http
POST /api/v1/files
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <binary_data>
title: "Document Title"
description: "File description"
expiresAt: "2024-12-31T23:59:59Z"
password: "optional_password"
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "file_123",
    "fileName": "document.pdf",
    "originalName": "my-document.pdf",
    "size": 2048576,
    "mimeType": "application/pdf",
    "shortUrl": "https://bitaurl.com/f/abc123",
    "downloadUrl": "https://api.bitaurl.com/api/v1/files/file_123/download",
    "expiresAt": "2024-12-31T23:59:59Z",
    "createdAt": "2024-01-30T10:15:30Z"
  }
}
```

#### Get Files
```http
GET /api/v1/files?page=0&size=20
Authorization: Bearer <access_token>
```

#### Download File
```http
GET /api/v1/files/{fileId}/download
Authorization: Bearer <access_token>
```

### 6. Team Management Endpoints

#### Create Team
```http
POST /api/v1/teams
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Marketing Team",
  "description": "Team for marketing campaigns",
  "settings": {
    "visibility": "private",
    "allowMemberInvites": true
  }
}
```

#### Get Teams
```http
GET /api/v1/teams
Authorization: Bearer <access_token>
```

#### Invite Team Member
```http
POST /api/v1/teams/{teamId}/invite
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "member@company.com",
  "role": "member"
}
```

#### Update Member Role
```http
PUT /api/v1/teams/{teamId}/members/{userId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role": "admin"
}
```

### 7. Domain Management Endpoints

#### Add Custom Domain
```http
POST /api/v1/domains
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "domain": "short.company.com",
  "subdomain": "short"
}
```

#### Verify Domain
```http
POST /api/v1/domains/{domainId}/verify
Authorization: Bearer <access_token>
```

#### Get Domain Status
```http
GET /api/v1/domains/{domainId}/status
Authorization: Bearer <access_token>
```

### 8. User Profile Endpoints

#### Get Profile
```http
GET /api/v1/user/profile
Authorization: Bearer <access_token>
```

#### Update Profile
```http
PUT /api/v1/user/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "settings": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": false
    }
  }
}
```

#### Change Password
```http
PUT /api/v1/user/password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword",
  "confirmPassword": "newpassword"
}
```

### 9. Subscription & Billing Endpoints

#### Get Subscription
```http
GET /api/v1/billing/subscription
Authorization: Bearer <access_token>
```

#### Create Subscription
```http
POST /api/v1/billing/subscription
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "planId": "pro_monthly",
  "paymentMethodId": "pm_razorpay_123"
}
```

#### Update Subscription
```http
PUT /api/v1/billing/subscription
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "planId": "business_monthly"
}
```

#### Cancel Subscription
```http
DELETE /api/v1/billing/subscription
Authorization: Bearer <access_token>
```

#### Get Invoices
```http
GET /api/v1/billing/invoices?page=0&size=10
Authorization: Bearer <access_token>
```

### 10. Support Endpoints

#### Create Support Ticket
```http
POST /api/v1/support/tickets
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "category": "technical",
  "priority": "medium",
  "subject": "Domain verification issue",
  "message": "I'm having trouble verifying my custom domain..."
}
```

#### Get Support Tickets
```http
GET /api/v1/support/tickets?status=open&page=0&size=10
Authorization: Bearer <access_token>
```

#### Reply to Ticket
```http
POST /api/v1/support/tickets/{ticketId}/reply
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "Thank you for the update. I've tried the suggested solution..."
}
```

## 🔧 Public API Endpoints

### URL Redirect
```http
GET /api/v1/public/{shortCode}
```

Redirects to the original URL with a 301 or 302 status code.

### URL Preview
```http
GET /api/v1/public/{shortCode}/preview
```

Response:
```json
{
  "success": true,
  "data": {
    "shortCode": "abc123",
    "originalUrl": "https://example.com",
    "title": "Example Website",
    "description": "A sample website",
    "favicon": "https://example.com/favicon.ico",
    "createdAt": "2024-01-30T10:15:30Z",
    "isActive": true,
    "requiresPassword": false
  }
}
```

### QR Code Image
```http
GET /api/v1/public/{shortCode}/qr?size=200&format=png
```

Returns the QR code image as binary data.

### URL Metadata
```http
GET /api/v1/public/metadata?url=https://example.com
```

Response:
```json
{
  "success": true,
  "data": {
    "title": "Example Website",
    "description": "A sample website for demonstration",
    "favicon": "https://example.com/favicon.ico",
    "image": "https://example.com/og-image.jpg",
    "siteName": "Example"
  }
}
```

## 👑 Admin API Endpoints

### Dashboard Metrics
```http
GET /api/v1/admin/dashboard/metrics?timeRange=7d
Authorization: Bearer <admin_access_token>
```

### User Management
```http
GET /api/v1/admin/users?page=0&size=20&search=john&plan=PRO
Authorization: Bearer <admin_access_token>
```

```http
PUT /api/v1/admin/users/{userId}
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "status": "suspended",
  "reason": "Terms of service violation"
}
```

### Impersonate User
```http
POST /api/v1/admin/users/{userId}/impersonate
Authorization: Bearer <admin_access_token>
```

### System Health
```http
GET /api/v1/admin/system/health
Authorization: Bearer <admin_access_token>
```

### Audit Logs
```http
GET /api/v1/admin/audit/logs?action=user.login&from=2024-01-01&to=2024-01-31
Authorization: Bearer <admin_access_token>
```

## 🚦 Rate Limiting

### Rate Limit Headers
All API responses include rate limiting headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1643635200
X-RateLimit-Window: 3600
```

### Rate Limits by Plan

| Plan | Requests/Hour | Burst Limit |
|------|---------------|-------------|
| Free | 100 | 200 |
| Pro | 1,000 | 2,000 |
| Business | 5,000 | 10,000 |
| Enterprise | 50,000 | 100,000 |

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds.",
    "retryAfter": 3600
  },
  "timestamp": "2024-01-30T10:15:30Z"
}
```

## 📝 Request/Response Examples

### Pagination
```http
GET /api/v1/urls?page=0&size=20&sort=createdAt,desc
```

Response includes pagination metadata:
```json
{
  "success": true,
  "data": {
    "content": [...],
    "pageable": {
      "sort": {
        "sorted": true,
        "unsorted": false
      },
      "pageNumber": 0,
      "pageSize": 20
    },
    "totalElements": 150,
    "totalPages": 8,
    "first": true,
    "last": false,
    "numberOfElements": 20
  }
}
```

### Filtering and Search
```http
GET /api/v1/urls?search=marketing&tags=campaign,social&dateFrom=2024-01-01&dateTo=2024-01-31
```

### Bulk Operations
```http
POST /api/v1/urls/bulk
Content-Type: application/json

{
  "action": "update",
  "urlIds": ["url_123", "url_456"],
  "updates": {
    "tags": ["updated", "bulk"]
  }
}
```

## ❌ Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Validation Errors
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "originalUrl",
        "code": "INVALID_URL",
        "message": "Must be a valid URL"
      },
      {
        "field": "customAlias",
        "code": "ALREADY_EXISTS",
        "message": "Custom alias already exists"
      }
    ]
  }
}
```

## 🔒 Security Headers

All API responses include security headers:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
```

## 📊 API Monitoring

### Health Check Endpoint
```http
GET /api/v1/health
```

Response:
```json
{
  "status": "UP",
  "components": {
    "database": {
      "status": "UP",
      "details": {
        "connectionPool": "healthy",
        "responseTime": "5ms"
      }
    },
    "cache": {
      "status": "UP",
      "details": {
        "connections": 10,
        "memoryUsage": "45%"
      }
    },
    "storage": {
      "status": "UP",
      "details": {
        "provider": "s3",
        "region": "us-east-1"
      }
    }
  }
}
```

### Metrics Endpoint
```http
GET /api/v1/metrics
Authorization: Bearer <admin_access_token>
```

## 🧪 Testing

### API Testing with cURL

#### Create Short URL
```bash
curl -X POST https://api.bitaurl.com/api/v1/urls \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com",
    "title": "Test URL"
  }'
```

#### Get Analytics
```bash
curl -X GET "https://api.bitaurl.com/api/v1/analytics/url_123?from=2024-01-01T00:00:00Z&to=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Postman Collection
A comprehensive Postman collection is available at:
`https://api.bitaurl.com/postman/collection.json`

## 📚 SDKs and Libraries

### JavaScript/Node.js
```javascript
npm install @bitaurl/sdk

import { BitaURL } from '@bitaurl/sdk';

const client = new BitaURL({
  apiKey: 'your_api_key',
  baseURL: 'https://api.bitaurl.com'
});

const shortUrl = await client.urls.create({
  originalUrl: 'https://example.com',
  title: 'Example'
});
```

### Python
```python
pip install bitaurl-python

from bitaurl import BitaURL

client = BitaURL(api_key='your_api_key')

short_url = client.urls.create(
    original_url='https://example.com',
    title='Example'
)
```

### PHP
```php
composer require bitaurl/php-sdk

use BitaURL\Client;

$client = new Client('your_api_key');

$shortUrl = $client->urls()->create([
    'originalUrl' => 'https://example.com',
    'title' => 'Example'
]);
```

---

This API documentation provides comprehensive guidance for integrating with the BitaURL platform. For interactive API exploration, visit our [API Explorer](https://api.bitaurl.com/docs) or download our [Postman Collection](https://api.bitaurl.com/postman/collection.json).