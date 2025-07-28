# Multi-AWS Account Setup with Profiles

## 🎯 Overview

Set up multiple AWS profiles to easily switch between different AWS accounts:
- **Profile 1:** Your existing/old AWS account  
- **Profile 2:** Your new AWS account (for XPEND project)

## 🔧 Step 1: Configure Your Old Account Profile

Let's restore your old account credentials first:

```bash
# Configure your old account with a named profile
aws configure --profile old-account
```

**When prompted, enter your OLD account details:**
- AWS Access Key ID: [Your old account access key]
- AWS Secret Access Key: [Your old account secret key]  
- Default region: [Your preferred region, e.g., us-east-1]
- Default output format: json

## 🆕 Step 2: Configure Your New Account Profile (XPEND)

```bash
# Configure your new account with a named profile
aws configure --profile xpend
```

**When prompted, enter your NEW account details:**
- AWS Access Key ID: [Your new account access key - you'll need to create this]
- AWS Secret Access Key: [Your new account secret key]
- Default region: us-east-1
- Default output format: json

## 🧪 Step 3: Test Both Profiles

```bash
# Test old account
aws sts get-caller-identity --profile old-account

# Test new account (XPEND)
aws sts get-caller-identity --profile xpend
```

## 🎚️ Step 4: Set Default Profile for XPEND Project

```bash
# Set the XPEND profile as default for this project
export AWS_PROFILE=xpend

# Add to your shell profile to make it persistent
echo 'export AWS_PROFILE=xpend' >> ~/.zshrc
```

## 🔄 Step 5: Profile Usage Commands

### Switch Between Accounts:
```bash
# Use old account
aws s3 ls --profile old-account

# Use XPEND account  
aws s3 ls --profile xpend

# Use default (XPEND)
aws s3 ls
```

### Set Environment Variable:
```bash
# Switch to old account for current session
export AWS_PROFILE=old-account

# Switch to XPEND account for current session
export AWS_PROFILE=xpend

# Check current profile
echo $AWS_PROFILE
```

## 📁 Configuration Files Structure

After setup, your AWS config will look like:

**~/.aws/credentials:**
```ini
[old-account]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[xpend]
aws_access_key_id = AKIAI44QH8DHBEXAMPLE
aws_secret_access_key = je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY
```

**~/.aws/config:**
```ini
[profile old-account]
region = us-east-1
output = json

[profile xpend]
region = us-east-1
output = json
```

## 🎯 CDK Multi-Profile Setup

For CDK deployments with different profiles:

```bash
# Bootstrap CDK for XPEND account
cdk bootstrap --profile xpend

# Deploy to XPEND account
cdk deploy --profile xpend

# Bootstrap CDK for old account (if needed)
cdk bootstrap --profile old-account
```

## 🔐 Security Best Practices

### For Each Account:
1. **Create separate IAM users** (don't use root)
2. **Use least privilege** principle  
3. **Enable MFA** on both accounts
4. **Set up billing alerts** for both accounts
5. **Rotate access keys** regularly

### Profile Management:
1. **Name profiles clearly** (e.g., `company-prod`, `personal-dev`)
2. **Set default profile** for your main project
3. **Use environment variables** for temporary switches
4. **Document which profile** is used for which project

## 🚀 XPEND Project Workflow

For your XPEND project, always use the `xpend` profile:

```bash
# Set XPEND as default
export AWS_PROFILE=xpend

# All AWS commands will use XPEND account
aws sts get-caller-identity
cdk deploy
aws s3 ls
```

## 🆘 Troubleshooting

**Profile not found:**
```bash
# List all configured profiles
aws configure list-profiles

# Check specific profile
aws configure list --profile xpend
```

**Wrong account being used:**
```bash
# Check current identity
aws sts get-caller-identity

# Check current profile
echo $AWS_PROFILE
```

**Reset profile:**
```bash
# Reconfigure specific profile
aws configure --profile xpend
```

## 🎯 Next Steps

Once both profiles are set up:

1. ✅ Test both profiles work
2. ✅ Set XPEND as default: `export AWS_PROFILE=xpend`
3. ✅ Bootstrap CDK for XPEND: `cdk bootstrap`
4. 🔄 Create XPEND infrastructure
5. 🔄 Keep old account for other projects

This setup gives you the flexibility to work with both accounts seamlessly!