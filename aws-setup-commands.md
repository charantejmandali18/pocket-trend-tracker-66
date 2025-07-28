# AWS Setup Commands for XPEND

## Step 1: Configure AWS CLI

Run this command and enter your IAM user credentials:

```bash
aws configure
```

**You'll be prompted for:**
- **AWS Access Key ID**: [Enter the Access Key from IAM user]
- **AWS Secret Access Key**: [Enter the Secret Key from IAM user]  
- **Default region name**: `us-east-1` (recommended for XPEND)
- **Default output format**: `json`

## Step 2: Test AWS Configuration

```bash
# Test AWS CLI connection
aws sts get-caller-identity

# Should return your IAM user details like:
# {
#   "UserId": "AIDACKCEVSQ6C2EXAMPLE",
#   "Account": "123456789012", 
#   "Arn": "arn:aws:iam::123456789012:user/xpend-developer"
# }
```

## Step 3: Set Up AWS CDK

```bash
# Bootstrap CDK for your account/region
cdk bootstrap

# This creates the necessary S3 bucket and IAM roles for CDK deployments
```

## Step 4: Create Initial AWS Resources

Once AWS CLI is configured, we'll create:

### 4.1 VPC and Networking
```bash
# We'll use CDK to create VPC with:
# - 3 Availability Zones
# - Public subnets for load balancers
# - Private subnets for microservices  
# - NAT Gateways for outbound traffic
```

### 4.2 Security Groups
```bash
# Security groups for:
# - Microservices (port 8081-8089)
# - Database access (PostgreSQL)
# - Redis cache access
# - Load balancer access
```

### 4.3 S3 Bucket
```bash
# Encrypted S3 bucket for:
# - File uploads
# - Receipt storage
# - Application logs
# - CDK assets
```

### 4.4 Messaging Services
```bash
# SQS Queues:
# - transaction-processing-queue
# - notification-queue
# - file-import-queue

# SNS Topics:
# - transaction-events
# - budget-alerts
# - system-notifications
```

### 4.5 Secrets Manager
```bash
# Store sensitive configuration:
# - Database connection strings
# - JWT signing keys
# - Third-party API keys
# - Redis connection details
```

## Step 5: Cost Monitoring Setup

```bash
# Enable billing alerts
aws budgets create-budget --account-id YOUR_ACCOUNT_ID --budget '{
  "BudgetName": "XPEND-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "50",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}'
```

## Important Notes:

1. **Free Tier**: Your new account includes 12 months of free tier benefits
2. **Regions**: We're using `us-east-1` for lower costs and better service availability
3. **Security**: Never commit AWS credentials to code repositories
4. **Costs**: Most services we'll use are free tier eligible initially

## Next Steps After CLI Setup:

1. ✅ Configure AWS CLI credentials
2. ✅ Test connection with `aws sts get-caller-identity`
3. ✅ Bootstrap CDK with `cdk bootstrap`
4. 🔄 Create VPC and networking infrastructure
5. 🔄 Set up security groups and IAM roles
6. 🔄 Deploy messaging and storage services
7. 🔄 Configure monitoring and logging

Let me know when you've completed the AWS CLI configuration and I'll guide you through the infrastructure setup!