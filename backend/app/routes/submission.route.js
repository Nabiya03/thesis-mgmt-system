const express = require('express');
const submissionRouter = express.Router();
const {
    upload, 
    uploadSubmission, 
    preSingedUrl, 
    saveData, 
    generateDownloadUrl, 
    gradeSubmission, 
    getSubmissionDetails, 
    supervisorSubmissions
} = require('../controllers/submission.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const validate = require("../middlewares/validate");
const { uploadUrlValidation, saveSubmissionValidation } = require("../validators/submissionValidator");


//defin e the route for uploading a submission
submissionRouter.post('/upload-submission', upload ,uploadSubmission);

submissionRouter.post(
  "/generate-upload-url",
  preSingedUrl
);

submissionRouter.post(
  "/save-data",
  authMiddleware,
  saveData
);
submissionRouter.get('/generate-download-url', generateDownloadUrl); // For generating download URL

//to view submission
submissionRouter.post('/detail', authMiddleware, getSubmissionDetails);

//teacher grading submission
submissionRouter.post('/grade-submission', authMiddleware, gradeSubmission); // For grading a submission
//submissions for supervisor dashboard
submissionRouter.get('/supervisor/submissions', authMiddleware, supervisorSubmissions);
module.exports = submissionRouter;