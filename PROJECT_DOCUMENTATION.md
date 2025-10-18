# WhatsApp Web.js API Server - Project Documentation

## Project Overview

This project is a backend API service that manages multiple WhatsApp client instances for commercial applications. It serves as a middleware between third-party applications (like PHP applications) and the WhatsApp Web platform. The API allows creation, initialization, and control of WhatsApp clients, enabling message sending and authentication through WhatsApp's QR code mechanism.

### Purpose

This service is designed specifically as a backend API without its own user interface. It will be consumed by other applications (primarily PHP applications) that will handle the business logic and user interfaces. The core functionality is to provide a reliable and scalable interface to WhatsApp Web that can support multiple client instances simultaneously.

## Architecture

### Key Components

1. **API Server (server.js)** - Express-based REST API for client management
2. **Client Manager (whatsappClient.js)** - Handles WhatsApp client instances lifecycle
3. **API Key Manager (apiKeyManager.js)** - Manages authentication and API key validation
4. **Path Helper (utils/pathHelper.js)** - Cross-platform path handling utilities
5. **Database** - MySQL database for storing client information and API keys

### System Context Diagram

