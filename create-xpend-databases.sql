-- XPEND Microservices Database Setup
-- This script creates separate databases and users for each microservice
-- Run this script as the master postgres user

-- =============================================================================
-- Create Databases for Each Microservice
-- =============================================================================

CREATE DATABASE xpend_auth;
CREATE DATABASE xpend_transactions;
CREATE DATABASE xpend_accounts;
CREATE DATABASE xpend_categories;
CREATE DATABASE xpend_budget;
CREATE DATABASE xpend_groups;
CREATE DATABASE xpend_analytics;
CREATE DATABASE xpend_files;
CREATE DATABASE xpend_notifications;

-- =============================================================================
-- Create Users for Each Microservice
-- =============================================================================

CREATE ROLE auth_user WITH LOGIN PASSWORD 'xpend_local_password';
CREATE ROLE transaction_user WITH LOGIN PASSWORD 'xpend_local_password';
CREATE ROLE account_user WITH LOGIN PASSWORD 'xpend_local_password';
CREATE ROLE category_user WITH LOGIN PASSWORD 'xpend_local_password';
CREATE ROLE budget_user WITH LOGIN PASSWORD 'xpend_local_password';
CREATE ROLE group_user WITH LOGIN PASSWORD 'xpend_local_password';
CREATE ROLE analytics_user WITH LOGIN PASSWORD 'xpend_local_password';
CREATE ROLE file_user WITH LOGIN PASSWORD 'xpend_local_password';
CREATE ROLE notification_user WITH LOGIN PASSWORD 'xpend_local_password';

-- =============================================================================
-- Grant Permissions to Each User on Their Respective Database
-- =============================================================================

GRANT ALL PRIVILEGES ON DATABASE xpend_auth TO auth_user;
GRANT ALL PRIVILEGES ON DATABASE xpend_transactions TO transaction_user;
GRANT ALL PRIVILEGES ON DATABASE xpend_accounts TO account_user;
GRANT ALL PRIVILEGES ON DATABASE xpend_categories TO category_user;
GRANT ALL PRIVILEGES ON DATABASE xpend_budget TO budget_user;
GRANT ALL PRIVILEGES ON DATABASE xpend_groups TO group_user;
GRANT ALL PRIVILEGES ON DATABASE xpend_analytics TO analytics_user;
GRANT ALL PRIVILEGES ON DATABASE xpend_files TO file_user;
GRANT ALL PRIVILEGES ON DATABASE xpend_notifications TO notification_user;

-- =============================================================================
-- Connect to each database and grant schema permissions
-- =============================================================================

\c xpend_auth;
GRANT ALL ON SCHEMA public TO auth_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO auth_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO auth_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO auth_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO auth_user;

\c xpend_transactions;
GRANT ALL ON SCHEMA public TO transaction_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO transaction_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO transaction_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO transaction_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO transaction_user;

\c xpend_accounts;
GRANT ALL ON SCHEMA public TO account_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO account_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO account_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO account_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO account_user;

\c xpend_categories;
GRANT ALL ON SCHEMA public TO category_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO category_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO category_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO category_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO category_user;

\c xpend_budget;
GRANT ALL ON SCHEMA public TO budget_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO budget_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO budget_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO budget_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO budget_user;

\c xpend_groups;
GRANT ALL ON SCHEMA public TO group_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO group_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO group_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO group_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO group_user;

\c xpend_analytics;
GRANT ALL ON SCHEMA public TO analytics_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO analytics_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO analytics_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO analytics_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO analytics_user;

\c xpend_files;
GRANT ALL ON SCHEMA public TO file_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO file_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO file_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO file_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO file_user;

\c xpend_notifications;
GRANT ALL ON SCHEMA public TO notification_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO notification_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO notification_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO notification_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO notification_user;