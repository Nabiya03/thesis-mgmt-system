
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProjects, submissionDashboard } from '../../api/userService';
import { BookOpen, Users, FileCheck, Plus, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch projects data
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        console.log('Fetching projects...');
        const response = await getProjects();
        console.log('API Response:', response);
        
        if (response && response.data.success && response.data && response.data.data.projects) {
          setProjects(response.data.data.projects);
          console.log('Projects set successfully:', response.data.data.projects.length);
        } else {
          console.error('Invalid response structure:', response);
          setError('Failed to fetch projects - Invalid response structure');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Error fetching projects: ' + (err.message || err.toString()));
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch submissions data
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        console.log('Fetching submissions...');
        const response = await submissionDashboard();
        console.log('Submissions API Response:', response);
        
        if (response && response.data.success && response.data.data.submissions) {
          const formattedSubmissions = response.data.data.submissions.map((submission, index) => {
            // Determine type based on submissionIndex
            let type;
            switch (submission.submissionIndex) {
              case 0:
                type = 'Draft Proposal';
                break;
              case 1:
                type = 'Presentation';
                break;
              case 2:
                type = 'Thesis';
                break;
              default:
                type = 'Unknown';
            }

            // Convert status
            const status = submission.status === 'graded' ? 'reviewed' : submission.status;

            // Format date to readable format
            const submittedAt = new Date(submission.createdAt).toLocaleString('en-GB', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });

            return {
              id: index + 1,
              student: submission.studentName,
              project: submission.projectTitle,
              type: type,
              submittedAt: submittedAt,
              status: status
            };
          });

          setRecentSubmissions(formattedSubmissions);
          console.log('Submissions set successfully:', formattedSubmissions.length);
        } else {
          console.error('Invalid submissions response structure:', response);
          // Don't set error for submissions, just use empty array
          setRecentSubmissions([]);
        }
      } catch (err) {
        console.error('Error fetching submissions:', err);
        // Don't set error for submissions, just use empty array
        setRecentSubmissions([]);
      }
    };

    fetchSubmissions();
  }, []);

  // Calculate stats from API data
  const calculateStats = () => {
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return {
        activeProjects: 0,
        assignedStudents: 0,
        pendingReviews: 0,
        completedProjects: 0
      };
    }

    const activeProjects = projects.length;
    
    // Count projects with assigned students
    const assignedStudents = projects.filter(project => 
      project.assignedStudent && project.assignedStudent._id
    ).length;
    
    // Count pending reviews from actual submissions
    const pendingReviews = recentSubmissions.filter(submission => 
      submission.status === 'pending'
    ).length;
    
    // Count completed projects
    const completedProjects = projects.filter(project => 
      project.status === 'completed' || project.isCompleted
    ).length;

    return {
      activeProjects,
      assignedStudents,
      pendingReviews,
      completedProjects
    };
  };

  const stats_data = calculateStats();

  const stats = [
    {
      name: 'Active Projects',
      value: stats_data.activeProjects.toString(),
      change: '+12%',
      changeType: 'increase',
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      name: 'Assigned Students',
      value: stats_data.assignedStudents.toString(),
      change: '+4%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-green-500'
    },
    {
      name: 'Pending Reviews',
      value: stats_data.pendingReviews.toString(),
      change: '-8%',
      changeType: 'decrease',
      icon: FileCheck,
      color: 'bg-amber-500'
    },
    {
      name: 'Completed Projects',
      value: stats_data.completedProjects.toString(),
      change: '+16%',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'bg-purple-500'
    }
  ];

  // Calculate upcoming deadlines
  const getUpcomingDeadlines = () => {
    if (!projects || !Array.isArray(projects) || projects.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allDeadlines = [];

    projects.forEach(project => {
      // Only check projects with assigned students
      if (!project.assignedStudent || !project.assignedStudent._id) return;

      const deadlineTypes = [
        { key: 'first', title: 'Draft Proposal', priority: 'high' },
        { key: 'second', title: 'Presentation', priority: 'high' },
        { key: 'third', title: 'Thesis', priority: 'medium' }
      ];

      deadlineTypes.forEach(deadlineType => {
        const deadlineDate = new Date(project.deadlines[deadlineType.key]);
        deadlineDate.setHours(0, 0, 0, 0);
        
        // Only show upcoming deadlines (today or future)
        if (deadlineDate >= today) {
          allDeadlines.push({
            id: `${project._id}-${deadlineType.key}`,
            student: project.assignedStudent.name,
            project: project.title,
            task: deadlineType.title,
            date: deadlineDate.toLocaleDateString('en-GB', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }),
            priority: deadlineType.priority,
            sortDate: deadlineDate
          });
        }
      });
    });

    // Group deadlines by date
    const groupedByDate = allDeadlines.reduce((acc, deadline) => {
      const dateKey = deadline.date;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          sortDate: deadline.sortDate,
          deadlines: []
        };
      }
      acc[dateKey].deadlines.push(deadline);
      return acc;
    }, {});

    // Convert to array, sort by date, and return top 3 dates
    return Object.values(groupedByDate)
      .sort((a, b) => a.sortDate - b.sortDate)
      .slice(0, 3);
  };

  const upcomingDeadlines = getUpcomingDeadlines();

  const quickActions = [
    {
      name: 'Create New Project',
      href: '/supervisor/create-project',
      icon: Plus,
      description: 'Add a new thesis project for students',
      color: 'bg-blue-500'
    },
    {
      name: 'Review Submissions',
      href: '/supervisor/projects',
      icon: FileCheck,
      description: 'Check pending student submissions',
      color: 'bg-green-500'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-72"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600">
                Manage your thesis projects and guide your students to success.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full ${item.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                          <span>{item.change}</span>
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
    <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className={`grid grid-cols-1 gap-4 ${
            quickActions.length === 1 ? 'sm:grid-cols-1' : 
            quickActions.length === 2 ? 'sm:grid-cols-2' : 
            'sm:grid-cols-3'
          }`}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="relative group bg-gray-50 p-4 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <span className={`rounded-lg inline-flex p-2 ${action.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {action.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Submissions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Submissions</h3>
            <div className="space-y-4">
              {recentSubmissions.length > 0 ? (
                recentSubmissions.map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{submission.student}</p>
                      <p className="text-sm text-gray-600">{submission.project} - {submission.type}</p>
                      <p className="text-xs text-gray-500">{submission.submittedAt}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.status === 'pending' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {submission.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent submissions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((dateGroup, index) => (
                  <div key={dateGroup.date} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      {dateGroup.date}
                    </h4>
                    <div className="space-y-2">
                      {dateGroup.deadlines.map((deadline) => (
                        <div
                          key={deadline.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                deadline.priority === 'high'
                                  ? 'bg-red-500'
                                  : deadline.priority === 'medium'
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{deadline.student}</p>
                              <p className="text-xs text-gray-600">{deadline.project} - {deadline.task}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;