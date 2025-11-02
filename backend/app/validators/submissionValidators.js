const { body } = require("express-validator");

exports.uploadUrlValidation = [
  body("fileName")
    .matches(/^[a-zA-Z0-9_\-]+\.(pdf|docx|zip)$/)
    .withMessage("Invalid file name or extension")
    .trim(),
  body("fileType")
    .isIn([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
    ])
    .withMessage("Invalid file type"),
];

exports.saveSubmissionValidation = [
  body("projectId").isMongoId().withMessage("Invalid project ID"),
  body("submissionNumber")
    .isInt({ min: 1, max: 3 }).withMessage("Submission number must be between 1 and 3"),
  body("s3Key").isString().trim().escape(),
];
