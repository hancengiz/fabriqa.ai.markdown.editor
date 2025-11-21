# Mermaid Class & ER Diagram Examples

This document demonstrates class diagrams and entity-relationship diagrams.

## E-Commerce Class Diagram

```mermaid
classDiagram
    class User {
        +int id
        +string email
        +string name
        +DateTime createdAt
        +login()
        +logout()
        +updateProfile()
    }

    class Product {
        +int id
        +string name
        +decimal price
        +int stock
        +string description
        +updateStock()
        +setPrice()
    }

    class Order {
        +int id
        +DateTime orderDate
        +string status
        +decimal total
        +calculateTotal()
        +updateStatus()
        +cancel()
    }

    class OrderItem {
        +int id
        +int quantity
        +decimal price
        +decimal subtotal
        +calculateSubtotal()
    }

    class Payment {
        +int id
        +decimal amount
        +string method
        +string status
        +DateTime paidAt
        +process()
        +refund()
    }

    User "1" --> "*" Order : places
    Order "1" --> "*" OrderItem : contains
    OrderItem "*" --> "1" Product : references
    Order "1" --> "1" Payment : has
```

## Blog System ER Diagram

```mermaid
erDiagram
    USER ||--o{ POST : writes
    USER ||--o{ COMMENT : writes
    POST ||--o{ COMMENT : has
    POST }o--|| CATEGORY : belongs_to
    POST }o--o{ TAG : has

    USER {
        int id PK
        string email UK
        string username UK
        string password
        datetime created_at
        datetime updated_at
    }

    POST {
        int id PK
        int user_id FK
        int category_id FK
        string title
        text content
        string status
        datetime published_at
        datetime created_at
        datetime updated_at
    }

    COMMENT {
        int id PK
        int user_id FK
        int post_id FK
        text content
        datetime created_at
        datetime updated_at
    }

    CATEGORY {
        int id PK
        string name UK
        string slug UK
        text description
    }

    TAG {
        int id PK
        string name UK
        string slug UK
    }
```

## Banking System Class Diagram

```mermaid
classDiagram
    class Account {
        <<abstract>>
        +string accountNumber
        +decimal balance
        +Customer owner
        +deposit(amount)
        +withdraw(amount)*
        +getBalance()
    }

    class SavingsAccount {
        +decimal interestRate
        +calculateInterest()
        +withdraw(amount)
    }

    class CheckingAccount {
        +decimal overdraftLimit
        +withdraw(amount)
    }

    class Customer {
        +int id
        +string name
        +string email
        +string phone
        +List~Account~ accounts
        +openAccount()
        +closeAccount()
    }

    class Transaction {
        +int id
        +DateTime timestamp
        +decimal amount
        +string type
        +Account fromAccount
        +Account toAccount
        +execute()
    }

    Account <|-- SavingsAccount : inherits
    Account <|-- CheckingAccount : inherits
    Customer "1" --> "*" Account : owns
    Transaction "*" --> "1" Account : affects
```

## University Database ER Diagram

```mermaid
erDiagram
    STUDENT ||--o{ ENROLLMENT : enrolls
    COURSE ||--o{ ENROLLMENT : has
    COURSE }o--|| DEPARTMENT : offered_by
    INSTRUCTOR ||--o{ COURSE : teaches
    INSTRUCTOR }o--|| DEPARTMENT : works_for

    STUDENT {
        int student_id PK
        string first_name
        string last_name
        string email UK
        date date_of_birth
        string major
    }

    COURSE {
        int course_id PK
        string course_code UK
        string title
        int credits
        int department_id FK
        int instructor_id FK
    }

    ENROLLMENT {
        int enrollment_id PK
        int student_id FK
        int course_id FK
        string semester
        int year
        decimal grade
    }

    INSTRUCTOR {
        int instructor_id PK
        string first_name
        string last_name
        string email UK
        int department_id FK
    }

    DEPARTMENT {
        int department_id PK
        string name UK
        string code UK
        string building
    }
```
