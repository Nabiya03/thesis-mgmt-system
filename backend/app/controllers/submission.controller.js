const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const multerS3 = require('multer-s3');
const Submission = require("../models/submission.model");
const Project = require('../models/project.model');
const multiparty = require('multiparty');
const { ApiResponse } = require('../utils/ApiResponse');
const logger = require('../loggers/winston.logger');
const mongoose = require('mongoose');
// Load environment variables
require('dotenv').config();


// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});




const upload = multer({
  storage: multerS3({
    s3: s3Client,
    //acl: 'public-read',
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      console.log('req.body in upload middleware:', req.query);
      const { projectId, studentId } = req.query;
      if (!projectId || !studentId) {
        return cb(new Error('projectId and studentId are required'));
      }
      cb(null, `submissions/${projectId}/${studentId}_${Date.now()}_${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'video/mp4'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDFs and MP4s are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'projectId', maxCount: 1 },
  { name: 'studentId', maxCount: 1 },
  { name: 'teacherId', maxCount: 1 },
]);



// STEP 1: Generate pre-signed upload URL
 async function preSingedUrl (req, res)  {
  try {
    console.log('Request body:', req.body);
    const { fileName, fileType, submissionNumber, studentName, projectId, studentId } = req.body;

    if (!fileName || !fileType || !projectId || !studentId) {
      return res.status(400).json({ error: 'fileName, fileType, projectId, and studentId are required' });
    }
    const name = studentName.replace(/\s+/g, '_');
    const extension = fileName.split('.').pop();
    const friendlyFileName = `COMP-702-${name}-${submissionNumber}.${extension}`;

    const s3Key = `submissions/${projectId}/${studentId}/${friendlyFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 1 minute validity

    res.status(200).json({ uploadUrl, s3Key, fileName: friendlyFileName });
  } catch (err) {
    console.error('Error generating signed URL:', err);
    res.status(500).json({ error: 'Could not generate signed URL' });
  }
}


// STEP 2: Save submission metadata after successful S3 upload

// Accessible to: student only
async function saveData(req, res) {
  try {
    const role = req.user.role; // Assuming req.user is populated by auth middleware

    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can upload submissions.' });
    }
    console.log("req.body in save data..", req.body);
    const { projectId, teacherId, s3Key, fileName } = req.body;
    const studentId = req.user.id;

    if (!projectId || !teacherId || !s3Key) {
      return res.status(400).json({ error: 'projectId, teacherId, and s3Key are required' });
    }

    const newSubmissionEntry = {
      s3Key,
      teacherId,
      fileName,
      grading: []
    };

    // Upsert or update the submission document
    let submissionDoc = await Submission.findOne({ projectId, studentId });

    if (!submissionDoc) {
      submissionDoc = new Submission({
        projectId,
        studentId,
        submissions: [newSubmissionEntry]
      });
    } else {
      if (submissionDoc.submissions.length >= 3) {
        return res.status(400).json({ error: 'Maximum of 3 submissions allowed.' });
      }
      submissionDoc.submissions.push(newSubmissionEntry);
    }

    await submissionDoc.save();

    res.status(201).json({ message: 'Submission saved successfully.', submission: submissionDoc });
  } catch (err) {
    console.error('Error saving submission:', err);
    res.status(500).json({ error: 'Could not save submission' });
  }
}


//re-upload a particular submission
const reuploadSubmission = async (req, res) => {
  try {
   // const { role, id: studentId } = req.user;
   const studentId = req.user.id; // Assuming user ID is the student ID
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can re-upload submissions.' });
    }

    const { projectId, submissionIndex, s3Key, teacherId } = req.body;

    if (!projectId || submissionIndex === undefined || !s3Key || !teacherId) {
      return res.status(400).json({ error: 'projectId, submissionIndex, s3Key, and teacherId are required.' });
    }

    const submissionDoc = await Submission.findOne({ projectId, studentId });

    if (!submissionDoc || !submissionDoc.submissions[submissionIndex]) {
      return res.status(404).json({ error: 'Original submission not found to overwrite.' });
    }

    // // Overwrite the target submission
    // submissionDoc.submissions[submissionIndex] = {
    //   s3Key,
    //   updatedAt: new Date(),
    // };

    submissionDoc.submissions[submissionIndex].s3Key = s3Key;
    submissionDoc.submissions[submissionIndex].updatedAt = new Date();
    
    // Save changes
    await submissionDoc.save();

    res.status(200).json({
      message: 'Submission re-uploaded successfully.',
      submission: submissionDoc.submissions[submissionIndex]
    });
  } catch (err) {
    console.error('Error in re-uploading submission:', err);
    res.status(500).json({ error: 'Failed to re-upload submission.' });
  }
};



// GET /generate-download-url?s3Key=submissions/.../filename.pdf


const generateDownloadUrl = async (req, res) => {
  try {
    const { s3Key, fileName } = req.query;

    if (!s3Key) {
      return res.status(400).json({ error: 's3Key is required' });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 120 }); // valid for 2 min

    res.status(200).json({ downloadUrl: signedUrl });
  } catch (err) {
    console.error('Error generating download URL:', err);
    res.status(500).json({ error: 'Could not generate signed download URL' });
  }
};


//to view a submission
const getSubmissionDetails = async (req, res, next) => {
  try {
    const  {projectId}  = req.body; // or req.body
    console.log("req.body in the get submission details", req.body);
    const { id } = req.params;
 
      const submission = await Submission.findOne({ projectId: projectId });

    if (!submission) {
      return res.status(404).json(new ApiResponse(404, null, 'submission not found.'));
    }
    // if (req.user.role === 'student' && project.assignedStudent && project.assignedStudent._id.toString() !== req.user.id) {
    //   return res.status(403).json(new ApiResponse(403, null, 'Access denied: Project not assigned to this student.'));
    // }
   

   
    res.status(200).json(new ApiResponse(200, submission, 'Submission details retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};



//grading submission



// Grade thresholds
const getGradeFromMarks = (marks) => {
  if (marks >= 90) return 'A*';
  if (marks >= 80) return 'A';
  if (marks >= 70) return 'B';
  if (marks >= 60) return 'C';
  if (marks >= 50) return 'D';
  return 'F';
};

// const gradeSubmission = async (req, res, next) => {
//   try {
//     //const { role, id: supervisorId } = req.user;
//     const supervisorId = req.user.id; // Assuming user ID is the supervisor ID
//     if (req.user.role !== 'supervisor') {
//       return res.status(403).json({ error: 'Only supervisors can grade submissions.' });
//     }

//     const {
//       projectId,
//       studentId,
//       submissionIndex, // 0, 1, or 2
//       marks,
//       justification,
//       formativeFeedback,
//       summativeAssessment
//     } = req.body;

//     if (
//       !projectId || !studentId || submissionIndex === undefined ||
//       marks === undefined || !justification || !summativeAssessment
//     ) {
//       return res.status(400).json({ error: 'Missing required fields.' });
//     }

//     const submissionDoc = await Submission.findOne({ projectId, studentId });
//     if (!submissionDoc || !submissionDoc.submissions[submissionIndex]) {
//       return res.status(404).json({ error: 'Submission not found.' });
//     }

//     const project = await Project.findById(projectId);
//     if (!project) {
//       return res.status(404).json({ error: 'Project not found.' });
//     }

    

//     // Determine supervisor role
//     let supervisorRole = '';
//     if (project.supervisor_first.toString() === supervisorId) supervisorRole = 'supervisor_first';
//     else if (project.supervisor_second?.toString() === supervisorId) supervisorRole = 'supervisor_second';
//     else return res.status(403).json({ error: 'You are not assigned as a supervisor for this project.' });

//     const submission = submissionDoc.submissions[submissionIndex];
//     const deadlineDate = getDeadlineFromIndex(project.deadlines, submissionIndex);
//     const submittedDate = new Date(submission.createdAt);
//     console.log('Deadline Date:', deadlineDate);
//     console.log('Submitted Date:', submittedDate);
//     let lateDays = 0;
//     if (deadlineDate) {
//       const diffTime = submittedDate.getTime() - new Date(deadlineDate).getTime();
//       if (diffTime > 0) {
//         lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//       }
//     }

//     // Apply late penalty
//     let finalMarks = marks - (lateDays * 5);
//     finalMarks = Math.max(finalMarks, 50); // never below 50

//     const grade = getGradeFromMarks(finalMarks);

//     // Check if this supervisor already graded
//     const alreadyGraded = submission.grading.find(g => g.supervisorId.toString() === supervisorId);
//     if (alreadyGraded) {
//       return res.status(400).json({ error: 'You have already graded this submission.' });
//     }

//     // Append grading
//     submission.grading.push({
//       supervisorId,
//       supervisorRole,
//       marks: finalMarks,
//       grade: grade,
//       summativeAssessment,
//       justification,
//       formativeFeedback
//     });

//     // If both gradings present, calculate finalGrade for this submission
//     if (submission.grading.length === 2) {
//       const avgMarks = Math.round(
//         (submission.grading[0].marks + submission.grading[1].marks) / 2
//       );
//       submission.finalGrade = getGradeFromMarks(avgMarks);
//       submission.finalMarks = avgMarks; // Store numeric average
//     }

//     await submissionDoc.save();

//     // res.status(200).json({
//     //   message: 'Grading submitted successfully.',
//     //   finalMarks,
//     //   grade,
//     //   lateDays,
//     //   updatedSubmission: submission
//     // });

//      res.status(200).json(new ApiResponse(200, {
//       finalMarks,
//       grade,
//       lateDays,
//       updatedSubmission: submission
//     }, 
//       'Grading submitted successfully..'));
//   } catch (err) {
//     console.error('Error grading submission:', err);
//     res.status(500).json({ error: 'Failed to grade submission.' });
//   }
// };

// Helper to get correct deadline from project.deadlines object


const gradeSubmission = async (req, res, next) => {
  try {
    const supervisorId = req.user.id;
    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can grade submissions.' });
    }

    const {
      projectId,
      studentId,
      submissionIndex,
      marks,
      justification,
      formativeFeedback,
      summativeAssessment
    } = req.body;

    console.log("data.. in payload", req.body);
    if (
      !projectId || !studentId || submissionIndex === undefined ||
      marks === undefined || !justification || !summativeAssessment
    ) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const submissionDoc = await Submission.findOne({ projectId, studentId });
    if (!submissionDoc || !submissionDoc.submissions[submissionIndex]) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Determine role
    let supervisorRole = '';
    if (project.supervisor_first?.toString() === supervisorId) supervisorRole = 'supervisor_first';
    else if (project.supervisor_second?.toString() === supervisorId) supervisorRole = 'supervisor_second';
    else if (project.third_marker?.toString() === supervisorId) supervisorRole = 'third_marker';
    else return res.status(403).json({ error: 'You are not assigned to this project as a marker.' });

    const submission = submissionDoc.submissions[submissionIndex];
    const deadlineDate = getDeadlineFromIndex(project.deadlines, submissionIndex);
    const submittedDate = new Date(submission.createdAt);

    let lateDays = 0;
    if (deadlineDate) {
      const diffTime = submittedDate.getTime() - new Date(deadlineDate).getTime();
      if (diffTime > 0) {
        lateDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    // Apply penalty
    let finalMarks = marks - (lateDays * 5);
    finalMarks = Math.max(finalMarks, 50);
    const grade = getGradeFromMarks(finalMarks);

    // Prevent duplicate grading
    const alreadyGraded = submission.grading.find(g => g.supervisorId.toString() === supervisorId);
    if (alreadyGraded) {
      return res.status(400).json({ error: 'You have already graded this submission.' });
    }

    // Add grading
    submission.grading.push({
      supervisorId,
      supervisorRole,
      marks: finalMarks,
      grade,
      summativeAssessment,
      justification,
      formativeFeedback
    });

    // 🔹 Handle logic based on role
    if (supervisorRole === 'third_marker') {
      // ✅ Third marker decides final
      submission.finalMarks = finalMarks;
      submission.finalGrade = grade;
      project.thirdMarkerRequired = false; // reset flag
    } 
    else if (!project.supervisor_second) {
      // ✅ Only one supervisor exists
      submission.finalMarks = finalMarks;
      submission.finalGrade = grade;
    } 
    else if (submission.grading.length === 2) {
      // ✅ Both supervisors graded
      const [g1, g2] = submission.grading;
      const diff = Math.abs(g1.marks - g2.marks);

      if (diff > 10) {
        project.thirdMarkerRequired = true;
      } else {
        const avgMarks = Math.round((g1.marks + g2.marks) / 2);
        submission.finalMarks = avgMarks;
        submission.finalGrade = getGradeFromMarks(avgMarks);
      }
    }

    await submissionDoc.save();
    await project.save();

    // ✅ Progress tracking (first supervisor only)
    if (supervisorRole === 'supervisor_first') {
      let progressToAdd = 0;
      if (submissionIndex === 0) progressToAdd = 25;
      else if (submissionIndex === 1) progressToAdd = 45;
      else if (submissionIndex === 2) progressToAdd = 30;

      project.progress = (project.progress || 0) + progressToAdd;
      await project.save();
    }

    res.status(200).json(new ApiResponse(200, {
      finalMarks: submission.finalMarks,
      grade: submission.finalGrade,
      lateDays,
      updatedSubmission: submission
    }, 'Grading submitted successfully.'));

  } catch (err) {
    console.error('Error grading submission:', err.message);
    res.status(500).json({ error: 'Failed to grade submission.' });
  }
};


function getDeadlineFromIndex(deadlinesObj, index) {
  switch (index) {
    case 0: return deadlinesObj.first;
    case 1: return deadlinesObj.second;
    case 2: return deadlinesObj.third;
    default: return null;
  }
}




async function uploadSubmission(req, res) {
    
  try {
    const { projectId, studentId } = req.query;
    const {teacherId } = req.body;
    console.log("proectId:", projectId);
    console.log("studentId:", studentId);
    console.log("teacherId:", teacherId);
    if (!projectId || !studentId || !teacherId) {
      return res.status(400).json({ error: 'projectId, studentId, and teacherId are required' });
    }
    const submission = new Submission({
      projectId,
      studentId,
      teacherId,
      fileUrl: req.files?.file?.[0]?.location,
    });
    await submission.save();
    res.status(201).json({ message: 'Submission uploaded', submission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error uploading submission' });
  }
}

// List submissions for a project
async function listSubmissions(req, res) {
  try {
    const submissions = await Submission.find({ projectId: req.params.projectId })
      .populate('studentId', 'name email')
      .populate('teacherId', 'name email');
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving submissions' });
  }
}

// Download a submission file (using pre-signed URL)
async function downloadSubmission(req, res) {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    const key = submission.fileUrl.split('/').slice(-2).join('/');
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ downloadUrl: url });
  } catch (error) {
    res.status(500).json({ error: 'Error generating download URL' });
  }
}

// Update grade and feedback
async function updateSubmission(req, res) {
  try {
    const { grade, feedback } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { grade, feedback, updatedAt: Date.now() },
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json({ message: 'Submission updated', submission });
  } catch (error) {
    res.status(500).json({ error: 'Error updating submission' });
  }
}

// Delete a submission
async function deleteSubmission(req, res) {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    const key = submission.fileUrl.split('/').slice(-2).join('/');
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }));
    await Submission.deleteOne({ _id: req.params.id });
    res.json({ message: 'Submission deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting submission' });
  }
}

//submissions for supervisor dashboard
async function supervisorSubmissions (req, res, next)  {
  try {
    if (req.user.role !== 'supervisor') {
      return res.status(403).json(new ApiResponse(403, null, 'Not Authorised.'));
    }

    const supervisorId = new mongoose.Types.ObjectId(req.user.id);

    // Step 1: Get project IDs for this supervisor
    const projects = await Project.find({
      $or: [
        { supervisor_first: supervisorId },
        { supervisor_second: supervisorId },
        { third_marker: supervisorId }
      ]
    }).select('_id title');

    if (!projects.length) {
      return res.status(200).json(new ApiResponse(200, { submissions: [] }, "No projects found for supervisor."));
    }

    const projectMap = projects.reduce((map, proj) => {
      map[proj._id.toString()] = proj.title;
      return map;
    }, {});

    const projectIds = projects.map(p => p._id);

    // Step 2: Get submissions for those projects (limit recent)
    const submissions = await Submission.find({ projectId: { $in: projectIds } })
      .populate('studentId', 'name') // Get student name
      .lean();

    let allSubmissions = [];

    submissions.forEach(subDoc => {
      subDoc.submissions.forEach((sub, index) => {
        const alreadyGraded = sub.grading?.some(
          g => g.supervisorId.toString() === supervisorId.toString()
        );

        allSubmissions.push({
          studentName: subDoc.studentId?.name || "Unknown",
          projectTitle: projectMap[subDoc.projectId.toString()],
          submissionIndex: index,
          createdAt: sub.createdAt,
          status: alreadyGraded ? "graded" : "pending"
        });
      });
    });

    // Step 3: Sort by createdAt (descending) & limit to 3
    allSubmissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const recentThree = allSubmissions.slice(0, 3);

    return res.status(200).json(
      new ApiResponse(
        200,
        { submissions: recentThree },
        'Supervisor submissions retrieved successfully.'
      )
    );

  } catch (error) {
    next(error);
  }
};


module.exports = {
 
  upload,
  preSingedUrl,
  saveData,
  generateDownloadUrl,
  gradeSubmission,
  uploadSubmission,
  listSubmissions,
  downloadSubmission,
  updateSubmission,
  deleteSubmission,
  getSubmissionDetails,
  supervisorSubmissions
};