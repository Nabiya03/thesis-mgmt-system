


import React, { useState, useEffect } from 'react';
import { FileText, MessageCircle } from 'lucide-react';
import SubmissionsTab from './SubmissionTab';
import CommunicationTab from './CommunicationTab';
import { getProjectDetails} from '../../api/userService';

function SubmissionPage() {
  const [selectedTab, setSelectedTab] = useState('submissions');
  const [newComment, setNewComment] = useState('');
   const [myProject, setMyProject] = useState(null);
    const [loading, setLoading] = useState(true);

 useEffect(() => {
     async function fetchProject() {
       try {
         const res = await getProjectDetails(); // Replace with your API endpoint
         
 
         if (res.data.success) {
           const apiData = res.data.data;
 
 
           setMyProject(apiData);
         }
       } catch (error) {
         console.error('Error fetching project:', error);
       } finally {
         setLoading(false);
       }
     }
 
     fetchProject();
   }, []);
  
  

 
  const handleFileUpload = (submissionId) => {
    console.log('Uploading file for submission:', submissionId);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      console.log('New comment:', newComment);
      setNewComment('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Submissions & Communication</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your project submissions and communicate with your supervisor
          </p>
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
          </nav>
        </div>

        <div className="p-6">
          {selectedTab === 'submissions' && (
            <SubmissionsTab/>
          )}
          {selectedTab === 'communication' && (
            <CommunicationTab
              projectId={myProject._id}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmissionPage;
