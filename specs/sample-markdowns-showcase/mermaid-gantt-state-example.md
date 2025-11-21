# Mermaid Gantt & State Diagram Examples

This document demonstrates Gantt charts and state diagrams.

## Project Timeline - Gantt Chart

```mermaid
gantt
    title Website Development Project
    dateFormat YYYY-MM-DD
    section Planning
    Requirements Gathering    :done, req, 2024-01-01, 2024-01-07
    Design Mockups            :done, design, 2024-01-08, 2024-01-14

    section Development
    Setup Development Environment :done, setup, 2024-01-15, 2024-01-17
    Frontend Development          :active, frontend, 2024-01-18, 2024-02-15
    Backend API Development       :backend, 2024-01-22, 2024-02-20
    Database Design               :done, db, 2024-01-18, 2024-01-25

    section Testing
    Unit Testing                  :testing, 2024-02-10, 2024-02-25
    Integration Testing           :2024-02-21, 2024-03-05
    User Acceptance Testing       :2024-03-01, 2024-03-10

    section Deployment
    Staging Deployment            :2024-03-06, 2024-03-08
    Production Deployment         :milestone, 2024-03-11, 0d
```

## Sprint Planning - Gantt Chart

```mermaid
gantt
    title Sprint 1 - User Authentication
    dateFormat YYYY-MM-DD
    section Backend
    User Model                :done, a1, 2024-01-01, 3d
    Authentication API        :done, a2, after a1, 5d
    JWT Implementation        :active, a3, after a2, 3d

    section Frontend
    Login Page                :done, b1, 2024-01-02, 4d
    Registration Form         :active, b2, after b1, 4d
    Auth Context              :b3, after b2, 2d

    section Testing
    Backend Tests             :c1, after a3, 2d
    Frontend Tests            :c2, after b3, 2d
    Integration Tests         :c3, after c1, 3d
```

## Order Processing State Machine

```mermaid
stateDiagram-v2
    [*] --> Pending

    Pending --> Processing: Payment Confirmed
    Pending --> Cancelled: Customer Cancels

    Processing --> Shipped: Items Packed
    Processing --> Cancelled: Out of Stock

    Shipped --> InTransit: Carrier Pickup
    InTransit --> Delivered: Delivery Confirmed
    InTransit --> Returned: Delivery Failed

    Delivered --> Completed: Customer Accepts
    Delivered --> Returned: Customer Rejects

    Returned --> Refunded: Return Processed
    Cancelled --> Refunded: Payment Reversed

    Completed --> [*]
    Refunded --> [*]
```

## User Session State

```mermaid
stateDiagram-v2
    [*] --> Anonymous

    Anonymous --> LoggingIn: Click Login
    LoggingIn --> Authenticated: Valid Credentials
    LoggingIn --> Anonymous: Invalid Credentials

    state Authenticated {
        [*] --> Active
        Active --> Idle: No Activity
        Idle --> Active: User Action
        Idle --> TimedOut: Timeout Reached
    }

    Authenticated --> LoggingOut: Click Logout
    TimedOut --> LoggingOut: Session Expired

    LoggingOut --> Anonymous: Session Cleared
    Anonymous --> [*]
```

## Git Workflow State Diagram

```mermaid
stateDiagram-v2
    [*] --> Main

    Main --> Feature: Create Branch
    Feature --> Feature: Commit Changes
    Feature --> Review: Create PR

    state Review {
        [*] --> CodeReview
        CodeReview --> Testing: Approved
        Testing --> CodeReview: Tests Failed
        Testing --> Approved: Tests Passed
    }

    Review --> Feature: Changes Requested
    Review --> Main: Merge PR
    Review --> Closed: Rejected

    Main --> Main: Continuous Integration
    Main --> [*]
    Closed --> [*]
```

## Application Lifecycle States

```mermaid
stateDiagram-v2
    [*] --> Startup

    Startup --> Initializing: Load Config
    Initializing --> Ready: Init Success
    Initializing --> Error: Init Failed

    Ready --> Running: Start Processing
    Running --> Paused: Pause Signal
    Paused --> Running: Resume Signal

    Running --> Stopping: Shutdown Signal
    Paused --> Stopping: Shutdown Signal

    Stopping --> Cleanup: Release Resources
    Cleanup --> Stopped: Cleanup Complete

    Error --> Recovery: Retry
    Recovery --> Ready: Recovery Success
    Recovery --> Error: Recovery Failed

    Stopped --> [*]
```
