# CivicDesk - Complaint & Feedback Management System

A complete, production-ready complaint management system built with Node.js, Express.js, MongoDB Atlas, and vanilla JavaScript frontend.

## Features

- **User Authentication**: JWT-based auth with role-based access (user/admin)
- **Complaint Management**: Users can submit, view, and track complaints
- **Department System**: Organize complaints by departments
- **Response System**: Admins can respond to complaints with automatic status updates
- **Real-time Status Tracking**: Visual status badges (pending, in_progress, resolved)
- **Dark Mode UI**: Modern dark theme with Tailwind CSS
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB Atlas, Mongoose
- **Authentication**: JWT, bcryptjs
- **Frontend**: Vanilla JavaScript, Tailwind CSS (CDN)
- **Security**: CORS, password hashing, protected routes

## Project Structure

```
complaint-management/
├── backend/
│   ├── models/          # User, Complaint, Department, Response models
│   ├── routes/          # Auth, Complaint, Department, Response routes
│   ├── middleware/      # authMiddleware, adminMiddleware
│   ├── .env            # Environment variables
│   ├── server.js       # Main server file with seed data
│   └── package.json
└── frontend/
    ├── index.html      # Landing page
    ├── login.html      # Login/Register page
    ├── dashboard.html  # User dashboard
    └── admin.html      # Admin dashboard
```

## Setup Instructions

### 1. Configure MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Click "Connect" and choose "Connect your application"
4. Copy the connection string
5. Replace `<username>`, `<password>`, and update the database name in the connection string

### 2. Configure Environment Variables

Edit `backend/.env`:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/complaint-management?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-key-here
PORT=5000
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Start the Server

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

### 5. Access the Application

Open your browser and go to:
- Landing Page: `http://localhost:5000`
- Login: `http://localhost:5000/login.html`

## Default Test Accounts

The system automatically seeds these accounts on first run:

| Role  | Email            | Password  |
|-------|------------------|-----------|
| Admin | admin@test.com   | Admin123  |
| User  | user@test.com    | User123   |

## API Endpoints

### Auth Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Complaint Routes (Protected)
- `POST /api/complaints` - Create complaint
- `GET /api/complaints` - Get all complaints (user: own, admin: all)
- `GET /api/complaints/:id` - Get single complaint
- `PATCH /api/complaints/:id/status` - Update status (admin only)

### Department Routes
- `GET /api/departments` - Get all departments (public)
- `POST /api/departments` - Create department (admin only)

### Response Routes (Protected)
- `POST /api/responses` - Add response (admin only)
- `GET /api/responses/:complaintId` - Get responses for complaint

## User Guide

### For Regular Users

1. **Register/Login**: Create an account or use the test user credentials
2. **Dashboard**: View your complaint statistics and list
3. **Submit Complaint**: Click "New Complaint" button, fill in title, select department, and describe your issue
4. **Track Status**: View your complaints and their current status
5. **View Responses**: Expand a complaint to see admin responses

### For Admins

1. **Login**: Use admin credentials
2. **Admin Panel**: View all complaints with filtering options
3. **Manage Complaints**:
   - Change status via dropdown
   - Click "Respond" to add a response
   - Filter by status or department
4. **Manage Departments**: Add new departments from the Department Management section

## Security Features

- Passwords hashed with bcrypt
- JWT token authentication
- Protected routes with middleware
- Role-based access control
- Input validation
- CORS enabled

## Default Departments

On first run, the system creates:
- Technical Support
- Billing & Payments
- General Enquiry

## Development

To modify the system:

1. **Models**: Edit files in `backend/models/` to change data structure
2. **Routes**: Edit files in `backend/routes/` to modify API behavior
3. **Frontend**: Edit HTML files in `frontend/` to change UI

## Troubleshooting

### MongoDB Connection Error
- Check your MongoDB Atlas connection string
- Ensure your IP is whitelisted in Atlas Network Access
- Verify username and password are correct

### Port Already in Use
- Change the PORT in `.env` file
- Or kill the process using port 5000: `npx kill-port 5000`

### CORS Errors
- Ensure backend server is running
- Check that `cors()` middleware is enabled in server.js

## License

This is a college project built for educational purposes.

## Author

Built with ❤️ using Node.js, Express, and MongoDB
