# Mermaid Diagram Test

This document tests various Mermaid diagram types in the fabriqa.ai Markdown Editor.

## Flowchart

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A
    C --> E[End]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Login Request
    Frontend->>Backend: Authenticate
    Backend->>Database: Query User
    Database-->>Backend: User Data
    Backend-->>Frontend: Auth Token
    Frontend-->>User: Success
```

## Class Diagram

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Start
    Processing --> Success : Complete
    Processing --> Failed : Error
    Success --> [*]
    Failed --> Idle : Retry
```

## ER Diagram

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int orderNumber
        date orderDate
    }
    LINE-ITEM {
        string productCode
        int quantity
    }
```

## Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Foundation           :a1, 2024-01-01, 14d
    TreeView            :a2, after a1, 14d
    section Phase 2
    Live Preview        :b1, after a2, 14d
    Reading Mode        :b2, after b1, 7d
```

## Pie Chart

```mermaid
pie title Technology Stack Usage
    "TypeScript" : 45
    "JavaScript" : 25
    "CSS" : 20
    "HTML" : 10
```

## Git Graph

```mermaid
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
```

## Mind Map

```mermaid
mindmap
  root((Markdown Editor))
    Features
      Live Preview
      Reading Mode
      Source Mode
    Technologies
      TypeScript
      CodeMirror
      VS Code API
    Goals
      User Friendly
      Fast
      Extensible
```

## Timeline

```mermaid
timeline
    title History of Markdown Editor
    2024-01 : Foundation
           : Basic Editor
    2024-02 : Live Preview
           : TreeView
    2024-03 : Reading Mode
           : Mermaid Support
```

## Invalid Syntax Test

This should show an error:

```mermaid
invalid syntax here
this will fail
```

## Simple Flowchart Test

```mermaid
graph LR
    A[Client] --> B[Load Balancer]
    B --> C[Server 1]
    B --> D[Server 2]
```

---

## Instructions

**In Live Preview Mode:**
- Diagrams should render automatically when cursor is outside the code block
- Hover over a diagram to see "View Code" button
- Click "View Code" to edit the source
- Click outside or move cursor away to return to diagram view

**In Reading Mode:**
- All diagrams should be fully rendered
- Invalid syntax should show error message with code view option

**In Source Mode:**
- Raw markdown syntax is always visible
