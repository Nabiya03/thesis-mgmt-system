
import React, { useState, useEffect } from 'react';
import { Download, Calendar, Star, FileText, CheckCircle, Eye, Edit, AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generateDownloadUrl, getSubmissionDetails } from '../../api/userService';

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

function SubmissionsList({ submissions, onGradeSubmission, onRefreshData, projectId, currentUserId }) {
  const [feedback, setFeedback] = useState('');
  const [grade, setGrade] = useState('');
  const [submissionDetails, setSubmissionDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [dialog, setDialog] = useState(null);
   
  // Dialog functions
  const showDialog = (message, type = 'success') => {
    setDialog({ message, type });
  };

  const hideDialog = () => {
    setDialog(null);
  };

  // Fetch detailed submission data for grading analysis
  useEffect(() => {
    if (submissions && submissions.length > 0) {
      fetchSubmissionDetails();
    }
  }, [submissions, projectId]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoadingDetails(true);
      
      // Fetch submission details once for the project
      const response = await getSubmissionDetails({
        projectId: projectId
      });
      
      if (response.data.success) {
        const projectSubmissions = response.data.data.submissions || [];
        
        // Create a mapping of submission details by their MongoDB _id
        const detailsMap = {};
        projectSubmissions.forEach((submissionDetail) => {
          detailsMap[submissionDetail._id] = submissionDetail;
        });
        
        setSubmissionDetails(detailsMap);
      }
    } catch (error) {
      console.error('Error fetching submission details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Check if current user has already graded a submission
  const hasUserGradedSubmission = (submission) => {
    // Only check if submission has been submitted (has _id)
    if (!submission._id) {
      return false;
    }
    
    const details = submissionDetails[submission._id];
    console.log(`Checking grading for submission ${submission._id}:`, details);
    
    if (!details || !details.grading || details.grading.length === 0) {
      return false;
    }

    // Check if current user has already provided grading
    return details.grading.some(
      grading => grading.supervisorId === currentUserId
    );
  };

  // Get user's existing grade for a submission
  const getUserGrading = (submission) => {
    // Only check if submission has been submitted (has _id)
    if (!submission._id) {
      return null;
    }
    
    const details = submissionDetails[submission._id];
    if (!details || !details.grading || details.grading.length === 0) {
      return null;
    }

    return details.grading.find(
      grading => grading.supervisorId === currentUserId
    );
  };

  // Check if submission has been graded by any supervisor
  const isSubmissionGraded = (submission) => {
    // Only check if submission has been submitted (has _id)
    if (!submission._id) {
      return false;
    }
    
    const details = submissionDetails[submission._id];
    if (!details || !details.grading) {
      return false;
    }

    return details.grading.length > 0;
  };

  const handleDownload = async (submission) => {
    if (!submission?.s3Key || !submission?.fileName) {
      showDialog("File information missing.", 'error');
      return;
    }

    try {
      const { data } = await generateDownloadUrl(
        submission.s3Key,
        submission.fileName
      );
      const { downloadUrl } = data;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", submission.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
      showDialog("Download failed. Please try again.", 'error');
    }
  };

  const handleGradeSubmission = async (submission) => {
    if (feedback.trim() && grade) {
      try {
        console.log('Grading submission:', { 
          submissionId: submission._id, 
          submissionTitle: submission.title,
          grade, 
          feedback 
        });
        
        // Call parent function to handle grading
        if (onGradeSubmission) {
          await onGradeSubmission(submission._id, grade, feedback);
        }
        
        setFeedback('');
        setGrade('');
        
        // Refresh data
        if (onRefreshData) {
          await onRefreshData();
        }
        
        // Refresh submission details
        await fetchSubmissionDetails();
        
        showDialog('Review submitted successfully!');
      } catch (err) {
        console.error('Grading failed:', err);
        showDialog('Failed to submit review. Please try again.', 'error');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "reviewed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "upcoming":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderGradingStatus = (submission) => {
    if (loadingDetails) {
      return <div className="text-sm text-gray-500">Loading grading status...</div>;
    }

    const hasUserGraded = hasUserGradedSubmission(submission);
    const userGrading = getUserGrading(submission);
    const isGraded = isSubmissionGraded(submission);

    console.log(`Submission ${submission.title} (${submission._id}):`, {
      hasUserGraded,
      userGrading,
      isGraded
    });

    if (hasUserGraded && userGrading) {
      // User has already graded this submission
      return (
        <div className="mb-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-900 mb-2">Your Review</h4>
              <p className="text-sm text-green-800 mb-2">{userGrading.justification}</p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-green-900">Grade:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    {userGrading.grade} ({userGrading.marks}/100)
                  </span>
                </div>
                <Link
                  to={`/supervisor/submissions/${projectId}/${submission._id}/grade`}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (isGraded) {
      // Submission has been graded by others but not by current user
      return (
        <div className="mb-4 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-900 mb-2">Awaiting Your Review</h4>
              <p className="text-sm text-amber-800 mb-3">
                This submission has been reviewed by other supervisors, but you haven't provided your assessment yet.
              </p>
              <Link
                to={`/supervisor/submissions/${projectId}/${submission._id}/grade`}
                className="inline-flex items-center px-4 py-2 border border-amber-600 text-sm font-medium rounded-md text-amber-600 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Add Your Review
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

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
          <div key={submission._id || submission.id} className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{submission.title}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {submission.type}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Due: {submission.deadline 
                        ? new Date(submission.deadline).toLocaleDateString() 
                        : 'N/A'}
                    </span>
                  </div>
                  {submission.status === 'reviewed' && submission.grade && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-green-600">{submission.grade}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                  {submission.status}
                </span>
              </div>
            </div>

            {submission.submittedDate && submission.fileName && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{submission.fileName}</span>
                    {submission.fileSize && (
                      <span className="text-xs text-gray-500">({submission.fileSize})</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-500">
                      Submitted: {new Date(submission.submittedDate).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => handleDownload(submission)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Render grading status based on current user's involvement */}
            {renderGradingStatus(submission)}

            {/* Show grading form only if user hasn't graded and submission is pending */}
            {submission.status === 'pending' && !hasUserGradedSubmission(submission) && (
              <div className="space-y-4">
                {/* Quick action buttons */}
                <div className="flex items-center space-x-3">
                  <Link
                    to={`/supervisor/submissions/${projectId}/${submission._id}/grade`}
                    className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Review Submission 
                  </Link>
                </div>

                
              </div>
            )}

            {submission.status === 'upcoming' && (
              <div className="text-center py-4 text-gray-500">
                <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm">
                  Submission deadline: {submission.deadline 
                    ? new Date(submission.deadline).toLocaleDateString() 
                    : 'Not set'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export default SubmissionsList;