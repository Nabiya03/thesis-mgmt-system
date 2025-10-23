import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Tag, FileText, Send, CheckCircle } from 'lucide-react';
import {getProjectById, applytoProject, getAvailableStudents, assignProjectToStudent} from '../../api/userService';
import {useAuth} from '../../contexts/AuthContext';

function ProjectApplication() {
  const { projectId } = useParams();
  const [applicationText, setApplicationText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [project, setProject] = useState(null); 
   const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth(); 

  const currentUserId = user?._id; 
  
    useEffect(() => {
      
      console.log("use effect called for project", projectId);
      console.log("current user", currentUserId);
      fetchProject();
    }, [projectId]); 
  
     const fetchProject = async () => {
        try {
          setLoading(true);
          const response = await getProjectById(projectId);
          setProject(response.data.data); 
                console.log("Applied students:", response.data.data.appliedStudents);
console.log("Current user ID:", currentUserId, typeof currentUserId);
        } catch (err) {
          setError(err.message || "Failed to fetch project");
        } finally {
          setLoading(false);
        }
      };

            if (loading) return <p>Loading project...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();


   
        const payload = {
                id: projectId,
              };
              console.log("payload to send", payload);
                console.log('Applying to project', projectId);
        const res =  applytoProject(payload);
      console.log("res", res.status);

        if(res.status == 409){
          window.alert('You have already applied for this project.')
        }
        if(res.data.success){
    
          console.log('Applied to project ', projectId);

    setSubmitted(true);
        }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Application Submitted!</h2>
              <p className="mt-2 text-gray-600">
                Your application for "{project.title}" has been successfully submitted.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                You will receive an email confirmation shortly. The supervisor will review your application and contact you within 5-7 business days.
              </p>
              <div className="mt-6 flex justify-center space-x-4">
                <Link
                  to="/student/projects"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back to Projects
                </Link>
                <Link
                  to="/student/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center space-x-4">
        <Link
          to="/student/projects"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{project.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  {/* First Supervisor */}
                                    {project.supervisor_first && (
                                      <div className="flex items-center space-x-1">
                                        <User className="h-4 w-4" />
                                        <span>
                                          <strong>First Supervisor:</strong> {project.supervisor_first.name}
                                        </span>
                                      </div>
                                    )}
                  
                                    {/* Second Marker */}
                                    {project.supervisor_second && (
                                      <div className="flex items-center space-x-1">
                                        <User className="h-4 w-4" />
                                        <span>
                                          <strong>Second Marker:</strong> {project.supervisor_second.name}
                                        </span>
                                      </div>
                                    )}
                  
                                    {/* Third Marker */}
                                    {project.third_marker && (
                                      <div className="flex items-center space-x-1">
                                        <User className="h-4 w-4" />
                                        <span>
                                          <strong>Third Marker:</strong> {project.third_marker.name}
                                        </span>
                                      </div>
                                    )}
                </div>
                <div className="flex items-center space-x-1">
                  <Tag className="h-4 w-4" />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {project.type}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Description</h3>
                <div className="text-gray-700 whitespace-pre-line mb-6">
                  {project.description}
                </div>

                

        
              </div>
            </div>
          </div>
        </div>

        {/* Application Form */}
            {/* Application Form - Conditional Rendering */}
<div className="lg:col-span-1">
  <div className="bg-white shadow rounded-lg sticky top-6">
    <div className="px-4 py-5 sm:p-6">
      {project.appliedStudents?.some(student => student._id === currentUserId)  ? (
        // Already applied card
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            You have already applied for this project
          </h2>
          <p className="text-sm text-green-700">
            Your application is under review. You will be notified once a decision is made.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Apply for this Project
          </h2>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Current Applications:</span>
                <span>{project.appliedStudentsCount}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Before applying, ensure you have:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Reviewed all project requirements</li>
                <li>• Checked prerequisite courses</li>
                <li>• Considered the time commitment</li>
                <li>• Prepared your academic transcript</li>
              </ul>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Application
            </button>
          </form>

          <div className="mt-4 text-xs text-gray-500">
            <p>
              By submitting this application, you agree to the university's
              academic integrity policies.
            </p>
          </div>
        </>
      )}
    </div>
  </div>
</div>

      </div>
    </div>
  );
}

export default ProjectApplication;