# WhatsApp Web.js API Documentation

This document provides a comprehensive guide to the WhatsApp Web.js API endpoints, authentication, and usage.

## Table of Contents

- [Introduction](#introduction)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Admin Endpoints](#admin-endpoints)
  - [Client Management](#client-management)
  - [Messaging](#messaging)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Database Schema](#database-schema)

## Introduction

This API allows applications to programmatically interact with WhatsApp using multiple client instances. It's designed for commercial use where multiple clients can purchase instances and interact with WhatsApp through a standardized API.

## Authentication

The API uses two types of authentication:

1. **Admin Authentication**: Used for administrative tasks like creating API keys.
   - Header: `x-admin-key`
   - Value: The admin API key set in the environment variables.

2. **Client Authentication**: Used for all other endpoints to identify and authorize client requests.
   - Header: `x-api-key`
   - Value: Client-specific API key generated through the admin endpoint.

## API Endpoints

### Admin Endpoints

#### Create API Key

Creates a new API key for a client.

- **URL**: `/api/admin/create-api-key`
- **Method**: `POST`
- **Authentication**: Admin key required (`x-admin-key` header)
- **Request Body**:
  ```json
  {
    "clientId": "unique_client_identifier"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "API key created successfully",
    "data": {
      "clientId": "unique_client_identifier",
      "apiKey": "generated_api_key"
    }
  }
  ```
- **Error Responses**:
  - 400: Client ID is missing
  - 403: Invalid admin key
  - 500: Server error

### Client Management

#### Initialize Client

Initializes a WhatsApp client instance for a specific client ID.

- **URL**: `/api/init`
- **Method**: `POST`
- **Authentication**: API key required (`x-api-key` header)
- **Request Body**:
  ```json
  {
    "clientId": "unique_client_identifier"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Client initialized",
    "clientId": "unique_client_identifier"
  }
  ```
- **Error Responses**:
  - 400: Client ID is missing
  - 403: Invalid API key
  - 500: Server error

#### Get Client Status

Retrieves the current status of a client's WhatsApp instance.

- **URL**: `/api/status/:clientId`
- **Method**: `GET`
- **Authentication**: API key required (`x-api-key` header)
- **URL Parameters**: `clientId` - The unique client identifier
- **Success Response**:
  ```json
  {
    "authenticated": true,
    "ready": true,
    "error": null
  }
  ```
- **Error Responses**:
  - 403: Invalid API key
  - 404: Client not found
  - 500: Server error

#### Get QR Code

Retrieves the QR code for WhatsApp authentication if needed.

- **URL**: `/api/qr/:clientId`
- **Method**: `GET`
- **Authentication**: API key required (`x-api-key` header)
- **URL Parameters**: `clientId` - The unique client identifier
- **Success Response** (when QR code is available):
  ```json
  {
    "status": "success",
    "qr": "base64_encoded_qr_image"
  }
  ```
- **Alternative Responses**:
  - Authentication status messages when QR code is not needed
- **Error Responses**:
  - 403: Invalid API key
  - 404: Client not found
  - 500: Server error

### Messaging

#### Send Message

Sends a WhatsApp message to a specified phone number.

- **URL**: `/api/sendmessage/:clientId`
- **Method**: `POST`
- **Authentication**: API key required (`x-api-key` header)
- **URL Parameters**: `clientId` - The unique client identifier
- **Request Body**:
  ```json
  {
    "number": "phone_number",
    "message": "message_content"
  }
  ```
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Message sent successfully",
    "data": {
      "id": "message_id"
    }
  }
  ```
- **Error Responses**:
  - 400: Missing number or message
  - 403: Client not authenticated or invalid API key
  - 404: Client not found
  - 500: Server error
  - 503: Client not ready

## Usage Examples

### Creating a New Client

1. Generate an API key for the client using admin authentication
2. Initialize the client with the new API key
3. Retrieve the QR code for the client to scan
4. Monitor the client status until it's ready
5. Start sending messages

Example with curl:

```bash
# Create API key
curl -X POST http://localhost:3001/api/admin/create-api-key \
  -H "x-admin-key: your-secure-admin-key-here" \
  -H "Content-Type: application/json" \
  -d '{"clientId": "client001"}'

# Initialize client
curl -X POST http://localhost:3001/api/init \
  -H "x-api-key: generated_api_key" \
  -H "Content-Type: application/json" \
  -d '{"clientId": "client001"}'

# Get QR code
curl -X GET http://localhost:3001/api/qr/client001 \
  -H "x-api-key: generated_api_key"

# Check status
curl -X GET http://localhost:3001/api/status/client001 \
  -H "x-api-key: generated_api_key"

# Send a message
curl -X POST http://localhost:3001/api/sendmessage/client001 \
  -H "x-api-key: generated_api_key" \
  -H "Content-Type: application/json" \
  -d '{"number": "1234567890", "message": "Hello from API!"}'
```

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200`: Successful operation
- `400`: Bad request (missing parameters)
- `403`: Authentication failed
- `404`: Resource not found
- `500`: Server error
- `503`: Service unavailable (client not ready)

Error responses include a JSON body with details:

```json
{
  "status": "error",
  "message": "Error description",
  "error": "Detailed error information (optional)"
}
```

## Database Schema

The API uses the following database tables:

1. **clients**: Stores client information
   - `id`: Auto-incremented primary key
   - `client_id`: Unique client identifier
   - `session_dir`: Path to the WhatsApp session data
   - `created_at`: Timestamp of creation

2. **api_keys**: Stores API keys for clients
   - `id`: Auto-incremented primary key
   - `key`: The API key string
   - `client_id`: Foreign key referencing `clients.id`
   - `created_at`: Timestamp of creation

3. **whatsapp_sessions**: Stores session information
   - `id`: Auto-incremented primary key
   - `client_id`: Foreign key referencing `clients.id`
   - `session_data`: Session data (JSON)
   - `created_at`: Timestamp of creation
   - `updated_at`: Timestamp of last update
