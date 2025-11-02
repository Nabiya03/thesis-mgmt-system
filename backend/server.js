require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const { errorHandler } = require('./app/middlewares/error.middleware');

const logger = require('./app/loggers/winston.logger');



// Connect MongoDB
connectDB()

//app setup
const app = express();

app.use(cors({
  origin: "http://localhost:5173", // your frontend URL
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // include PATCH
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware to parse JSON bodies
app.use(express.json());



// Middleware to parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));



// Main routes
app.use(require('./app/routes'));

// handle error
app.use(errorHandler)


const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // This allows external access

app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));

