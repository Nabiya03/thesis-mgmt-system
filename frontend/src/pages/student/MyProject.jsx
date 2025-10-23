
import React, {useState, useEffect} from 'react';
import { User, Calendar, FileText, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getProjectDetails, getSubmissionDetails } from '../../api/userService';

function MyProject() {
  const [myProject, setMyProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [completedMilestones, setCompletedMilestones] = useState([]);
  const previewLength = 300; // characters

  useEffect(() => {
    fetchProjectAndSubmissions();
  }, []);

  const fetchProjectAndSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch project details
      const projectResponse = await getProjectDetails();
      const apiData = projectResponse.data.data;

      // Create base deadlines array
      const baseDeadlines = [
        { id: 1, title: 'Draft Proposal', date: apiData.deadlines.first, status: 'pending', type: 'Proposal' },
        { id: 2, title: 'Presentation', date: apiData.deadlines.second, status: 'pending', type: 'Presentation' },
        { id: 3, title: 'Thesis', date: apiData.deadlines.third, status: 'pending', type: 'Thesis' }
      ];

      // Fetch submission details
      let submissionData = null;
      try {
        const submissionResponse = await getSubmissionDetails({
          projectId: apiData._id
        });
        submissionData = submissionResponse.data.data;
        console.log("Submission data:", submissionData);
      } catch (err) {
        console.log("No submissions found yet, starting fresh");
      }

      // Process submissions and update deadline status
      const upcoming = [];
      const completed = [];

      baseDeadlines.forEach((deadline, index) => {
        let isCompleted = false;
        let submissionInfo = null;

        // Check if this deadline has a corresponding submission
        if (submissionData && submissionData.submissions && submissionData.submissions[index]) {
          const submission = submissionData.submissions[index];
          isCompleted = true;
          submissionInfo = {
            submittedDate: submission.createdAt,
            fileName: submission.fileName,
            grade: submission.grading && submission.grading.length > 0 ? submission.finalGrade : null,
            feedback: submission.grading && submission.grading.length > 0 ? submission.grading[0].feedback : null,
            isGraded: submission.grading && submission.grading.length > 0
          };
        }

        if (isCompleted) {
          completed.push({
            ...deadline,
            status: 'completed',
            ...submissionInfo
          });
        } else {
        
          const status = upcoming.length === 0 ? 'pending' : 'upcoming';
          upcoming.push({
            ...deadline,
            status
          });
        }
      });

      setUpcomingDeadlines(upcoming);
      setCompletedMilestones(completed);

     
      const mappedProject = {
        id: apiData._id,
        title: apiData.title,
        supervisor: {
          name: apiData.supervisor_first.name,
          email: apiData.supervisor_first.email,
          office: apiData.supervisor_first.department || 'N/A',
          phone: 'N/A'
        },
        secondMarker: {
          name: apiData.supervisor_second.name,
          email: apiData.supervisor_second.email
        },
        description: apiData.description,
        category: apiData.type,
        startDate: apiData.assignedAt,
        expectedCompletion: apiData.deadlines.third,
        status: apiData.status,
        progress: Math.round((completed.length / baseDeadlines.length) * 100),
        nextMilestone: upcoming.length > 0 ? upcoming[0].title : 'All milestones completed',
        nextDeadline: upcoming.length > 0 ? upcoming[0].date : null,
        objectives: [
          'Complete project proposal',
          'Prepare for presentation', 
          'Write final thesis'
        ]
      };

      setMyProject(mappedProject);
    } catch (error) {
      console.error('Error fetching project and submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-amber-100 text-amber-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'upcoming':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return <div>Loading project details...</div>;
  }

  if (!myProject) {
    return <div>No project assigned.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{myProject.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {myProject.category}
                </span>
                <span>Started: {new Date(myProject.startDate).toLocaleDateString()}</span>
                <span>Expected completion: {new Date(myProject.expectedCompletion).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="ml-6 flex-shrink-0">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{myProject.progress}%</div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${myProject.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supervision Team */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Supervision Team</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Primary Supervisor</h3>
                    <p className="text-sm text-gray-600">{myProject.supervisor.name}</p>
                    <div className="mt-1 text-xs text-gray-500 space-y-1">
                      <p>Email: {myProject.supervisor.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Second Marker</h3>
                    <p className="text-sm text-gray-600">{myProject.secondMarker.name}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      <p>Email: {myProject.secondMarker.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
             
          {/*Description */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Description</h2>
              <p
                className="text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: myProject.description.length > previewLength && !expanded
                    ? myProject.description.slice(0, previewLength).replace(/\n\n/g, "<br/><br/>") + "..."
                    : myProject.description.replace(/\n\n/g, "<br/><br/>")
                }}
              ></p>

              {myProject.description.length > previewLength && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                >
                  {expanded ? "Read less" : "Read more"}
                </button>
              )}
            </div>
          </div>

          {/* Objectives */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Objectives</h2>
              <ul className="space-y-2">
                {myProject.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 bg-blue-600 rounded-full" />
                    </div>
                    <span className="text-sm text-gray-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

         
        </div>

        {/* Timeline and Deadlines */}
        <div className="lg:col-span-1 space-y-6">
          {/* Next Milestone */}
          {upcomingDeadlines.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Milestone</h2>
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <h3 className="font-medium text-amber-900">{myProject.nextMilestone}</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Due: {new Date(myProject.nextDeadline).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-amber-600 mt-2">
                    {Math.ceil((new Date(myProject.nextDeadline) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline) => (
                    <div key={deadline.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(deadline.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{deadline.title}</p>
                          <p className="text-xs text-gray-500">{new Date(deadline.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deadline.status)}`}>
                        {deadline.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


           {/* Completed Milestones */}
          {completedMilestones.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Milestones</h2>
                <div className="space-y-3">
                  {completedMilestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{milestone.title}</p>
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(milestone.submittedDate).toLocaleDateString()}
                          </p>
                          {/* {milestone.fileName && (
                            <p className="text-xs text-gray-500">File: {milestone.fileName}</p>
                          )} */}
                          {/* {milestone.grade && (
                            <p className="text-xs text-green-600 font-medium">Grade: {milestone.grade}</p>
                          )} */}
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All milestones completed message */}
          {upcomingDeadlines.length === 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium text-green-900">All Milestones Completed!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Congratulations on completing your project.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyProject;