rootProject.name = "xpend-backend"

// Include all microservices
include(
    "auth-service",
    "transaction-service", 
    "account-service",
    "category-service",
    "budget-service",
    "group-service",
    "analytics-service",
    "file-service",
    "notification-service"
)

// Configure project directories
project(":auth-service").projectDir = file("auth-service")
project(":transaction-service").projectDir = file("transaction-service")
project(":account-service").projectDir = file("account-service")
project(":category-service").projectDir = file("category-service")
project(":budget-service").projectDir = file("budget-service")
project(":group-service").projectDir = file("group-service")
project(":analytics-service").projectDir = file("analytics-service")
project(":file-service").projectDir = file("file-service")
project(":notification-service").projectDir = file("notification-service")

// Enable Gradle version catalog for dependency management
enableFeaturePreview("TYPESAFE_PROJECT_ACCESSORS")