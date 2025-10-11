# Data Categorization Application - Complete Analysis

## Application Overview

This is a full-stack web application for data categorization with user management, item maintenance, and bulk data processing capabilities. The application supports multiple deployment architectures and frontend options.

## Core Features

### User Management
- **Self-registration** with email/password
- **Login/logout** with session-based authentication
- **Password reset** via email tokens (SMTP configurable)
- **Role-based access** (annotator/admin roles)
- **Admin panel** for user promotion

### Item Management
- **Item CRUD operations** (create, read, update, delete)
- **Category assignment** with dropdown selection
- **Bulk categorization** (select multiple items, assign category)
- **Search and filtering** by name, SKU, category
- **Pagination** for large datasets
- **Audit trails** (updated_by, updated_at tracking)

### Bulk Data Processing
- **CSV/XLSX upload** via web interface
- **Background processing** with upload queue
- **Per-row reporting** (success/error status per row)
- **Deduplication modes**: skip, update, or duplicate
- **Progress tracking** and error reporting
- **Failed row export** (CSV download)

## Technical Architecture

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **Database**: SQLite (development) with migration system
- **Authentication**: bcrypt + express-session + connect-sqlite3
- **File Processing**: multer, csv-parse, xlsx
- **Email**: nodemailer (configurable SMTP)
- **Background Jobs**: In-process polling worker

### Database Schema
```sql
-- Core tables
users (id, email, password_hash, role)
categories (id, name)
items (id, sku, name, primary_detail, category_id, updated_by, updated_at)

-- Authentication
password_resets (token, user_id, expires)

-- Bulk processing
upload_records (id, user_id, filename, file_size, file_path, items_created, status, dedupe_mode, created_at)
upload_rows (id, upload_id, row_number, raw_data, status, message)
```

### Frontend Options

#### 1. Server-Rendered UI (Primary)
- **Technology**: EJS templates + Express
- **Location**: `views/` directory
- **Features**: Complete UI with forms, pagination, bulk upload
- **Authentication**: Server-side session management
- **Styling**: Bootstrap-based responsive design

#### 2. React SPA (Create React App)
- **Location**: `data-categorization-app/`
- **Technology**: React 19.2.0 + react-scripts 5.0.1
- **Development**: CRA dev server with proxy support
- **Build**: Standard CRA build pipeline

#### 3. React SPA (Vite - Recommended for Production)
- **Location**: `frontend-react/`
- **Technology**: React 19.0.0 + Vite 5.0.0
- **Features**: 
  - Fast development with HMR
  - Optimized production builds
  - Environment-aware API configuration
  - Ready for static hosting (S3/CloudFront)

## API Endpoints

### Authentication
- `GET/POST /register` - User registration
- `GET/POST /login` - User authentication
- `POST /logout` - Session termination
- `GET/POST /reset` - Password reset request
- `GET/POST /reset/:token` - Password reset completion

### Items Management
- `GET /items` - List items (paginated, filterable)
- `GET /items/new` - New item form
- `POST /items` - Create item
- `GET /items/:id/edit` - Edit item form
- `POST /items/:id` - Update item
- `POST /items/bulk_assign` - Bulk category assignment

### JSON API
- `GET /api/items` - Items list (JSON)
- `POST /api/items` - Create item (JSON)
- `PUT /api/items/:id` - Update item (JSON)

### Bulk Upload
- `GET /uploads/new` - Upload form
- `POST /uploads` - File upload endpoint
- `GET /uploads` - Upload history
- `GET /uploads/:id` - Upload report
- `GET /uploads/:id/failed.csv` - Failed rows export

### Administration
- `GET /admin/users` - User management (admin only)
- `POST /admin/users/:id/promote` - Promote user to admin

## File Structure

```
├── server.js                    # Main application entry point
├── package.json                 # Backend dependencies and scripts
├── src/
│   ├── db.js                   # Database initialization and queries
│   ├── uploadWorker.js         # Background upload processor
│   └── App.js                  # React health check component
├── views/                      # EJS templates for server-rendered UI
├── public/                     # Static assets (CSS, JS, images)
├── data-categorization-app/    # Create React App frontend
├── frontend-react/             # Vite React frontend
├── infra/                      # AWS CloudFormation templates
├── .github/workflows/          # CI/CD pipelines
├── scripts/                    # Deployment and utility scripts
└── tests/                      # Test suites
```

## Deployment Architectures

### Option 1: Full-Stack Container Deployment
**Best for**: Production workloads with backend API needs

**Components**:
- **Backend**: ECS Fargate or App Runner (containerized Node.js app)
- **Database**: RDS PostgreSQL/MySQL (replace SQLite)
- **File Storage**: S3 (replace local file system)
- **Background Jobs**: SQS + Lambda or ECS tasks
- **Load Balancer**: ALB with HTTPS/ACM certificate

**Pros**: Scalable, managed services, full feature set
**Cons**: Higher cost, more complex setup

### Option 2: Static Frontend + Serverless Backend
**Best for**: Modern SPA experience with cost optimization

**Components**:
- **Frontend**: S3 + CloudFront (Vite React build)
- **Backend API**: Lambda + API Gateway
- **Database**: DynamoDB or RDS Serverless
- **File Processing**: S3 + Lambda triggers
- **Authentication**: Cognito User Pools

**Pros**: Highly scalable, pay-per-use, global CDN
**Cons**: Requires backend refactoring, cold starts

### Option 3: Simplified Static Hosting
**Best for**: Demo/prototype deployment with minimal cost

**Components**:
- **Frontend Only**: S3 + CloudFront static hosting
- **Backend**: Keep running on personal/development server
- **API Calls**: CORS-enabled calls to existing backend

**Pros**: Minimal AWS cost, simple deployment
**Cons**: Backend not in AWS, limited scalability

## Current AWS Deployment Setup

The repository includes ready-to-deploy AWS infrastructure:

### Infrastructure as Code
- `infra/s3-website.yml` - S3 bucket for static website hosting
- `infra/cloudfront-s3.yml` - CloudFront distribution with ACM
- GitHub Actions workflow for automated deployment

### CI/CD Pipeline
- Automated build and deployment on git push
- CloudFormation stack deployment if no S3_BUCKET provided
- Static asset sync to S3 with cache invalidation
- Environment-aware builds with VITE_API_BASE

## Production Considerations

### Security
- [ ] Replace SQLite with managed database (RDS)
- [ ] Use environment variables for secrets
- [ ] Implement HTTPS/TLS everywhere
- [ ] Add rate limiting and input validation
- [ ] Use managed authentication (Cognito) or OAuth

### Scalability
- [ ] Move file uploads to S3 direct upload
- [ ] Replace in-process worker with SQS + Lambda
- [ ] Add caching layer (Redis/ElastiCache)
- [ ] Implement horizontal scaling (multiple instances)

### Monitoring
- [ ] Add application logging (CloudWatch)
- [ ] Implement health checks and monitoring
- [ ] Set up error tracking (Sentry, Rollbar)
- [ ] Create operational dashboards

### Performance
- [ ] Add database indexing strategy
- [ ] Implement connection pooling
- [ ] Use CDN for static assets
- [ ] Add gzip compression

## Cost Estimation (AWS Free Tier)

### Static Frontend Only
- **S3**: ~$0.50/month (assuming 1GB storage, 10k requests)
- **CloudFront**: Free tier covers 50GB transfer, 2M requests
- **Total**: ~$0.50/month

### Full Stack (Minimal)
- **App Runner**: $0.007/vCPU/hour + $0.00025/MB/hour (~$25/month for always-on)
- **RDS**: t3.micro instance (~$15/month)
- **S3**: ~$1/month (including backups)
- **Total**: ~$41/month

### Recommended Next Steps

1. **Immediate**: Deploy static frontend to S3 + CloudFront
2. **Short term**: Containerize backend for App Runner deployment
3. **Medium term**: Replace SQLite with RDS, implement proper secret management
4. **Long term**: Consider serverless refactoring for cost optimization

## Deployment Instructions Available

The repository includes complete deployment automation:
- CloudFormation templates for infrastructure provisioning
- GitHub Actions workflows for CI/CD
- Manual deployment scripts and documentation
- Local development and testing instructions

Ready to proceed with deployment to AWS using any of the above architectures.