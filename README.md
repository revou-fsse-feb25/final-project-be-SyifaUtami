# Imajine University LMS - Backend API

A comprehensive Learning Management System backend built with NestJS, TypeScript, and PostgreSQL. This API provides robust endpoints for student and coordinator management, academic progress tracking, assignments, and analytics.

## Live Deployment

- **API URL**: [https://imajine-uni-api-production.up.railway.app](https://imajine-uni-api-production.up.railway.app)
- **Database**: PostgreSQL hosted on Railway
- **Frontend**: [https://imajine-uni-frontend.vercel.app](https://imajine-uni-frontend.vercel.app)

## Info

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Validation**: class-validator and class-transformer
- **Security**: bcrypt for password hashing
- **Testing**: Jest with e2e testing support
- **Deployment**: Railway with automatic deployments
- **API Documentation**: RESTful endpoints with comprehensive error handling

## Data Overview

### **Structure**
```
src/
├── auth/                    # Authentication & authorization
├── users/                   # User management (students & coordinators)
├── students/                # Student-specific operations
├── teachers/                # Teacher management (reference data)
├── courses/                 # Course management
├── units/                   # Unit management within courses
├── assignments/             # Assignment management
├── submissions/             # Assignment submissions
├── student-progress/        # Weekly progress tracking
├── analytics/               # Performance metrics & insights
├── academic-data/           # Combined academic data endpoints
└── prisma/                  # Database service & configuration
```

### **Database Schema**

<img width="2414" height="1618" alt="supabase-schema-hoqevasoqryeqnjvdnjg" src="https://github.com/user-attachments/assets/0ed0ce3b-3693-4754-bc0d-fb4c6e18e47a" />

```



Users (Students & Coordinators)
├── Authentication (JWT tokens)
├── Role-based access control
└── Profile management

Teachers (Reference data only)
├── Faculty information
├── Unit assignments
└── Contact details

Academic Structure
├── Courses (BM, BA)
├── Units (4 weeks each)
├── Assignments (OPEN/CLOSED status)
└── Submissions (graded/ungraded)

Progress Tracking
├── Weekly material completion
├── Assignment submission status
├── Grade management
└── Analytics & reporting
```

### Authentication & Security

### **JWT Authentication System**
- **Access Token**: 30 minutes (for API requests)
- **Refresh Token**: 7 days (for token renewal)
- **Password Security**: bcrypt with configurable salt rounds
- **Role-based Access**: Student and Coordinator roles

### **Security Features**
- Password hashing with bcrypt
- JWT token validation on protected routes
- Role-based route protection
- Input validation and sanitization
- Environment variable protection
- CORS configuration for frontend integration

### **Test Credentials**
```bash
# Coordinator Access
Email: coordinator@imajine.ac.id
Password: coordinator123
UserType: coordinator

# Student Access  
Email: TomHolland@imajine.ac.id
Password: student123
UserType: student
```

## API Documentation

### **Authentication Endpoints**
```bash
POST /auth/login              # User login
POST /auth/refresh            # Refresh JWT token
POST /auth/logout             # User logout
GET  /auth/profile            # Get current user profile
```

### **User Management**
```bash
GET  /users/me                # Get current user data
PUT  /users/profile           # Update user profile
```

### **Student Management (Coordinator Only)**
```bash
GET  /students                # List all students with pagination
GET  /students/with-grades    # Students with academic performance
GET  /students/stats          # Student statistics
GET  /students/:id            # Individual student details
GET  /students/:id/units      # Student's enrolled units with progress
```

### **Teacher Management**

<img width="2278" height="404" alt="image" src="https://github.com/user-attachments/assets/3b6665fd-f56d-4e21-a145-ea4921445d36" />

```bash
GET  /teachers                # List all teachers
GET  /teachers/stats          # Teacher statistics
POST /teachers                # Create new teacher (Coordinator)
DELETE /teachers/:id          # Delete teacher (Coordinator)
```

### **Course & Unit Management**
<img width="1766" height="672" alt="image" src="https://github.com/user-attachments/assets/d3a06686-c4a2-4be1-b219-c184f498f4c8" />

```bash
GET  /courses                 # List all courses
GET  /courses/:code           # Specific course details

GET  /units                   # List units with pagination
GET  /units/stats             # Unit statistics
GET  /units/course/:code      # Units by course
GET  /units/:code             # Specific unit details
GET  /units/:code/progress    # Unit with student progress
POST /units                   # Create unit (Coordinator)
PUT  /units/:code             # Update unit (Coordinator)
DELETE /units/:code           # Delete unit (Coordinator)
```

### **Assignment & Submission Management**

<img width="1288" height="638" alt="image" src="https://github.com/user-attachments/assets/8b5a36a3-58f0-4452-a768-f9f201f32115" />
<img width="1728" height="1088" alt="image" src="https://github.com/user-attachments/assets/9327b393-b1a1-4039-b09e-8a972e64cf89" />


```bash
GET  /assignments             # List assignments with filters
GET  /assignments/:id         # Assignment details

GET  /submissions/:id         # Submission details
GET  /submissions/student/:id # Student's submissions
PUT  /submissions/:id         # Update submission
PUT  /submissions/:id/grade   # Grade submission (Coordinator)
```

### **Progress Tracking**

![Uploading image.png…]()

```bash
GET  /student-progress/student/:studentId                    # All progress for student
GET  /student-progress/student/:studentId/unit/:unitCode    # Specific unit progress
GET  /student-progress/unit/:unitCode                       # All students in unit
GET  /student-progress/student/:studentId/unit/:unitCode/percentage # Progress percentage
POST /student-progress                                       # Create progress record
PUT  /student-progress/student/:studentId/unit/:unitCode    # Update progress
POST /student-progress/unit/:unitCode/initialize            # Initialize all students (Coordinator)
```

### **Analytics & Reporting (Coordinator Only)**

Calculation of existing data for report to minimize load on frontend
```bash
GET  /analytics/overview             # Dashboard metrics
GET  /analytics/course/:courseCode   # Course-specific metrics
GET  /analytics/unit/:unitCode       # Unit-specific metrics
GET  /analytics/student/:studentId   # Student analytics
GET  /analytics/trends               # Trending data over time
```

### **Academic Data**
Combined general academic data of a particular course
```bash
GET  /academic-data           # Combined academic data (courses, units, teachers)
```

## Database Models

```typescript
// User Model (Students & Coordinators)
interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'COORDINATOR';
  courseCode?: string;        // For students
  year?: number;              // For students
  title?: string;             // For coordinators
  accessLevel?: string;       // For coordinators
  courseManaged?: string[];   // For coordinators
}

// Teacher Model (Reference data)
interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: string;
  specialization: string;
}

// Course Model
interface Course {
  id: string;
  code: string;              // "BM", "BA"
  name: string;              // "Business Management"
}

// Unit Model
interface Unit {
  id: string;
  code: string;              // "BM001", "BM002"
  name: string;
  description: string;
  courseCode: string;
  currentWeek: number;       // 1-4
  totalWeeks: number;        // Default: 12
}

// Assignment Model
interface Assignment {
  id: string;
  name: string;
  unitCode: string;
  deadline: Date;
  publishedAt: Date;
  status: 'OPEN' | 'CLOSED';
}

// Student Progress Model
interface StudentProgress {
  id: string;
  studentId: string;
  unitCode: string;
  week1Material: 'DONE' | 'NOT_DONE';
  week2Material: 'DONE' | 'NOT_DONE';
  week3Material: 'DONE' | 'NOT_DONE';
  week4Material: 'DONE' | 'NOT_DONE';
  updatedBy: string;
}
```

### **Installation guide**
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn
- Git

### **Local Development Setup**

1. Clone the repository

2. Install dependencies
```bash
npm install
```

3. Environment configuration
```bash
cp .env.example .env

# Configure your .env file:
DATABASE_URL="postgresql://username:[password]@localhost:5432/lms_database"
JWT_SECRET= [add]
JWT_REFRESH_SECRET=[add]
NODE_ENV=development
PORT=3000
```

4. **Database setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database with sample data
npx prisma db seed
```

5. **Start the development server**
```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod
```

The API will be available at `http://localhost:3000`


### **More information about installation**
The application uses Prisma ORM with PostgreSQL:
- **Migrations**: Located in `prisma/migrations/`
- **Schema**: Defined in `prisma/schema.prisma`
- **Seeding**: Sample data in `prisma/seed.ts`

## Testing

### **Available Test Commands**
```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### **API Testing Script**
```bash
# Test all API endpoints
node test/test-api.js

# Test database connection
node test/test-database.js
```

### **Manual API Testing**
```bash
# Login and get token
curl -X POST https://imajine-uni-api-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coordinator@imajine.ac.id",
    "password": "coordinator123",
    "userType": "coordinator"
  }'

# Use token for authenticated requests
curl -X GET https://imajine-uni-api-production.up.railway.app/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Deployment

### **Railway Deployment (Current)**
The application is deployed on Railway with automatic deployments:

1. **Connected Repository**: GitHub integration
2. **Environment Variables**: Set in Railway dashboard
3. **Database**: PostgreSQL addon
4. **Domain**: `imajine-uni-api-production.up.railway.app`
