
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, FileText, Shield } from 'lucide-react';
import { getProjectDetails, getSubmissionDetails, getProjectById } from '../../api/userService';
import SubmissionsList from './SubmissionList';
import CommunicationTab from './CommunicationTab';
import {useAuth} from '../../contexts/AuthContext';
import AdminDiscussionTab  from './CommentAdmin';

function SubmissionsReview() {
  const { projectId } = useParams();
  const [selectedTab, setSelectedTab] = useState('submissions');
  const {user} = useAuth();
  
  // State for dynamic data
  const [project, setProject] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjectAndSubmissions();
  }, [projectId]);

  const fetchProjectAndSubmissions = async () => {
    try {
      setLoading(true);
      console.log("calling project detail api for project..", projectId);
      
      // Fetch project details
      const projectResponse = await getProjectById(projectId);
      const projectData = projectResponse.data.data;
      console.log("response in project data ", projectResponse);
      setProject(projectData);

      // Fetch submission details for this project
      let submissionData = null;
      try {
        const submissionResponse = await getSubmissionDetails({
          projectId: projectId
        });
        submissionData = submissionResponse.data.data;
        console.log("submission data..", submissionData);
      } catch (err) {
        console.log("No submissions found yet");
      }

      // Create base submissions structure
      const deadlines = projectData?.deadlines || {};
      const baseSubmissions = [
        {
          id: 1,
          title: "Draft Proposal",
          type: "Proposal",
          deadline: deadlines.first || null,
          status: "upcoming",
          submittedDate: null,
          fileName: null,
          fileSize: null,
          grade: null,
          feedback: null,
          s3Key: null,
          _id: null, // Will be set if submission exists
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
          _id: null, // Will be set if submission exists
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
          _id: null, // Will be set if submission exists
        },
      ];

      // Map API submissions to base submissions by type/order
      if (submissionData && submissionData.submissions) {
        const apiSubmissions = submissionData.submissions;
        
        // Create a mapping function to match API submissions to base submissions
        const mapSubmissionByOrder = (apiSubmission, index) => {
          if (index < baseSubmissions.length) {
            const fileSizeMB = "N/A"; // You might need to store this or calculate
            
            // Determine status based on grading
            let status = "submitted";
            if (apiSubmission.grading && apiSubmission.grading.length > 0) {
              status = "reviewed";
            }
            
            console.log(`Mapping API submission ${index} with _id: ${apiSubmission._id}`);
            
            // Update the base submission with API data
            baseSubmissions[index] = {
              ...baseSubmissions[index],
              _id: apiSubmission._id, // MongoDB ObjectId
              submittedDate: apiSubmission.createdAt,
              fileName: apiSubmission.fileName,
              fileSize: fileSizeMB,
              status: status,
              s3Key: apiSubmission.s3Key,
              // Don't set grade/feedback here as they're specific to each supervisor
            };
          }
        };

        // Map each API submission to corresponding base submission
        apiSubmissions.forEach(mapSubmissionByOrder);

        // Set pending status for submissions that are submitted but not fully graded
        baseSubmissions.forEach((sub, index) => {
          if (sub.submittedDate && sub.status !== "reviewed") {
            baseSubmissions[index].status = "pending";
          }
        });
      }

      setSubmissions(baseSubmissions);
      console.log("Final submissions array:", baseSubmissions);
    } catch (err) {
      setError(err.message || "Failed to fetch project and submissions");
    } finally {
      setLoading(false);
    }
  };

  // Handler for grading submissions - to be called from SubmissionsList
  const handleGradeSubmission = async (submissionId, grade, feedback) => {
    try {
      // Here you would call your grading API
      // await gradeSubmission({ submissionId, grade, feedback, projectId });
      
      console.log('Grading submission:', { submissionId, grade, feedback, projectId });
      
      return Promise.resolve(); // Return success
    } catch (err) {
      console.error('Grading failed:', err);
      throw err; // Re-throw for error handling in child component
    }
  };

  if (loading) return <div className="p-6">Loading project details...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!project) return <div className="p-6">Project not found.</div>;

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center space-x-4">
        <Link
          to="/supervisor/projects"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <p className="mt-1 text-sm text-gray-600">
                Student: {project.assignedStudent?.name || 'N/A'} ({project.assignedStudent?.email || 'N/A'})
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>Project ID: {project._id}</div>
              <div>Review submissions and provide feedback</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setSelectedTab('submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'submissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 mr-2 inline" />
              Submissions
            </button>
            
            {/* Only show Communication tab if current user is the first supervisor */}
            {user._id === project.supervisor_first._id && (
              <button
                onClick={() => setSelectedTab('communication')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'communication'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="h-4 w-4 mr-2 inline" />
                Communication
              </button>
            )}

            {/* Discuss with Admin tab - visible to all users */}
            <button
              onClick={() => setSelectedTab('admin-discussion')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                selectedTab === 'admin-discussion'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="h-4 w-4 mr-2 inline" />
              Discuss with Admin
            </button>
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'submissions' && (
            <SubmissionsList
              submissions={submissions}
              projectId={projectId}
              onGradeSubmission={handleGradeSubmission}
              onRefreshData={fetchProjectAndSubmissions}
              currentUserId={user._id}
            />
          )}

          {selectedTab === 'communication' && user._id === project.supervisor_first._id && (
            <CommunicationTab
              projectId={projectId}
              currentUserRole="supervisor"
              currentUserId={user._id}
            />
          )}

          {selectedTab === 'admin-discussion' && (
            <AdminDiscussionTab
              projectId={projectId}
              currentUserId={user._id}
              currentUserRole={user.role}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmissionsReview;