# Social Media Project

A full-stack social media application with a Django backend and React frontend.

# The video briefly describing the project and showing off the features:
https://www.loom.com/share/479c5c3340014b31863c7077fb17bbe7?sid=23560933-faa5-4aa2-a26a-3b3b37521cf3

## Project Structure

- **Frontend**: React + TypeScript application
- **Backend**: Django REST API

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Run migrations:
   ```
   python manage.py migrate
   ```

6. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

7. Start the server:
   ```
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Features

- User authentication and profile management
- Social media post creation and interaction
- Responsive design

## Technologies Used

### Backend
- Django
- Django REST Framework
- SQLite (development)

### Frontend
- React
- TypeScript
- Vite

## Accessing the Admin Interface

The Django admin interface is available at:
```
http://127.0.0.1:8000/admin/
```

Log in with the superuser credentials created during setup. 
