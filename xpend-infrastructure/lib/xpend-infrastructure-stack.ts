import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class XpendInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC with public and private subnets across 3 AZs
    const vpc = new ec2.Vpc(this, 'XpendVPC', {
      maxAzs: 3,
      natGateways: 2, // Cost optimization: 2 NAT gateways instead of 3
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Group for Microservices
    const microservicesSecurityGroup = new ec2.SecurityGroup(this, 'MicroservicesSecurityGroup', {
      vpc,
      description: 'Security group for XPEND microservices',
      allowAllOutbound: true,
    });

    // Allow inbound traffic on microservice ports (8081-8089)
    for (let port = 8081; port <= 8089; port++) {
      microservicesSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(port),
        `Allow inbound on port ${port}`
      );
    }

    // Security Group for Redis
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Security group for Redis cluster',
      allowAllOutbound: false,
    });

    redisSecurityGroup.addIngressRule(
      microservicesSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow microservices to access Redis'
    );

    // Redis Subnet Group
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    // Redis Cluster (t3.micro for cost optimization)
    const redisCluster = new elasticache.CfnReplicationGroup(this, 'XpendRedisCluster', {
      description: 'Redis cluster for XPEND microservices',
      replicationGroupId: 'xpend-redis',
      numCacheClusters: 2, // Primary + 1 replica
      engine: 'redis',
      cacheNodeType: 'cache.t3.micro', // Free tier eligible
      cacheSubnetGroupName: redisSubnetGroup.ref,
      securityGroupIds: [redisSecurityGroup.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: false, // Disable for t3.micro compatibility
      automaticFailoverEnabled: true,
      multiAzEnabled: true,
    });

    // S3 Bucket for file storage
    const filesBucket = new s3.Bucket(this, 'XpendFilesBucket', {
      bucketName: `xpend-files-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // SQS Queues for async processing
    const transactionQueue = new sqs.Queue(this, 'TransactionProcessingQueue', {
      queueName: 'xpend-transaction-processing',
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'TransactionDLQ', {
          queueName: 'xpend-transaction-dlq',
          encryption: sqs.QueueEncryption.KMS_MANAGED,
        }),
        maxReceiveCount: 3,
      },
    });

    const notificationQueue = new sqs.Queue(this, 'NotificationQueue', {
      queueName: 'xpend-notifications',
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'NotificationDLQ', {
          queueName: 'xpend-notification-dlq',
          encryption: sqs.QueueEncryption.KMS_MANAGED,
        }),
        maxReceiveCount: 3,
      },
    });

    const fileProcessingQueue = new sqs.Queue(this, 'FileProcessingQueue', {
      queueName: 'xpend-file-processing',
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'FileProcessingDLQ', {
          queueName: 'xpend-file-processing-dlq',
          encryption: sqs.QueueEncryption.KMS_MANAGED,
        }),
        maxReceiveCount: 3,
      },
    });

    // SNS Topics for event broadcasting
    const transactionTopic = new sns.Topic(this, 'TransactionEventsTopic', {
      topicName: 'xpend-transaction-events',
      displayName: 'XPEND Transaction Events',
    });

    const budgetAlertsTopic = new sns.Topic(this, 'BudgetAlertsTopic', {
      topicName: 'xpend-budget-alerts',
      displayName: 'XPEND Budget Alerts',
    });

    const systemNotificationsTopic = new sns.Topic(this, 'SystemNotificationsTopic', {
      topicName: 'xpend-system-notifications',
      displayName: 'XPEND System Notifications',
    });

    // Secrets Manager for sensitive configuration
    const databaseCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: 'xpend/database-credentials',
      description: 'Database connection credentials for XPEND',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ 
          username: 'xpend_admin',
          host: 'YOUR_COCKROACHDB_HOST',
          port: 26257,
          database: 'xpend'
        }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\\'',
        includeSpace: false,
        passwordLength: 32,
      },
    });

    const jwtSecrets = new secretsmanager.Secret(this, 'JWTSecrets', {
      secretName: 'xpend/jwt-secrets',
      description: 'JWT signing keys and secrets for XPEND',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          issuer: 'xpend-auth-service',
          audience: 'xpend-microservices'
        }),
        generateStringKey: 'signingKey',
        excludeCharacters: '"@/\\\'',
        includeSpace: false,
        passwordLength: 64,
      },
    });

    // Parameter Store for application configuration
    new ssm.StringParameter(this, 'RedisEndpoint', {
      parameterName: '/xpend/redis/endpoint',
      stringValue: redisCluster.attrRedisEndpointAddress,
      description: 'Redis cluster endpoint for XPEND microservices',
    });

    new ssm.StringParameter(this, 'S3BucketName', {
      parameterName: '/xpend/s3/files-bucket',
      stringValue: filesBucket.bucketName,
      description: 'S3 bucket name for file storage',
    });

    new ssm.StringParameter(this, 'VPCId', {
      parameterName: '/xpend/vpc/id',
      stringValue: vpc.vpcId,
      description: 'VPC ID for XPEND infrastructure',
    });

    // IAM Role for microservices
    const microserviceRole = new iam.Role(this, 'MicroserviceRole', {
      roleName: 'XpendMicroserviceRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'IAM role for XPEND microservices',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Grant permissions to microservices
    filesBucket.grantReadWrite(microserviceRole);
    transactionQueue.grantSendMessages(microserviceRole);
    transactionQueue.grantConsumeMessages(microserviceRole);
    notificationQueue.grantSendMessages(microserviceRole);
    notificationQueue.grantConsumeMessages(microserviceRole);
    fileProcessingQueue.grantSendMessages(microserviceRole);
    fileProcessingQueue.grantConsumeMessages(microserviceRole);
    
    transactionTopic.grantPublish(microserviceRole);
    budgetAlertsTopic.grantPublish(microserviceRole);
    systemNotificationsTopic.grantPublish(microserviceRole);
    
    databaseCredentials.grantRead(microserviceRole);
    jwtSecrets.grantRead(microserviceRole);

    // Output important values
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for XPEND infrastructure',
      exportName: 'XpendVPCId',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private subnet IDs for microservices',
      exportName: 'XpendPrivateSubnetIds',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs for load balancers',
      exportName: 'XpendPublicSubnetIds',
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrRedisEndpointAddress,
      description: 'Redis cluster endpoint',
      exportName: 'XpendRedisEndpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: filesBucket.bucketName,
      description: 'S3 bucket for file storage',
      exportName: 'XpendS3Bucket',
    });

    new cdk.CfnOutput(this, 'MicroserviceRoleArn', {
      value: microserviceRole.roleArn,
      description: 'IAM role ARN for microservices',
      exportName: 'XpendMicroserviceRoleArn',
    });
  }
}