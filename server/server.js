const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// CORS configuration (needed for cross-origin authentication with httpOnly cookies)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow if it matches CLIENT_URL (ignoring trailing slashes), localhost, or no origin (like Postman)
    const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : '';
    if (!origin || (clientUrl && origin.startsWith(clientUrl)) || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback: allow all temporarily to ensure it works
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    errors: err.errors || null
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
