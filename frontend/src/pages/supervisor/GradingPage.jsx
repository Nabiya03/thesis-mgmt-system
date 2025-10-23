
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Save, CheckCircle, FileText, User, Calendar, BookOpen, Eye, AlertCircle, X } from 'lucide-react';
import { getProjectById, getSubmissionDetails, submitGrading, generateDownloadUrl } from '../../api/userService';
import {useAuth } from '../../contexts/AuthContext';


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


function SubmissionGradingPage() { 
  const { projectId, submissionId } = useParams();
  const {user} = useAuth();
  const currentUserId = user._id;
  const [dialog, setDialog] = useState(null);
  
  // Debug params
  useEffect(() => {
    console.log('URL Params:', { projectId, submissionId });
  }, [projectId, submissionId]);
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Submission data
  const [submission, setSubmission] = useState(null);
  const [project, setProject] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [hasUserGraded, setHasUserGraded] = useState(false);
  const [userGrading, setUserGrading] = useState(null);
  const [allGradings, setAllGradings] = useState([]);

  // Grading form data
  const [marks, setMarks] = useState('');
  const [justification, setJustification] = useState('');
  const [formativeFeedback, setFormativeFeedback] = useState('');
  const [submissionIndex, setSubmissionIndex] = useState(0);

  // Assessment criteria
  const [sectionsGrading, setSectionsGrading] = useState({
    projectDescription: '',
    aimsRequirements: '',
    literatureBackground: '',
    developmentSummary: '',
    dataSources: '',
    testing: '',
    evaluation: '',
    ethicalConsiderations: '',
    bcsProjectCriteria: '',
    uiMockup: '',
    projectPlan: '',
    risksContingency: '',
    references: ''
  });

  const [qualityGrading, setQualityGrading] = useState({
    projectOriginality: '',
    projectFeasibility: '',
    fluencySuccinctness: '',
    coherence: ''
  });

  const gradeOptions = ['A*', 'A', 'B', 'C', 'D', 'F', 'G'];

  // Section labels mapping
  const sectionLabels = {
    projectDescription: 'Project Description',
    aimsRequirements: 'Aims and Requirements',
    literatureBackground: 'Key Literature and Background Reading',
    developmentSummary: 'Development and Implementation Summary',
    dataSources: 'Data Sources',
    testing: 'Testing',
    evaluation: 'Evaluation',
    ethicalConsiderations: 'Ethical Considerations',
    bcsProjectCriteria: 'BCS Project Criteria',
    uiMockup: 'User Interface Mockup',
    projectPlan: 'Project Plan',
    risksContingency: 'Risks and Contingency Plans',
    references: 'References'
  };

  const qualityLabels = {
    projectOriginality: 'Project Originality',
    projectFeasibility: 'Expected Project Feasibility',
    fluencySuccinctness: 'Fluency / Succinctness',
    coherence: 'Coherence'
  };
  
  // Dialog functions
  const showDialog = (message, type = 'success') => {
    setDialog({ message, type });
  };

  const hideDialog = () => {
    setDialog(null);
  };

  useEffect(() => {
    fetchSubmissionData();
  }, [projectId, submissionId, currentUserId]);

  const fetchSubmissionData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching data for:', { projectId, submissionId });
      
      // Fetch project details
      const projectResponse = await getProjectById(projectId);
      const projectData = projectResponse.data.data;
      setProject(projectData);
      console.log("project..", projectData);

      // Fetch submission details
      const submissionResponse = await getSubmissionDetails({ projectId });
      const submissionData = submissionResponse.data.data;
      
      // Find the specific submission by submissionId
      let currentSubmission = null;
      let currentIndex = 0;
      
      if (submissionData && submissionData.submissions) {
        submissionData.submissions.forEach((sub, index) => {
          if (sub._id === submissionId || sub.id === submissionId) {
            currentSubmission = sub;
            currentIndex = index;
          }
        });
      }

      if (!currentSubmission) {
        setError("Submission not found");
        return;
      }

      // Set submission index for API
      setSubmissionIndex(currentIndex);

      // Check grading status
      const allGradings = currentSubmission.grading || [];
      const currentUserGrading = allGradings.find(
        grading => grading.supervisorId === currentUserId
      );

      setAllGradings(allGradings);
      setHasUserGraded(!!currentUserGrading);
      setUserGrading(currentUserGrading);

      // Map submission data
      const mappedSubmission = {
        id: currentIndex,
        title: getSubmissionTitle(currentIndex),
        type: getSubmissionType(currentIndex),
        fileName: currentSubmission.fileName,
        fileSize: currentSubmission.fileSize || "N/A",
        submittedDate: currentSubmission.createdAt || currentSubmission.submittedDate,
        s3Key: currentSubmission.s3Key,
        student: {
          name: projectData.assignedStudent?.name || 'N/A',
          id: projectData.assignedStudent?.studentId || 'N/A',
          email: projectData.assignedStudent?.email || 'N/A'
        },
        grading: currentUserGrading || null,
        allGradings: allGradings
      };

      // Determine view mode
      if (currentUserGrading) {
        setIsViewMode(true);
        // Populate form with existing grading data
        populateFormWithGrading(currentUserGrading);
      } else {
        setIsViewMode(false);
        // Clear form for new grading
        clearForm();
      }

      setSubmission(mappedSubmission);
      console.log('Mapped submission data:', mappedSubmission);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || "Failed to fetch submission data");
    } finally {
      setLoading(false);
    }
  };

  const populateFormWithGrading = (grading) => {
    setMarks(grading.marks || '');
    setJustification(grading.justification || '');
    setFormativeFeedback(grading.formativeFeedback || '');
    
    // Map summative assessment back to form
    if (grading.summativeAssessment) {
      const sectionsMap = {};
      const qualityMap = {};
      
      grading.summativeAssessment.forEach(item => {
        const categoryKey = getCategoryKey(item.category);
        if (sectionLabels[categoryKey]) {
          sectionsMap[categoryKey] = item.grade;
        } else if (qualityLabels[categoryKey]) {
          qualityMap[categoryKey] = item.grade;
        }
      });
      
      setSectionsGrading(sectionsMap);
      setQualityGrading(qualityMap);
    }
  };

  const clearForm = () => {
    setMarks('');
    setJustification('');
    setFormativeFeedback('');
    setSectionsGrading({
      projectDescription: '',
      aimsRequirements: '',
      literatureBackground: '',
      developmentSummary: '',
      dataSources: '',
      testing: '',
      evaluation: '',
      ethicalConsiderations: '',
      bcsProjectCriteria: '',
      uiMockup: '',
      projectPlan: '',
      risksContingency: '',
      references: ''
    });
    setQualityGrading({
      projectOriginality: '',
      projectFeasibility: '',
      fluencySuccinctness: '',
      coherence: ''
    });
  };

  // Helper functions
  const getSubmissionTitle = (index) => {
    const titles = ["Draft Proposal", "Presentation", "Thesis"];
    return titles[index] || `Submission ${index + 1}`;
  };

  const getSubmissionType = (index) => {
    const types = ["Proposal", "Presentation", "Thesis"];
    return types[index] || "Submission";
  };

  const getCategoryKey = (categoryName) => {
    // Map API category names to form keys
    const mapping = {
      "Project Description": "projectDescription",
      "Aims and Requirements": "aimsRequirements",
      "Key Literature and Background Reading": "literatureBackground",
      "Development and Implementation Summary": "developmentSummary",
      "Data Sources": "dataSources",
      "Testing": "testing",
      "Evaluation": "evaluation",
      "Ethical Considerations": "ethicalConsiderations",
      "BCS Project Criteria": "bcsProjectCriteria",
      "User Interface Mockup": "uiMockup",
      "Project Plan": "projectPlan",
      "Risks and Contingency Plans": "risksContingency",
      "References": "references",
      "Project Originality": "projectOriginality",
      "Expected Project Feasibility": "projectFeasibility",
      "Fluency / Succinctness": "fluencySuccinctness",
      "Coherence": "coherence"
    };
    return mapping[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '');
  };

  const getSupervisorRole = (supervisorId) => {
    if (supervisorId === project?.supervisor_first?._id) return 'First Supervisor';
    if (supervisorId === project?.supervisor_second?._id) return 'Second Marker';
    if (supervisorId === project?.supervisor_third?._id) return 'Third Marker';
    return 'Supervisor';
  };

  const handleSectionGradeChange = (section, grade) => {
    if (isViewMode) return;
    setSectionsGrading(prev => ({
      ...prev,
      [section]: grade
    }));
  };

  const handleQualityGradeChange = (quality, grade) => {
    if (isViewMode) return;
    setQualityGrading(prev => ({
      ...prev,
      [quality]: grade
    }));
  };

  const handleDownload = async () => {
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
      console.error('Download failed:', err);
      showDialog('Download failed. Please try again.', 'error');
    }
  };

  const handleSaveGrading = async () => {
    try {
      setSaving(true);
      
      // Prepare summative assessment array
      const summativeAssessment = [];
      
      // Add sections grading
      Object.entries(sectionsGrading).forEach(([key, grade]) => {
        if (grade) {
          summativeAssessment.push({
            category: sectionLabels[key],
            grade: grade
          });
        }
      });
      
      // Add quality grading
      Object.entries(qualityGrading).forEach(([key, grade]) => {
        if (grade) {
          summativeAssessment.push({
            category: qualityLabels[key],
            grade: grade
          });
        }
      });

      const gradingPayload = {
        projectId: projectId,
        studentId: project.assignedStudent?._id || project.assignedStudent?.id,
        submissionIndex: submissionIndex,
        marks: parseInt(marks),
        justification: justification,
        formativeFeedback: formativeFeedback,
        summativeAssessment: summativeAssessment
      };

      console.log('Submitting grading:', gradingPayload);
      
      // Call API to submit grading
      const response = await submitGrading(gradingPayload);
      console.log('Grading response:', response);
      
      showDialog('Grading submitted successfully!');
      
      // Refresh data to show updated status
      await fetchSubmissionData();
      
      // Navigate after closing dialog
      setTimeout(() => {
        navigate(`/supervisor/submissions/${projectId}`);
      }, 2000);
    } catch (err) {
      console.error('Failed to submit grading:', err);
      showDialog('Failed to submit grading. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditGrading = () => {
    setIsViewMode(false);
  };

  const renderGradingStatus = () => {
    if (allGradings.length === 0) {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                No Reviews Yet
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                This submission hasn't been reviewed by any supervisor yet.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Grading Status</h2>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            {allGradings.map((grading, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                grading.supervisorId === currentUserId 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {getSupervisorRole(grading.supervisorId)}
                      {grading.supervisorId === currentUserId && ' (You)'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Grade: <span className="font-medium">{grading.grade}</span> | 
                      Marks: <span className="font-medium">{grading.marks}/100</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {grading.supervisorId === currentUserId ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                {grading.justification && (
                  <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                    {grading.justification}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const GradeSelector = ({ value, onChange, disabled = false }) => (
    <div className="flex space-x-1">
      {gradeOptions.map((grade) => (
        <button
          key={grade}
          type="button"
          disabled={disabled}
          onClick={() => onChange(grade)}
          className={`px-2 py-1 text-xs border rounded ${
            value === grade
              ? 'bg-blue-600 text-white border-blue-600'
              : disabled
              ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {grade}
        </button>
      ))}
    </div>
  );

  if (loading) return <div className="p-6">Loading submission details...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!submission) return <div className="p-6">Submission not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dialog Notification */}
      {dialog && (
        <Dialog 
          message={dialog.message} 
          type={dialog.type} 
          onClose={hideDialog} 
        />
      )}
      
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to={`/supervisor/submissions/${projectId}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Submissions
          </Link>
          <div className="flex items-center space-x-2">
            {/* {hasUserGraded && isViewMode && (
              <button
                onClick={handleEditGrading}
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Edit Review
              </button>
            )} */}
            {/* {!isViewMode && (
              <button
                onClick={handleSaveGrading}
                disabled={saving || !marks || !justification}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : hasUserGraded ? 'Update Review' : 'Save Grading'}
              </button>
            )} */}
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              {isViewMode ? (hasUserGraded ? 'Your Review' : 'View Reviews') : 'Grade Submission'}
            </h1>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><strong>Assessment:</strong> Specification and Design</div>
                  <div><strong>Project:</strong> {project.title}</div>
                  <div><strong>Student:</strong> {submission.student.name} ({submission.student.id})</div>
                  <div>
                    {project.relation === "supervisor_first" && (
                      <>
                        <strong>Supervisor:</strong> {project.supervisor_first?.name}
                      </>
                    )}
                    {project.relation === "supervisor_second" && (
                      <>
                        <strong>Second Marker:</strong> {project.supervisor_second?.name}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><strong>Type:</strong> {submission.type}</div>
                  <div><strong>Submitted:</strong> {new Date(submission.submittedDate).toLocaleDateString()}</div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>{submission.fileName}</span>
                    <button 
                      onClick={handleDownload}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grading Status */}
        {renderGradingStatus()}

        {/* Overall Marks */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isViewMode && hasUserGraded ? 'Your Marks' : 'Overall Marks'}
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Marks (out of 100):</label>
              <input
                type="number"
                min="0"
                max="100"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                disabled={isViewMode}
                className="block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="0-100"
              />
              {marks && (
                <div className="flex items-center text-lg font-bold text-green-600">
                  <CheckCircle className="h-5 w-5 mr-1" />
                  {marks}/100
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Criteria */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">A. Summative Assessment</h2>
            <p className="text-sm text-gray-600 mt-1">
              The grade above is based on a profile formed from the following categories.
              The overall grade awarded is guided by this profile but not necessarily a weighted or averaged grade.
            </p>
          </div>
          <div className="px-6 py-4">
            {/* Sections in the document */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Sections in the document</h3>
              <div className="space-y-3">
                {Object.entries(sectionLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-700">{label}</span>
                    <GradeSelector
                      value={sectionsGrading[key]}
                      onChange={(grade) => handleSectionGradeChange(key, grade)}
                      disabled={isViewMode}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quality of project and report */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality of project and report</h3>
              <div className="space-y-3">
                {Object.entries(qualityLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-700">{label}</span>
                    <GradeSelector
                      value={qualityGrading[key]}
                      onChange={(grade) => handleQualityGradeChange(key, grade)}
                      disabled={isViewMode}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Sections */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Feedback</h2>
          </div>
          <div className="px-6 py-4 space-y-6">
            {/* Justification of the grade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justification of the grade:
              </label>
              <textarea
                rows={8}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                disabled={isViewMode}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Provide detailed justification for the marks awarded..."
              />
            </div>

            {/* Formative Feedback */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">B. Formative Feedback</h3>
              <p className="text-sm text-gray-600 mb-3">
                Feedback below aims to help the student to improve the project. It is not part of the assessment criteria.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guidance for improvements:
              </label>
              <textarea
                rows={6}
                value={formativeFeedback}
                onChange={(e) => setFormativeFeedback(e.target.value)}
                disabled={isViewMode}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Provide constructive feedback to help the student improve their work..."
              />
            </div>
          </div>
        </div>

        {/* Save Button (if not in view mode) */}
        {!isViewMode && (
          <div className="flex justify-end">
            <button
              onClick={handleSaveGrading}
              disabled={saving || !marks || !justification}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Saving Grading...' : hasUserGraded ? 'Update Final Grading' : 'Submit Final Grading'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubmissionGradingPage;