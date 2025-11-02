const logger = require('../loggers/winston.logger');
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { User } = require("../models")();

class AuthService {
    static async login(email, password) {
        try {
            if (!email || !password) {
                throw new ApiError(
                    400,
                    "Email and Password are required."
                );
            }
            const user = await User.findOne({ email });
            console.log('Found user:', user); // Debug log
            if (!user) {
                throw new ApiError(
                    409,
                    "This email does not exist."
                );
            }

            const isMatch = await bcrypt.compare(password, user.password);
            console.log('Password match:', isMatch); // Debug log
            if (!isMatch) {
                throw new ApiError(
                    409,
                    "Invalid Password."
                );
            }

            const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

            return { token, user, role: user.role };
        } catch (error) {
            logger.error(`Could not login, ${error.message}`);
            throw new ApiError(409, "Login Failed.");
        }
    }

    static async logout(user) {
        try {
            return { success: true, message: 'Logout successful' };
        } catch (error) {
            logger.error(`Could not logout, ${error.message}`);
            throw new ApiError(409, "Logout Failed.");
        }
    }
}

module.exports = AuthService;