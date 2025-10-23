
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, User, Calendar, BookOpen, CheckCircle } from 'lucide-react';
import { getProjectById, getSubmissionDetails, generateDownloadUrl } from '../../api/userService';

function StudentGradingViewPage() {
  const { projectId, submissionId } = useParams();
  
  // Debug params
  useEffect(() => {
    console.log('URL Params:', { projectId, submissionId });
  }, [projectId, submissionId]);
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Submission data
  const [submission, setSubmission] = useState(null);
  const [project, setProject] = useState(null);
  const [grading, setGrading] = useState(null);

  // Section labels mapping (same as supervisor)
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

  useEffect(() => {
    fetchSubmissionData();
  }, [projectId, submissionId]);

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

      // Map submission data
      const mappedSubmission = {
        id: currentIndex,
        title: getSubmissionTitle(currentIndex),
        type: getSubmissionType(currentIndex),
        fileName: currentSubmission.fileName,
        fileSize: currentSubmission.fileSize || "N/A",
        finalGrade: currentSubmission.finalGrade || "N/A",
        submittedDate: currentSubmission.createdAt || currentSubmission.submittedDate,
        s3Key: currentSubmission.s3Key,
        student: {
          name: projectData.assignedStudent?.name || 'N/A',
          id: projectData.assignedStudent?.studentId || 'N/A',
          email: projectData.assignedStudent?.email || 'N/A'
        }
      };

      // Check if graded and get grading data
      if (currentSubmission.grading && currentSubmission.grading.length > 0) {
        setGrading(currentSubmission.grading[0]);
      } else {
        setError("This submission has not been graded yet.");
        return;
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

  const handleDownloadGrading = () => {
    // Generate dynamic filename
    const studentName = submission.student.name.replace(/\s+/g, '_');
    const submissionType = submission.type;
    const grade = grading.marks;
    const filename = `COMP-702-${studentName}-${submissionType}-${grade}.pdf`;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Grade Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.4; 
            color: #333;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #ddd; 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
          }
          .section { 
            margin-bottom: 25px; 
          }
          .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 10px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 20px; 
          }
          .info-item { 
            margin-bottom: 5px; 
          }
          .info-item strong { 
            font-weight: 600; 
          }
          .grade-display { 
            text-align: center; 
            background-color: #f3f4f6; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0; 
          }
          .final-grade { 
            font-size: 36px; 
            font-weight: bold; 
            color: #2563eb; 
          }
          .assessment-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0; 
          }
          .assessment-table th, .assessment-table td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          .assessment-table th { 
            background-color: #f8f9fa; 
            font-weight: 600; 
          }
          .grade-badge { 
            background-color: #e5e7eb; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 12px; 
            font-weight: 500; 
          }
          .feedback-box { 
            background-color: #f9fafb; 
            border: 1px solid #d1d5db; 
            padding: 15px; 
            border-radius: 6px; 
            margin: 10px 0; 
          }
          .feedback-paragraph { 
            margin-bottom: 10px; 
          }
          .footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Grade Report - COMP-702</h1>
          <h2>Specification and Design Assessment</h2>
        </div>
        
        <div class="section">
          <div class="info-grid">
            <div>
              <div class="info-item"><strong>Project:</strong> ${project.title}</div>
              <div class="info-item"><strong>Student:</strong> ${submission.student.name}</div>
              <div class="info-item"><strong>Submission Type:</strong> ${submission.type}</div>
            </div>
            <div>
              <div class="info-item"><strong>Submitted:</strong> ${new Date(submission.submittedDate).toLocaleDateString()}</div>
             
              <div class="info-item">
                
                  <strong>Supervisor:</strong> ${project.supervisor_first?.name || 'N/A'}
                  
               
              </div>
            </div>
          </div>
        </div>

        <div class="grade-display">
          <div class="final-grade">${submission.finalGrade}/100</div>
          <div>Final Grade</div>
        </div>

        ${grading.summativeAssessment && grading.summativeAssessment.length > 0 ? `
        <div class="section">
          <div class="section-title">Summative Assessment</div>
          <table class="assessment-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${grading.summativeAssessment.map(item => `
                <tr>
                  <td>${item.category}</td>
                  <td><span class="grade-badge">${item.grade}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${grading.justification ? `
        <div class="section">
          <div class="section-title">Justification of the Grade</div>
          <div class="feedback-box">
            ${grading.justification.split('\n\n').map(paragraph => 
              `<div class="feedback-paragraph">${paragraph.replace(/\n/g, '<br>')}</div>`
            ).join('')}
          </div>
        </div>
        ` : ''}

        ${grading.formativeFeedback ? `
        <div class="section">
          <div class="section-title">Formative Feedback</div>
          <p><em>Feedback to help you improve your project:</em></p>
          <div class="feedback-box">
            ${grading.formativeFeedback.split('\n\n').map(paragraph => 
              `<div class="feedback-paragraph">${paragraph.replace(/\n/g, '<br>')}</div>`
            ).join('')}
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString()} | COMP-702 Project Assessment</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      
      // Close window after printing (optional)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  };

  const handleDownload = async () => {
    if (!submission?.s3Key || !submission?.fileName) {
      alert("File information missing.");
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
      alert('Download failed. Please try again.');
    }
  };

  const getGradeColor = (grade) => {
    const gradeColors = {
      'A*': 'text-green-700 bg-green-100',
      'A': 'text-green-600 bg-green-50',
      'B': 'text-blue-600 bg-blue-50',
      'C': 'text-yellow-600 bg-yellow-50',
      'D': 'text-orange-600 bg-orange-50',
      'F': 'text-red-600 bg-red-50',
      'G': 'text-red-700 bg-red-100'
    };
    return gradeColors[grade] || 'text-gray-600 bg-gray-50';
  };

  const GradeDisplay = ({ grade }) => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade)}`}>
      {grade}
    </span>
  );

  if (loading) return <div className="p-6">Loading grading details...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!submission || !grading) return <div className="p-6">Grading not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to={`/student/submit`} // Adjust route as needed
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Submissions
          </Link>
        </div>

        {/* Header Card */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Submission Grading Results
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
                   
                      <>
                        <strong>Supervisor:</strong> {project.supervisor_first?.name}
                      </>
                
                    
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibent text-gray-900 mb-2">Submission Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><strong>Type:</strong> {submission.type}</div>
                  <div><strong>Submitted:</strong> {new Date(submission.submittedDate).toLocaleDateString()}</div>
                  <div><strong>Graded:</strong> {new Date(grading.gradedAt || grading.createdAt).toLocaleDateString()}</div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>{submission.fileName}</span>
                    <button 
                      onClick={handleDownload}
                      className="text-blue-600 hover:text-blue-800"
                      title="Download submission"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Marks */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Overall Result</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-center space-x-4 p-6 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {submission.finalGrade}
                </div>
                <div className="text-sm text-gray-600">
                  Final Grade
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Assessment Criteria */}
        {grading.summativeAssessment && grading.summativeAssessment.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">A. Summative Assessment</h2>
              <p className="text-sm text-gray-600 mt-1">
                The grade above is based on a profile formed from the following categories.
              </p>
            </div>
            <div className="px-6 py-4">
              {/* Sections in the document */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sections in the document</h3>
                <div className="space-y-3">
                  {Object.entries(sectionLabels).map(([key, label]) => {
                    const assessmentItem = grading.summativeAssessment.find(item => item.category === label);
                    if (!assessmentItem) return null;
                    
                    return (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-700">{label}</span>
                        <GradeDisplay grade={assessmentItem.grade} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quality of project and report */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Quality of project and report</h3>
                <div className="space-y-3">
                  {Object.entries(qualityLabels).map(([key, label]) => {
                    const assessmentItem = grading.summativeAssessment.find(item => item.category === label);
                    if (!assessmentItem) return null;
                    
                    return (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-700">{label}</span>
                        <GradeDisplay grade={assessmentItem.grade} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Sections */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Feedback from Supervisor</h2>
              <button
                onClick={handleDownloadGrading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Your Grade
              </button>
            </div>
          </div>
          <div className="px-6 py-4 space-y-6">
            {/* Justification of the grade */}
            {grading.justification && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justification of the grade:
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700">
                  {grading.justification.split('\n\n').map((paragraph, index) => (
                    <div key={index} className={index > 0 ? 'mt-3' : ''}>
                      {paragraph.split('\n').map((line, lineIndex) => (
                        <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
                          {line}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formative Feedback */}
            {grading.formativeFeedback && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">B. Formative Feedback</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Feedback to help you improve your project.
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guidance for improvements:
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-gray-700">
                  {grading.formativeFeedback.split('\n\n').map((paragraph, index) => (
                    <div key={index} className={index > 0 ? 'mt-3' : ''}>
                      {paragraph.split('\n').map((line, lineIndex) => (
                        <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
                          {line}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <BookOpen className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> If you have any questions about your grading or feedback, 
                please contact your supervisor during their office hours or via email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentGradingViewPage;