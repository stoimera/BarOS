# API v1 Documentation

## Base URL
```
/api/v1
```

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

## Rate Limiting
- Default endpoints: 100 requests per minute
- Auth endpoints: 10 requests per minute
- Strict endpoints: 20 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Timestamp when the limit resets

## Pagination
All list endpoints support pagination:
- `page`: Page number (default: 1, min: 1)
- `limit`: Items per page (default: 10, min: 1, max: 100)

Response format:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Endpoints

### Customers

#### GET /api/v1/customers
List customers with optional search and pagination.

**Query Parameters:**
- `search` (optional): Search by name or email
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:** `PaginatedResponse<Customer>`

**Required Role:** `staff` or above

#### POST /api/v1/customers
Create a new customer.

**Request Body:**
```json
{
  "name": "string (required, 1-100 chars)",
  "email": "string (optional, valid email)",
  "phone": "string (optional, valid phone)",
  "date_of_birth": "string (optional, YYYY-MM-DD)",
  "address": "string (optional, max 500 chars)",
  "notes": "string (optional, max 1000 chars)"
}
```

**Response:** `Customer`

**Required Role:** `staff` or above

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "message": "Invalid request data",
  "details": [
    {
      "path": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Audit Logging
All create, update, and delete operations are automatically logged to the audit_logs table.

## Data Validation
All input is validated and sanitized:
- HTML tags are removed
- Strings are trimmed
- Emails are normalized to lowercase
- Phone numbers are validated

## Security
- All endpoints use HTTPS in production
- Input validation prevents injection attacks
- Rate limiting prevents abuse
- Audit logging tracks all actions

