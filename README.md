# Church Quiz Competition Platform

A modern, responsive Church Quiz Competition website with an Admin Panel for quiz management and a user-friendly Participant interface. Built with the MERN stack (MongoDB, Express, React, Node.js).

## Features
- **Admin Dashboard**: Create, edit, publish/unpublish quizzes.
- **Auto & Manual Grading**: Automatically grades MCQs, Checkboxes, Matching, and allows manual grading for short answers.
- **Participant Gateway**: Password-protected site access.
- **Live Timer**: Configurable time limits for quizzes.

## Local Development

1. **Clone the repository**
2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Make sure you have MongoDB running locally or provide a MongoDB Atlas URI in .env
   npm run dev
   ```
3. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Deployment to Vercel

This repository is structured as a monorepo containing both the frontend and backend, but they should be deployed as **two separate projects** in Vercel.

### 1. Deploying the Backend (Vercel Serverless)
1. Push this repository to GitHub.
2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New -> Project**.
3. Import this GitHub repository.
4. **Important**: In the configuration screen, change the **Root Directory** to `backend`.
5. Open the **Environment Variables** section and add:
   - `MONGODB_URI` (Your MongoDB Atlas connection string)
   - `JWT_SECRET` (A strong random string for admin auth)
   - `SITE_PASSWORD` (e.g. `churchquiz2026`)
6. Click **Deploy**. Vercel will use the `vercel.json` file to deploy your Express app as a Serverless function.
7. Note down the deployed URL (e.g., `https://church-quiz-backend.vercel.app`).

### 2. Deploying the Frontend (Vite)
1. Go back to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New -> Project** again.
2. Import the exact same GitHub repository.
3. This time, change the **Root Directory** to `frontend`.
4. Ensure the Framework Preset is set to **Vite**.
5. Open the **Environment Variables** section and add:
   - `VITE_API_URL` -> Set this to the backend URL you generated in step 1 (e.g., `https://church-quiz-backend.vercel.app`).
6. Click **Deploy**.

Your application is now fully live!
