const express = require('express');
const authRouter = express.Router();
const validate = require("../middlewares/validate");
const { loginValidation } = require("../validators/authValidators");
const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');


// Define routes
authRouter.post("/login", AuthController.login);
authRouter.post('/logout', authMiddleware, AuthController.logout);

module.exports = authRouter;