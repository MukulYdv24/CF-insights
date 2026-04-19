# CF-Insights

A full-stack Competitive Programming Dashboard built with FastAPI and React.

## Features
- Search any Codeforces handle
- View rating history as a line chart
- Problem tag distribution radar chart
- Problems solved by difficulty rating
- Verdict distribution breakdown

## Tech Stack
- **Backend:** FastAPI, Python, httpx, uvicorn
- **Frontend:** React, Vite, Tailwind CSS, Recharts, lucide-react

## How to Run Locally

### Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

### Frontend
cd frontend
npm install
npm run dev
