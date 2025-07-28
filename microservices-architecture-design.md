# Pocket Trend Tracker - Java Spring Boot Microservices Architecture

## Architecture Overview

```
┌─────────────────┐    ┌───────────────────────────────────────┐
│   React Frontend │    │              AWS Cloud                │
│                 │    │                                       │
│  - React 18     │    │  ┌─────────────────────────────────┐  │
│  - TypeScript   │    │  │         API Gateway              │  │
│  - Tailwind CSS │    │  │      (AWS API Gateway)          │  │
│  - Shadcn/ui    │    │  └─────────────────────────────────┘  │
└─────────────────┘    │                  │                    │
         │              │                  │                    │
         │              │  ┌─────────────────────────────────┐  │
         └──────────────┼──│      Load Balancer             │  │
                        │  │   (AWS Application LB)         │  │
                        │  └─────────────────────────────────┘  │
                        │                  │                    │
                        │                  │                    │
┌───────────────────────┼──────────────────┼────────────────────┼─────────────────────┐
│                       │                  │                    │                     │
│  ┌─────────────────┐  │  ┌─────────────────────────────────┐  │  ┌─────────────────┐ │
│  │   Auth Service  │  │  │      Transaction Service        │  │  │  Budget Service │ │
│  │                 │  │  │                                 │  │  │                 │ │
│  │ - JWT Auth      │  │  │ - Transaction CRUD              │  │  │ - Budget Plans  │ │
│  │ - User Mgmt     │  │  │ - Bulk Operations               │  │  │ - Budget Items  │ │
│  │ - Session Mgmt  │  │  │ - Transaction Validation        │  │  │ - Analysis      │ │
│  │                 │  │  │ - Recurring Templates           │  │  │                 │ │
│  └─────────────────┘  │  └─────────────────────────────────┘  │  └─────────────────┘ │
│           │            │                  │                    │           │         │
│  ┌─────────────────┐  │  ┌─────────────────────────────────┐  │  ┌─────────────────┐ │
│  │ Account Service │  │  │       Group Service             │  │  │Category Service │ │
│  │                 │  │  │                                 │  │  │                 │ │
│  │ - Account CRUD  │  │  │ - Group Management              │  │  │ - Category CRUD │ │
│  │ - Balance Calc  │  │  │ - Member Management             │  │  │ - Category Tree │ │
│  │ - Account Types │  │  │ - Group Invitations             │  │  │ - Validation    │ │
│  │                 │  │  │ - Group Transactions            │  │  │                 │ │
│  └─────────────────┘  │  └─────────────────────────────────┘  │  └─────────────────┘ │
│           │            │                  │                    │           │         │
│  ┌─────────────────┐  │  ┌─────────────────────────────────┐  │  ┌─────────────────┐ │
│  │Analytics Service│  │  │       File Service              │  │  │Notification Svc │ │
│  │                 │  │  │                                 │  │  │                 │ │
│  │ - Net Worth     │  │  │ - File Upload                   │  │  │ - Push Notifs   │ │
│  │ - Spending Trends│ │  │ - CSV Import                    │  │  │ - Email Alerts  │ │
│  │ - Reports       │  │  │ - Receipt Storage               │  │  │ - In-app Notifs │ │
│  │ - Export        │  │  │ - Import History                │  │  │                 │ │
│  └─────────────────┘  │  └─────────────────────────────────┘  │  └─────────────────┘ │
└───────────────────────┼──────────────────┼────────────────────┼─────────────────────┘
                        │                  │                    │
                        │  ┌─────────────────────────────────┐  │
                        │  │       Message Bus                │  │
                        │  │                                 │  │
                        │  │ - AWS SQS (Async Processing)    │  │
                        │  │ - AWS SNS (Event Broadcasting) │  │
                        │  │ - AWS EventBridge (Event Route)│  │
                        │  └─────────────────────────────────┘  │
                        │                  │                    │
                        │  ┌─────────────────────────────────┐  │
                        │  │          Cache Layer            │  │
                        │  │                                 │  │
                        │  │ - Redis Cluster                 │  │
                        │  │ - Session Storage               │  │
                        │  │ - Query Result Cache            │  │
                        │  │ - Rate Limiting                 │  │
                        │  └─────────────────────────────────┘  │
                        │                                       │
                        │  ┌─────────────────────────────────┐  │
                        │  │     Database Layer              │  │
                        │  │                                 │  │
                        │  │ ┌─────────────┐ ┌─────────────┐ │  │
                        │  │ │ CockroachDB │ │   Redis     │ │  │
                        │  │ │   Cluster   │ │  Cluster    │ │  │
                        │  │ └─────────────┘ └─────────────┘ │  │
                        │  │                                 │  │
                        │  │ Database per Service Pattern    │  │
                        │  └─────────────────────────────────┘  │
                        └───────────────────────────────────────┘
```

## Microservices Breakdown

### 1. Authentication Service (Port: 8081)
**Responsibilities:**
- User registration, login, logout
- JWT token generation and validation
- Password reset and user profile management
- Session management with Redis
- OAuth2 integration (future)

**Database:** CockroachDB - users table with encrypted sensitive data
**Tech Stack:** Spring Boot, Spring Security, Redis

### 2. Transaction Service (Port: 8082)
**Responsibilities:**
- Transaction CRUD operations
- Bulk transaction operations
- Transaction validation and business rules
- Recurring transaction templates
- Transaction categorization

**Database:** CockroachDB - transactions, recurring_templates tables
**Tech Stack:** Spring Boot, Spring Data JPA, AWS SQS for async processing

### 3. Account Service (Port: 8083)
**Responsibilities:**
- Account management (savings, checking, credit cards, etc.)
- Account balance calculations
- Account type management
- Account-transaction relationship management

**Database:** CockroachDB - accounts table
**Tech Stack:** Spring Boot, Spring Data JPA

### 4. Category Service (Port: 8084)
**Responsibilities:**
- Category hierarchy management
- Category CRUD operations
- Category validation and business rules
- Default category setup

**Database:** CockroachDB - categories table
**Tech Stack:** Spring Boot, Spring Data JPA

### 5. Budget Service (Port: 8085)
**Responsibilities:**
- Budget plan management
- Budget item management
- Budget vs actual analysis
- Budget alerts and notifications

**Database:** CockroachDB - budget_plans, budget_items tables
**Tech Stack:** Spring Boot, Spring Data JPA, AWS SQS for budget alerts

### 6. Group Service (Port: 8086)
**Responsibilities:**
- Group expense management
- Group member management
- Group invitations
- Group transaction sharing

**Database:** CockroachDB - expense_groups, group_members, group_invitations tables
**Tech Stack:** Spring Boot, Spring Data JPA, AWS SQS for invitations

### 7. Analytics Service (Port: 8087)
**Responsibilities:**
- Net worth calculations
- Spending trend analysis
- Financial reports generation
- Data export (CSV, PDF, JSON)

**Database:** CockroachDB - read replicas for analytics queries
**Tech Stack:** Spring Boot, Apache POI for Excel, iText for PDF

### 8. File Service (Port: 8088)
**Responsibilities:**
- File upload/download
- CSV import processing
- Receipt storage and OCR
- Import history management

**Database:** CockroachDB - import_logs table, AWS S3 for file storage
**Tech Stack:** Spring Boot, Apache Commons CSV, AWS S3 SDK, Tesseract OCR

### 9. Notification Service (Port: 8089)
**Responsibilities:**
- Push notifications
- Email alerts
- In-app notification management
- Notification preferences

**Database:** CockroachDB - notifications table
**Tech Stack:** Spring Boot, AWS SES, FCM for push notifications

## Cross-Cutting Concerns

### Service Discovery
- **Netflix Eureka** or **AWS Cloud Map**
- Each service registers itself on startup
- Load balancer queries registry for healthy instances

### Configuration Management
- **Spring Cloud Config** with AWS Parameter Store
- Environment-specific configurations
- Secret management with AWS Secrets Manager

### API Gateway
- **AWS API Gateway** or **Spring Cloud Gateway**
- Request routing and load balancing
- Authentication and authorization
- Rate limiting and throttling
- Request/response transformation

### Circuit Breaker Pattern
- **Resilience4j** for fault tolerance
- Circuit breaker for external service calls
- Retry mechanisms with exponential backoff
- Fallback mechanisms for service failures

### Monitoring and Observability
- **Spring Boot Actuator** for health checks
- **Micrometer** with **Prometheus** for metrics
- **Zipkin/Jaeger** for distributed tracing
- **ELK Stack** (Elasticsearch, Logstash, Kibana) for logging

### Security
- **JWT tokens** with 15-minute expiry
- **OAuth2 Resource Server** configuration
- **Method-level security** with @PreAuthorize
- **HTTPS everywhere** with TLS 1.3
- **CORS configuration** for frontend integration

## Database Strategy

### Database per Service Pattern
Each microservice has its own database schema/instance:

```sql
-- Auth Service Database
auth_db:
  - users
  - user_profiles
  - user_sessions

-- Transaction Service Database  
transaction_db:
  - transactions
  - recurring_templates

-- Account Service Database
account_db:
  - accounts

-- Category Service Database
category_db:
  - categories

-- Budget Service Database
budget_db:
  - budget_plans
  - budget_items

-- Group Service Database
group_db:
  - expense_groups
  - group_members
  - group_invitations

-- Analytics Service Database (Read Replicas)
analytics_db:
  - materialized_views
  - aggregated_reports

-- File Service Database
file_db:
  - import_logs
  - file_metadata

-- Notification Service Database
notification_db:
  - notifications
  - notification_preferences
```

### Data Consistency Strategy
- **Event-Driven Architecture** with AWS EventBridge
- **Saga Pattern** for distributed transactions
- **Event Sourcing** for critical financial transactions
- **CQRS** (Command Query Responsibility Segregation) for analytics

## AWS Messaging Integration

### AWS SQS (Simple Queue Service)
- **Dead Letter Queues** for failed message processing
- **Message deduplication** for exactly-once processing
- **Visibility timeout** for message processing guarantees

**Use Cases:**
- Async transaction processing
- Budget alert notifications
- File import processing
- Email notifications

### AWS SNS (Simple Notification Service)
- **Fan-out pattern** for broadcasting events
- **Topic-based messaging** for different event types
- **Message filtering** for targeted notifications

**Use Cases:**
- Transaction created events
- Budget threshold reached
- Group invitation events
- System-wide notifications

### AWS EventBridge
- **Event routing** between microservices
- **Event replay** for disaster recovery
- **Event schema registry** for event validation

**Use Cases:**
- Cross-service event communication
- Third-party integrations
- Scheduled event processing

## Caching Strategy with Redis

### Redis Cluster Configuration
```yaml
# Redis configuration for different use cases
Session Management:
  - TTL: 24 hours
  - Key pattern: session:{userId}:{sessionId}

Query Result Cache:
  - TTL: 15 minutes  
  - Key pattern: query:{service}:{hash}

Rate Limiting:
  - TTL: 1 hour
  - Key pattern: ratelimit:{userId}:{endpoint}

Distributed Locks:
  - TTL: 30 seconds
  - Key pattern: lock:{resource}:{operation}
```

## Deployment Architecture

### Container Strategy
- **Docker containers** for each microservice
- **Multi-stage builds** for optimized image size
- **Distroless base images** for security

### Orchestration
- **AWS ECS Fargate** for serverless containers
- **Auto-scaling** based on CPU/memory metrics
- **Blue-green deployments** for zero-downtime updates

### Infrastructure as Code
- **AWS CDK** (TypeScript) for infrastructure
- **AWS CloudFormation** for resource management
- **AWS Systems Manager** for configuration

## Security Implementation

### Authentication Flow
1. User logs in via Frontend
2. Auth Service validates credentials
3. JWT token issued with user claims
4. Redis stores session with TTL
5. Each request validates JWT + session

### Data Encryption
- **Column-level encryption** for sensitive financial data
- **AES-256 encryption** for data at rest
- **TLS 1.3** for data in transit
- **AWS KMS** for key management

### Network Security
- **VPC with private subnets** for microservices
- **Security groups** with minimal access
- **WAF** for API Gateway protection
- **Network ACLs** for additional layer

## Development Workflow

### Local Development
- **Docker Compose** for local service orchestration
- **Testcontainers** for integration testing
- **H2 database** for unit testing

### CI/CD Pipeline
- **GitHub Actions** for automated builds
- **SonarQube** for code quality analysis
- **Automated testing** (unit, integration, contract)
- **Security scanning** with OWASP dependency check

This architecture provides a solid foundation for a highly scalable, secure, and maintainable financial application that can handle enterprise-level requirements while maintaining the flexibility to evolve and add new features independently.