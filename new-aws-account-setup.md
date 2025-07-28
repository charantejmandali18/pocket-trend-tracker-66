# New AWS Account Setup for XPEND

## 🚀 Step-by-Step Guide

### Step 1: Create IAM User (Do this in AWS Console)

**⚠️ Important:** Never use your root AWS account for development. Create an IAM user instead.

1. **Log into your NEW AWS Console** with root account
2. **Go to IAM service** → Users → "Create user"

3. **User Details:**
   - User name: `xpend-developer`
   - ✅ Check "Provide user access to the AWS Management Console"
   - Console access: ✅ "I want to create an IAM user"
   - Console password: Set a strong password
   - ❌ Uncheck "Users must create a new password at next sign-in"

4. **Set Permissions:**
   - Choose: "Attach policies directly"
   - Search and select: `AdministratorAccess`
   - ⚠️ Note: We'll restrict this later for production

5. **Review and Create User**

### Step 2: Create Programmatic Access Keys

1. **After user creation**, click on the `xpend-developer` user
2. **Go to "Security credentials" tab**
3. **Click "Create access key"**
4. **Choose "Command Line Interface (CLI)"**
5. **Add description tag:** "XPEND Development CLI Access"
6. **Click "Create access key"**
7. **⚠️ IMPORTANT: Download the CSV file** or copy the keys immediately
   - You won't be able to see the secret key again!

### Step 3: Configure AWS CLI

Run this command in your terminal:

```bash
aws configure
```

**When prompted, enter:**
- **AWS Access Key ID:** [From step 2]
- **AWS Secret Access Key:** [From step 2]
- **Default region name:** `us-east-1`
- **Default output format:** `json`

### Step 4: Test Configuration

```bash
# Test your new configuration
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDAXXXXXXXXXXXXX",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/xpend-developer"
}
```

### Step 5: Enable Billing Alerts (Recommended)

1. **Go to AWS Console** → Billing and Cost Management
2. **Billing preferences** → ✅ "Receive Billing Alerts"
3. **Save preferences**

### Step 6: Set Up Budget Alert

```bash
# Create a $50 monthly budget alert
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "XPEND-Monthly-Budget",
    "BudgetLimit": {
      "Amount": "50.0",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST",
    "CostFilters": {},
    "TimePeriod": {
      "Start": "'$(date -u +%Y-%m-01)'",
      "End": "'$(date -u -d "next month" +%Y-%m-01)'"
    }
  }' \
  --notifications-with-subscribers '[{
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [{
      "SubscriptionType": "EMAIL",
      "Address": "your-email@example.com"
    }]
  }]'
```

## 🔐 Security Best Practices

### ✅ Do This:
- Use IAM users instead of root account
- Enable MFA on root account
- Set up billing alerts
- Use least privilege principle
- Regularly rotate access keys

### ❌ Never Do This:
- Commit AWS credentials to code repositories
- Share access keys via email/chat
- Use root account for daily operations
- Leave unused resources running

## 🆓 Free Tier Resources (12 months)

Your new account includes:
- **EC2:** 750 hours/month t2.micro instances
- **RDS:** 750 hours/month db.t2.micro + 20GB storage
- **ElastiCache:** 750 hours/month cache.t2.micro
- **S3:** 5GB storage + 20,000 GET requests
- **Lambda:** 1M requests/month
- **CloudWatch:** 10 custom metrics

## 🎯 Next Steps After CLI Setup

Once your AWS CLI is configured and tested:

1. ✅ Bootstrap CDK: `cdk bootstrap`
2. 🔄 Create VPC infrastructure
3. 🔄 Set up security groups
4. 🔄 Deploy messaging services
5. 🔄 Create encrypted S3 bucket
6. 🔄 Set up ElastiCache Redis

## 🆘 Troubleshooting

**If you get permission errors:**
- Make sure you're using the IAM user (not root)
- Verify AdministratorAccess policy is attached
- Check if region is set correctly

**If credentials don't work:**
- Recreate access keys in IAM console
- Make sure you copied them correctly
- Try `aws configure` again

Let me know when you've completed the AWS CLI setup and I'll continue with infrastructure deployment!