# Cloud Infrastructure Setup - Step by Step

## 🔧 Current Environment Status

✅ **AWS CLI**: Installed (v2.27.55)  
❌ **AWS Credentials**: Not configured  
❌ **Java**: Version 11 (need 17+ for modern Spring Boot)  
❌ **Maven**: Not installed  

## 🚀 Phase 1: Development Environment Setup

### Step 1: Update Java to Version 17+
```bash
# Install Java 17 using Homebrew
brew install openjdk@17

# Add to PATH (add to ~/.zshrc or ~/.bashrc)
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"

# Verify installation
java -version
```

### Step 2: Install Maven
```bash
# Install Maven using Homebrew
brew install maven

# Verify installation
mvn -version
```

### Step 3: Configure AWS CLI
```bash
# Configure AWS credentials
aws configure

# You'll need:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region (e.g., us-east-1)
# - Default output format (json)

# Test configuration
aws sts get-caller-identity
```

### Step 4: Install Additional Tools
```bash
# Install Docker Desktop (download from docker.com)
# Install AWS CDK for Infrastructure as Code
npm install -g aws-cdk

# Verify CDK installation
cdk --version
```

## 🏗️ Phase 2: AWS Infrastructure Setup

### Step 1: Create AWS VPC with CDK

Create a new CDK project for infrastructure:

```bash
# Create infrastructure directory
mkdir pocket-trend-tracker-infrastructure
cd pocket-trend-tracker-infrastructure

# Initialize CDK project
cdk init app --language typescript

# Install additional CDK modules
npm install @aws-cdk/aws-ec2 @aws-cdk/aws-rds @aws-cdk/aws-elasticache @aws-cdk/aws-sqs @aws-cdk/aws-sns @aws-cdk/aws-s3
```

### Step 2: Infrastructure Code (lib/infrastructure-stack.ts)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class PocketTrendTrackerInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'PocketTrendTrackerVPC', {
      maxAzs: 3,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Redis Cluster for caching
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    const redisCluster = new elasticache.CfnReplicationGroup(this, 'RedisCluster', {
      description: 'Redis cluster for Pocket Trend Tracker',
      numCacheClusters: 3,
      engine: 'redis',
      cacheNodeType: 'cache.t3.micro',
      cacheSubnetGroupName: redisSubnetGroup.ref,
      securityGroupIds: [redisSecurityGroup.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
    });

    // S3 Bucket for file storage
    const filesBucket = new s3.Bucket(this, 'PocketTrendTrackerFiles', {
      bucketName: 'pocket-trend-tracker-files',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });

    // SQS Queues for async processing
    const transactionQueue = new sqs.Queue(this, 'TransactionProcessingQueue', {
      queueName: 'transaction-processing-queue',
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    const notificationQueue = new sqs.Queue(this, 'NotificationQueue', {
      queueName: 'notification-queue',
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // SNS Topics for event broadcasting
    const transactionTopic = new sns.Topic(this, 'TransactionEventsTopic', {
      topicName: 'transaction-events',
    });

    const budgetTopic = new sns.Topic(this, 'BudgetAlertsTopic', {
      topicName: 'budget-alerts',
    });

    // Secrets Manager for sensitive configuration
    const dbCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: 'pocket-trend-tracker/database',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // Parameter Store for application configuration
    new ssm.StringParameter(this, 'JwtSecretKey', {
      parameterName: '/pocket-trend-tracker/jwt-secret',
      stringValue: 'your-jwt-secret-key-here', // Replace with actual secret
    });

    // Output important values
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrRedisEndpointAddress,
      description: 'Redis cluster endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: filesBucket.bucketName,
      description: 'S3 bucket for file storage',
    });
  }
}
```

### Step 3: Deploy Infrastructure
```bash
# Bootstrap CDK (one-time setup per region)
cdk bootstrap

# Deploy the infrastructure
cdk deploy

# This will create:
# - VPC with public/private subnets
# - Redis cluster for caching
# - S3 bucket for file storage
# - SQS queues for messaging
# - SNS topics for events
# - Secrets Manager entries
```

## 🗄️ Phase 3: CockroachDB Cloud Setup

### Step 1: Create CockroachDB Cloud Account
1. Go to [https://cockroachlabs.cloud](https://cockroachlabs.cloud)
2. Sign up for free account
3. Create new cluster:
   - **Name**: pocket-trend-tracker-dev
   - **Cloud**: AWS
   - **Region**: Same as your AWS region (e.g., us-east-1)
   - **Plan**: Basic (free tier for development)

### Step 2: Configure CockroachDB Security
```sql
-- Create databases for each microservice
CREATE DATABASE auth_db;
CREATE DATABASE transaction_db;
CREATE DATABASE account_db;
CREATE DATABASE category_db;
CREATE DATABASE budget_db;
CREATE DATABASE group_db;
CREATE DATABASE analytics_db;
CREATE DATABASE file_db;
CREATE DATABASE notification_db;

-- Create service-specific users
CREATE USER auth_service WITH PASSWORD 'secure_password_here';
CREATE USER transaction_service WITH PASSWORD 'secure_password_here';
CREATE USER account_service WITH PASSWORD 'secure_password_here';
-- ... repeat for other services

-- Grant permissions
GRANT ALL ON DATABASE auth_db TO auth_service;
GRANT ALL ON DATABASE transaction_db TO transaction_service;
-- ... repeat for other services
```

### Step 3: Store CockroachDB Connection Strings
```bash
# Add to AWS Secrets Manager
aws secretsmanager create-secret \
  --name "pocket-trend-tracker/cockroachdb" \
  --description "CockroachDB connection strings" \
  --secret-string '{
    "auth_db_url": "postgresql://auth_service:password@cluster-host:26257/auth_db?sslmode=require",
    "transaction_db_url": "postgresql://transaction_service:password@cluster-host:26257/transaction_db?sslmode=require"
  }'
```

## 🔐 Phase 4: Security Setup

### Step 1: Create IAM Roles for Microservices
```bash
# Create IAM policy for microservices
aws iam create-policy \
  --policy-name PocketTrendTrackerMicroservicePolicy \
  --policy-document file://microservice-policy.json

# Create IAM role for ECS tasks
aws iam create-role \
  --role-name PocketTrendTrackerECSRole \
  --assume-role-policy-document file://ecs-trust-policy.json

# Attach policy to role
aws iam attach-role-policy \
  --role-name PocketTrendTrackerECSRole \
  --policy-arn arn:aws:iam::ACCOUNT-ID:policy/PocketTrendTrackerMicroservicePolicy
```

### Step 2: Configure SSL/TLS Certificates
```bash
# Request SSL certificate through AWS Certificate Manager
aws acm request-certificate \
  --domain-name api.pockettrend.com \
  --subject-alternative-names "*.api.pockettrend.com" \
  --validation-method DNS
```

## 📊 Phase 5: Monitoring Setup

### Step 1: CloudWatch Configuration
```bash
# Create CloudWatch log groups for each microservice
aws logs create-log-group --log-group-name /aws/ecs/auth-service
aws logs create-log-group --log-group-name /aws/ecs/transaction-service
aws logs create-log-group --log-group-name /aws/ecs/account-service
# ... repeat for other services
```

### Step 2: Set up CloudWatch Alarms
```bash
# Create alarm for high error rates
aws cloudwatch put-metric-alarm \
  --alarm-name "HighErrorRate" \
  --alarm-description "Alert when error rate is too high" \
  --metric-name "ErrorRate" \
  --namespace "AWS/ECS" \
  --statistic "Average" \
  --period 300 \
  --threshold 5.0 \
  --comparison-operator "GreaterThanThreshold"
```

## ✅ Verification Steps

After setup, verify everything works:

```bash
# Test AWS connectivity
aws sts get-caller-identity

# Test Redis connectivity (using redis-cli)
redis-cli -h your-redis-endpoint -p 6379 ping

# Test CockroachDB connectivity
psql "postgresql://username:password@cluster-host:26257/defaultdb?sslmode=require"

# Test S3 access
aws s3 ls s3://pocket-trend-tracker-files
```

## 🎯 Next Steps

Once infrastructure is ready:
1. **Create Spring Boot microservice projects**
2. **Configure application properties** with AWS endpoints
3. **Implement authentication service** first
4. **Set up CI/CD pipeline** for deployment
5. **Deploy first microservice** to test end-to-end flow

## 💡 Cost Optimization Tips

- Use **AWS Free Tier** where possible
- Start with **t3.micro** instances for development
- Enable **auto-scaling** to scale down during non-usage
- Use **spot instances** for non-critical workloads
- Monitor costs with **AWS Cost Explorer**

The infrastructure setup will provide a solid, production-ready foundation for your microservices architecture!