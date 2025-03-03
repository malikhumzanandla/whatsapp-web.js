# WhatsApp Web.js API Documentation

This document provides a comprehensive guide to the WhatsApp Web.js API endpoints, authentication, and usage for both backend integration and frontend development.

## Table of Contents

- [Introduction](#introduction)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Admin Endpoints](#admin-endpoints)
  - [Client Management](#client-management)
  - [Messaging](#messaging)
- [Frontend Integration Guide](#frontend-integration-guide)
- [Error Handling](#error-handling)
- [WebSocket Events](#websocket-events)
- [Database Schema](#database-schema)
- [Example Implementations](#example-implementations)

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

#### Create New Client

Creates a new client record with a unique ID.

- **URL**: `/api/admin/create-client`
- **Method**: `POST`
- **Authentication**: Admin key required (`x-admin-key` header)
- **Request Body**: Empty (client ID is generated automatically)
- **Success Response**:
  ```json
  {
    "status": "success",
    "message": "Client created successfully",
    "data": {
      "clientId": "auto_generated_uuid",
      "sessionDir": "/path/to/session",
      "createdAt": "2023-05-01T12:00:00Z"
    }
  }
  ```
- **Error Responses**:
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
    "clientId": "unique_client_identifier",
    "sessionDir": "/path/to/session"
  }
  ```
- **Error Responses**:
  - 400: Client ID is missing
  - 403: Invalid API key
  - 404: Client not found
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
  - When already authenticated:
    ```json
    {
      "status": "authenticated",
      "message": "Client is already authenticated. No need for QR code."
    }
    ```
  - When client is ready:
    ```json
    {
      "status": "ready",
      "message": "Client is ready and authenticated. No need for QR code."
    }
    ```
  - When authentication error occurred:
    ```json
    {
      "status": "error",
      "message": "Authentication error occurred",
      "error": "Error details"
    }
    ```
  - When QR code is not yet available:
    ```json
    {
      "status": "waiting",
      "message": "QR code not yet available. Please try again in a few seconds."
    }
    ```
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

## Frontend Integration Guide

### Overview

The frontend will primarily interact with the WhatsApp Web.js API to:
1. Initialize client instances
2. Display QR codes for authentication
3. Monitor client status
4. Send messages

### Authentication Flow

1. **Admin Panel**:
   - Create a client using the admin endpoint
   - Generate an API key for the client
   - Store this API key securely

2. **Client Authentication**:
   - Initialize the client instance
   - Poll the QR code endpoint until a QR code is available
   - Display the QR code to the user for scanning with their WhatsApp app
   - Poll the status endpoint until the client is authenticated and ready

### QR Code Display

When receiving a base64-encoded QR code from the API:
