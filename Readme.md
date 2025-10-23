# Thesis Management System (TMS)

The Thesis Management System (TMS) is a MERN-stack based web platform designed to streamline thesis supervision and management in academic institutions.  
It supports three roles — **Students, Supervisors, and Administrators** — with features for project management, secure submissions, grading, AI task assistance, and analytics.

---

## Features
- Role-based access (Students, Supervisors, Administrators)
- Project management: creation, assignment, rollover, and second/third marker support
- Secure submissions: with Amazon S3 and upload limits
- Automated grading workflow: with late penalty and multi-marker fairness
- AI-powered assistant: to break down research tasks and explain concepts
- Threaded communication: between students, supervisors, and admins
- Analytics dashboards: for supervisors and administrators
- Scalable MERN architecture: with JWT-based authentication

---

## Installation

The project is organised into two separate folders:
- `backend` → Node.js, Express, MongoDB, AWS S3, OpenAI API
- `frontend` → React.js + Vite, Tailwind CSS

### Prerequisites
Ensure you have installed:
- Node.js (16+)
- npm
- MongoDB (local or cloud)
- AWS account (for S3 integration)
- OpenAI API key (for AI assistant)

---

### Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend

2. Install dependencies
npm install

Copy .env.sample to .env and fill in your environment variables:

MONGO_URI=YOUR_MONGO_URI_HERE
JWT_SECRET=YOUR_JWT_SECRET_HERE

AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID_HERE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY_HERE
AWS_REGION=YOUR_AWS_REGION_HERE
AWS_BUCKET_NAME=YOUR_AWS_BUCKET_NAME_HERE

OPENAI_MODEL=YOUR_OPENAI_MODEL_HERE
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE


Run the backend server:

npm start


By default, the backend runs on http://localhost:3000

### Frontend Setup

1. Navigate to the frontend folder:

cd frontend


2. Install dependencies:

npm install


3. Copy .env.sample to .env and configure the API base URL:

VITE_BASE_URL=http://localhost:3000/api


4. Run the frontend server:

npm run dev


By default, the frontend runs on http://localhost:5173


