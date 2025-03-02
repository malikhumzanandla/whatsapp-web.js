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

## Shared Memory Between Developer and Assistant

This documentation file serves as a persistent "shared memory" between the human developer and the AI assistant. Its purpose is to:

1. **Maintain Context**: The AI assistant will read this document in future sessions to understand project history, decisions, and architecture.

2. **Continuous Updates**: Both the developer and AI will update this document as the project evolves, recording new decisions, changes, and lessons learned.

3. **Single Source of Truth**: This file serves as the authoritative reference for project understanding, preventing misunderstandings or contradictory approaches.

4. **Knowledge Persistence**: Even as development sessions come and go, this document ensures that context isn't lost and past discussions don't need to be repeated.

The AI assistant commits to:
- Reading this document at the start of new development sessions
- Suggesting updates to this document when significant changes or decisions are made
- Using the information here to guide recommendations and avoid contradicting established project principles
- Maintaining awareness of the project's backend-only, multi-client nature and its integration with PHP applications

This approach ensures consistent understanding and continuous improvement as the project develops over time.

### System Context

