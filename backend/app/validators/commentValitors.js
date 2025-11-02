
const { body } = require("express-validator");

exports.commentValidation = [
  body("message")
    .isLength({ min: 1, max: 1000 }).withMessage("Message must be 1–1000 characters")
    .trim()
    .escape(), // 
];
