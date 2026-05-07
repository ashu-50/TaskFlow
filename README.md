# TaskFlow – Team Task Manager

TaskFlow is a full-stack collaborative task management web application built using React, Node.js, Express, MySQL, and Sequelize.

The application allows teams to create projects, manage members, assign tasks, track deadlines, and monitor project progress similar to Trello or Asana.

---

# Live Demo

Frontend:
https://ingenious-flow-production-ef5c.up.railway.app

Backend API:
https://industrious-courtesy-production-80ef.up.railway.app/api

---

# Features

## Authentication
- User Signup & Login
- JWT Authentication
- Secure password hashing
- Protected routes

## Project Management
- Create projects
- Project creator becomes project admin
- Add/remove project members
- View project details

## Task Management
- Create tasks
- Assign tasks to members
- Task priorities:
  - Low
  - Medium
  - High
- Task statuses:
  - To Do
  - In Progress
  - Review
  - Done

## Dashboard
- Total tasks
- Tasks by status
- Overdue tasks
- Tasks per user
- Recent activity

## Role-Based Access
### Project Admin
- Add/remove members
- Create/manage tasks
- Manage project

### Member
- View assigned projects
- Update assigned tasks

---

# Tech Stack

## Frontend
- React.js
- React Router
- Axios
- CSS

## Backend
- Node.js
- Express.js
- Sequelize ORM

## Database
- MySQL

## Deployment
- Railway

---

# Folder Structure

backend/
├── config/
├── middleware/
├── models/
├── routes/
├── server.js

frontend/
├── src/
│ ├── api/
│ ├── components/
│ ├── context/
│ ├── pages/
│ ├── styles/
│ └── App.jsx

---

# Environment Variables

## Backend (.env)

```env
PORT=5000

DB_HOST=your_mysql_host
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
