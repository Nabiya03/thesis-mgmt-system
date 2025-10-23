
import React, { useState, useEffect } from "react";
import { Upload, FileText, Star, Calendar, Download, CheckCircle, X } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { getProjectDetails, saveSubmissionMetadata, generateUploadUrl, getSubmissionDetails, generateDownloadUrl } from "../../api/userService";
import axios from "axios";
import {useAuth} from '../../contexts/AuthContext';

// Dialog Component
const Dialog = ({ message, type = 'success', onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            {type === 'success' ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <X className="h-8 w-8 text-red-600" />
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-lg font-medium ${
              type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {type === 'success' ? 'Success!' : 'Error!'}
            </h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700">{message}</p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              type === 'success' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

function SubmissionsTab() {
  const [myProject, setMyProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [dialog, setDialog] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchProjectAndSubmissions();
  }, []);

  const showDialog = (message, type = 'success') => {
    setDialog({ message, type });
  };

  const hideDialog = () => {
    setDialog(null);
  };

const fetchProjectAndSubmissions = async () => {
 try {
   setLoading(true);
   
   // Fetch project details
   const projectResponse = await getProjectDetails();
   console.log("response for project in student submissionn page", projectResponse);
   const project = projectResponse.data.data;
   console.log("project data called for student in submissoin page", project);
   setMyProject(project);

   // Fetch submission details
   let submissionData = null;
   try {
     console.log("callling submission data for project..",  projectResponse.data.data?._id);
     const submissionResponse = await getSubmissionDetails({
         projectId:  projectResponse.data.data?._id
     });
     submissionData = submissionResponse.data.data;
   } catch (err) {
     console.log("error..", error);
     console.log("No submissions found yet, starting fresh");
   }

   // Create base submissions structure
   const deadlines = project?.deadlines || {};
   const baseSubmissions = [
     {
       id: 1,
       title: "Draft Proposal",
       type: "Proposal",
       deadline: deadlines.first || null,
       status: "pending",
       submittedDate: null,
       fileName: null,
       fileSize: null,
       grade: null,
       feedback: null,
       s3Key: null,
       details: null,
     },
     {
       id: 2,
       title: "Presentation", 
       type: "Presentation",
       deadline: deadlines.second || null,
       status: "upcoming",
       submittedDate: null,
       fileName: null,
       fileSize: null,
       grade: null,
       feedback: null,
       s3Key: null,
       details: null,
     },
     {
       id: 3,
       title: "Thesis",
       type: "Thesis", 
       deadline: deadlines.third || null,
       status: "upcoming",
       submittedDate: null,
       fileName: null,
       fileSize: null,
       grade: null,
       feedback: null,
       s3Key: null,
       details: null,
     },
   ];

   // Merge with actual submission data if exists
   if (submissionData && submissionData.submissions) {
     submissionData.submissions.forEach((apiSubmission, index) => {
       if (index < baseSubmissions.length) {
         // Calculate file size from API if available
         const fileSizeMB = "N/A"; // You might need to store this in API or calculate
         
         // Check grading completion based on project requirements
         let isGradingComplete = false;
         let gradingDetails = null;
         
         if (apiSubmission.grading && apiSubmission.grading.length > 0) {
           // If no supervisor_second, only need 1 grading
           if (!project.supervisor_second) {
             isGradingComplete = apiSubmission.grading.length >= 1;
           } 
           // If supervisor_second exists but no third marker required, need 2 gradings
           else if (project.supervisor_second && !project.thirdMarkerRequired) {
             isGradingComplete = apiSubmission.grading.length >= 2;
           }
           // If third marker required, need 3 gradings
           else if (project.supervisor_second && project.thirdMarkerRequired) {
             isGradingComplete = apiSubmission.grading.length >= 3;
           }
           
           gradingDetails = isGradingComplete ? 'Yes' : 'Partial';
         }
         
         baseSubmissions[index] = {
           ...baseSubmissions[index],
           _id: apiSubmission._id,
           submittedDate: apiSubmission.createdAt,
           fileName: apiSubmission.fileName,
           fileSize: fileSizeMB,
           status: "submitted", // or "graded" if grading is complete
           s3Key: apiSubmission.s3Key,
           // Check if graded
           grade: isGradingComplete ? apiSubmission.finalGrade : null,
           feedback: apiSubmission.grading && apiSubmission.grading.length > 0 
             ? apiSubmission.grading[0].feedback 
             : null,
           details: gradingDetails,
         };

         // Update status based on grading completion
         if (isGradingComplete) {
           baseSubmissions[index].status = "graded";
         }
       }
     });

     // Update status for next pending submission
     const submittedCount = submissionData.submissions.length;
     if (submittedCount < baseSubmissions.length) {
       baseSubmissions[submittedCount].status = "pending";
       
       // Set remaining as upcoming
       for (let i = submittedCount + 1; i < baseSubmissions.length; i++) {
         baseSubmissions[i].status = "upcoming";
       }
     }
   }

   setSubmissions(baseSubmissions);
 } catch (err) {
   setError(err.message || "Failed to fetch project and submissions");
 } finally {
   setLoading(false);
 }
};

  const getStatusColor = (status) => {
    switch (status) {
      case "graded":
        return "bg-green-100 text-green-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "upcoming":
        return "bg-gray-100 text-gray-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGradeColor = (grade) => {
    if (grade?.includes("A")) return "text-green-600";
    if (grade?.includes("B")) return "text-blue-600";
    if (grade?.includes("C")) return "text-amber-600";
    return "text-gray-600";
  };

  const handleFileUpload = async (submissionId, file) => {
    if (!file) return;

    try {
      // Step 1: Get signed URL from backend
      const { data } = await generateUploadUrl({
        fileName: file.name,
        submissionNumber: submissionId,
        studentName: user.name,
        fileType: file.type,
        studentId: myProject.assignedStudent._id,
        projectId: myProject._id,
      });

      const { uploadUrl, s3Key, fileName } = data;

      // Step 2: Upload file directly to S3
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type },
      });

      const payload = {
        projectId: myProject._id,
        teacherId: myProject.supervisor_first._id,
        fileName: fileName,
        s3Key,
      };

      
      // Step 3: Save submission metadata in DB
      await saveSubmissionMetadata(payload);

      // Step 4: Refresh the data from API instead of manual update
      await fetchProjectAndSubmissions();

      // Show success dialog instead of alert
      showDialog("File uploaded successfully!");
    } catch (err) {
      console.error("Upload failed:", err);
      // Show error dialog instead of alert
      showDialog("Upload failed. Please try again.", 'error');
    }
  };

  const handleDownload = async (submission) => {
  if (!submission?.s3Key || !submission?.fileName) {
    showDialog("File information missing.", 'error');
    return;
  }

  try {
    // Step 1: Ask backend for signed download URL
   const { data } = await generateDownloadUrl(
      submission.s3Key,
      submission.fileName
    );
    const { downloadUrl } = data;

    // Step 2: Trigger download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", submission.fileName); // fallback for browsers
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("Download failed:", err);
    showDialog("Download failed. Please try again.", 'error');
  }
};

  const getFirstPendingId = () => {
    const pending = submissions.find((sub) => sub.status === "pending");
    return pending ? pending.id : null;
  };

  const firstPendingId = getFirstPendingId();

  if (loading) return <p>Loading submissions...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <>
      {/* Dialog Notification */}
      {dialog && (
        <Dialog 
          message={dialog.message} 
          type={dialog.type} 
          onClose={hideDialog} 
        />
      )}
      
      <div className="space-y-6">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {submission.title}
                </h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {submission.type}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Due:{" "}
                      {submission.deadline
                        ? new Date(submission.deadline).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    submission.status
                  )}`}
                >
                  {submission.status}
                </span>
                {submission.grade && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span
                      className={`font-medium ${getGradeColor(
                        submission.grade
                      )}`}
                    >
                      {submission.grade}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded file display */}
            {submission.submittedDate && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {submission.fileName}
                    </span>
                    {submission.fileSize && (
                      <span className="text-xs text-gray-500">
                        ({submission.fileSize})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      Submitted:{" "}
                      {new Date(submission.submittedDate).toLocaleDateString()}
                    </span>
                    <button
                              className="p-1 text-gray-400 hover:text-gray-600"
                              onClick={() => {
                                  if (window.confirm("Do you want to download this file?")) {
                                  handleDownload(submission);
                                  }
                              }}
                              >
                              <Download className="h-4 w-4" />
                              </button>
                               {submission.details==='Yes' && (
      <Link
        className="ml-2 px-3 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700"
         to={`/student/submission/${myProject._id}/${submission._id}/grading`}

      >
        View Grading
      </Link>
    )}
                  </div>
                </div>
                
                {/* Show feedback if graded */}
                {submission.feedback && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-200">
                    <p className="text-xs font-medium text-blue-800 mb-1">Teacher Feedback:</p>
                    <p className="text-sm text-blue-700">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Upload section - only first pending */}
            {submission.id === firstPendingId && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                    Upload File
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleFileUpload(submission.id, e.target.files[0])
                      }
                    />
                  </label>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Drag and drop your file here, or click to browse
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default SubmissionsTab;