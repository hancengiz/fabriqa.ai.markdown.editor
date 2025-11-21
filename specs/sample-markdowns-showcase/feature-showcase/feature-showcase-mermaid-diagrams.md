# Mermaid Diagrams

This demonstrates Mermaid diagram rendering for various diagram types.

---

## Flowchart

```mermaid
%% {"editorSize": {"width": 166, "height": 274}} %%
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[End]
```

---

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Editor
    participant Extension

    User->>Editor: Open File
    Editor->>Extension: Load Content
    Extension-->>Editor: Render Preview
    Editor-->>User: Display
```

---

## Class Diagram

```mermaid
classDiagram
    class Editor {
        +String content
        +Mode mode
        +render()
        +save()
    }

    class Theme {
        +String name
        +Colors colors
        +apply()
    }

    Editor --> Theme : uses
```

---

## Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD

    section Planning
    Requirements    :done, 2024-01-01, 7d
    Design         :done, 2024-01-08, 5d

    section Development
    Backend        :active, 2024-01-15, 14d
    Frontend       :2024-01-22, 14d

    section Testing
    QA Testing     :2024-02-05, 7d
```

---

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Editing : User Types
    Editing --> Saving : Cmd+S
    Saving --> Idle : Save Complete
    Idle --> [*]
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ POST : writes
    USER ||--o{ COMMENT : writes
    POST ||--o{ COMMENT : has

    USER {
        int id PK
        string email
        string name
    }

    POST {
        int id PK
        int user_id FK
        string title
        text content
    }

    COMMENT {
        int id PK
        int user_id FK
        int post_id FK
        text content
    }
```

---

## Features

- **Live Rendering**: Diagrams render automatically
- **Interactive**: Diagrams are fully interactive
- **Obsidian-Style**: Click inside to see/edit code, click outside to see diagram
- **Search Support**: Code becomes visible when search matches inside diagram
- **All Diagram Types**: Supports flowcharts, sequence, class, Gantt, state, ER, and more

---

## Obsidian-Style Editing

In **Live Preview** mode:
- When cursor is **outside**: Beautiful rendered diagram
- When cursor is **inside**: Raw mermaid code visible for editing
- When **searching**: Code visible if search matches inside
- This allows seamless editing and viewing

---

## Syntax

````markdown
```mermaid
graph TD
    A[Start] --> B[End]
```
````

---

*Part of fabriqa.ai Markdown Editor Feature Showcase*
