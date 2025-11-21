# Mermaid Sequence Diagram Examples

This document demonstrates Mermaid sequence diagrams for various scenarios.

## API Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant Database

    Client->>API: POST /api/data
    API->>Auth: Validate Token
    Auth-->>API: Token Valid
    API->>Database: Query Data
    Database-->>API: Return Results
    API-->>Client: 200 OK + Data
```

## User Registration Process

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant Database
    participant Email

    User->>Frontend: Fill Registration Form
    Frontend->>Backend: POST /register
    Backend->>Database: Check Email Exists
    Database-->>Backend: Email Available
    Backend->>Database: Create User
    Database-->>Backend: User Created
    Backend->>Email: Send Verification Email
    Email-->>User: Verification Link
    Backend-->>Frontend: Success Response
    Frontend-->>User: Show Success Message
```

## Payment Processing

```mermaid
sequenceDiagram
    participant Customer
    participant WebApp
    participant PaymentGateway
    participant Bank
    participant Database

    Customer->>WebApp: Initiate Payment
    WebApp->>PaymentGateway: Process Payment Request
    PaymentGateway->>Bank: Authorize Transaction

    alt Transaction Approved
        Bank-->>PaymentGateway: Approved
        PaymentGateway-->>WebApp: Success
        WebApp->>Database: Update Order Status
        WebApp-->>Customer: Payment Confirmed
    else Transaction Declined
        Bank-->>PaymentGateway: Declined
        PaymentGateway-->>WebApp: Failed
        WebApp-->>Customer: Payment Failed
    end
```

## Microservices Communication

```mermaid
sequenceDiagram
    participant Client
    participant APIGateway
    participant AuthService
    participant OrderService
    participant InventoryService
    participant NotificationService

    Client->>APIGateway: Create Order
    APIGateway->>AuthService: Verify Token
    AuthService-->>APIGateway: Valid

    APIGateway->>OrderService: Create Order
    OrderService->>InventoryService: Check Stock
    InventoryService-->>OrderService: In Stock

    OrderService->>InventoryService: Reserve Items
    InventoryService-->>OrderService: Reserved

    OrderService->>NotificationService: Send Confirmation
    NotificationService-->>Client: Email Sent

    OrderService-->>APIGateway: Order Created
    APIGateway-->>Client: Success Response
```
