const AuthService = require('../services/auth.service');
const { ApiResponse } = require('../utils/ApiResponse');



/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */


class AuthController {
    static async login(req, res, next){
        try{
            console.log("Login request body:", req.body);
            const {email, password} = req.body;
            if(!email || !password){
                return res.status(400).json(
                    new ApiResponse(400, null, "Email and Password are required.")
                );
            }
           const result = await AuthService.login(email, password);

            return res
            .status(201).json(new ApiResponse(201, result, "User logged in successfully."));
        } catch(error){
            next(error);
        }
    }
    static async logout(req, res, next){
        try{
            const result = await AuthService.logout(req.user);
            return res
            .status(200).json(new ApiResponse(200, result, "User logged out successfully."));
        } catch(error){
            next(error);
        }
    }
}

module.exports = AuthController;