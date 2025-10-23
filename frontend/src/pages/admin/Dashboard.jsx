
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, BookOpen, FileCheck, TrendingUp, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { adminProjects, getUsersCount, recentActivities } from '../../api/userService';

function Dashboard() {
  const { user } = useAuth();
  const [usersData, setUsersData] = useState(null);
  const [projectsData, setProjectsData] = useState([]);
  const [activitiesData, setActivitiesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
       
        const [usersResponse, projectsResponse] = await Promise.all([
          getUsersCount(),
          adminProjects()
        ]);
        
        setUsersData(usersResponse.data.data);
        setProjectsData(projectsResponse.data.data);
        
      } catch (error) {
        console.error('Error fetching main data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Separate useEffect for activities - non-blocking
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activitiesResponse = await recentActivities();
        setActivitiesData(activitiesResponse.data.data);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivitiesData(null);
      }
    };

    // Fetch activities after a small delay to not block main UI
    const timer = setTimeout(fetchActivities, 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate project stats
  const getProjectStats = () => {
    const totalProjects = projectsData.length;
    const availableProjects = projectsData.filter(project => project.status === 'available').length;
    const assignedProjects = projectsData.filter(project => project.status === 'assigned').length;
    
    return {
      total: totalProjects,
      available: availableProjects,
      assigned: assignedProjects
    };
  };

  // Calculate upcoming deadlines grouped by date
  const getUpcomingDeadlines = () => {
    const deadlines = [];
    const today = new Date();
    
    projectsData.forEach(project => {
      if (project.deadlines) {
        
        if (project.deadlines.first) {
          const firstDate = new Date(project.deadlines.first);
          if (firstDate >= today) {
            deadlines.push({
              date: project.deadlines.first,
              title: 'Draft Proposal Due',
              type: 'draft',
              project: project.title,
              priority: 'high'
            });
          }
        }
        
    
        if (project.deadlines.second) {
          const secondDate = new Date(project.deadlines.second);
          if (secondDate >= today) {
            deadlines.push({
              date: project.deadlines.second,
              title: 'Presentation Due',
              type: 'presentation',
              project: project.title,
              priority: 'medium'
            });
          }
        }
        
    
        if (project.deadlines.third) {
          const thirdDate = new Date(project.deadlines.third);
          if (thirdDate >= today) {
            deadlines.push({
              date: project.deadlines.third,
              title: 'Thesis Submission Due',
              type: 'thesis',
              project: project.title,
              priority: 'high'
            });
          }
        }
      }
    });

    // Sort by date and group by date
    deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const groupedByDate = {};
    deadlines.forEach(deadline => {
      const dateKey = deadline.date.split('T')[0]; // Get date part only
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      
      // Check if this type already exists for this date
      const existingType = groupedByDate[dateKey].find(item => item.type === deadline.type);
      if (existingType) {
        existingType.count++;
      } else {
        groupedByDate[dateKey].push({
          title: deadline.title,
          type: deadline.type,
          count: 1,
          priority: deadline.priority
        });
      }
    });

    // Convert to array and take top 3 dates
    const upcomingDeadlines = [];
    Object.keys(groupedByDate).slice(0, 3).forEach(date => {
      upcomingDeadlines.push({
        date: date,
        deadlines: groupedByDate[date]
      });
    });

    return upcomingDeadlines;
  };

  // Format time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now - date;
    
    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (hours < 24) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  // Get recent activities from API data
  const getRecentActivities = () => {
    if (!activitiesData) return [];

    const activities = [];

    // Add recent students activity
    if (activitiesData.recentStudents && activitiesData.recentStudents.count > 0) {
      activities.push({
        id: 1,
        type: 'user_registration',
        message: `${activitiesData.recentStudents.count} new student${activitiesData.recentStudents.count > 1 ? 's' : ''} registered`,
        time: getTimeAgo(activitiesData.recentStudents.createdAt),
        icon: Users,
        color: 'text-blue-600',
        createdAt: new Date(activitiesData.recentStudents.createdAt)
      });
    }

    // Add recent project activity
    if (activitiesData.recentProject) {
      activities.push({
        id: 2,
        type: 'project_creation',
        message: `${activitiesData.recentProject.supervisorName} created "${activitiesData.recentProject.title}" project`,
        time: getTimeAgo(activitiesData.recentProject.createdAt),
        icon: BookOpen,
        color: 'text-green-600',
        createdAt: new Date(activitiesData.recentProject.createdAt)
      });
    }

    // Add ungraded submissions activity
    if (activitiesData.ungradedSubmissions && activitiesData.ungradedSubmissions.count > 0) {
      activities.push({
        id: 3,
        type: 'submission',
        message: `${activitiesData.ungradedSubmissions.count} new submission${activitiesData.ungradedSubmissions.count > 1 ? 's' : ''} require review`,
        time: getTimeAgo(activitiesData.ungradedSubmissions.latestCreatedAt),
        icon: FileCheck,
        color: 'text-purple-600',
        createdAt: new Date(activitiesData.ungradedSubmissions.latestCreatedAt)
      });
    }

  
    activities.sort((a, b) => b.createdAt - a.createdAt);

    return activities;
  };

  const projectStats = getProjectStats();
  
  const stats = [
    {
      name: 'Total Users',
      value: loading ? '...' : usersData?.totalUsers?.toString() || '0',
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500',
      details: loading ? 'Loading...' : `${usersData?.roleSummary?.student || 0} Students, ${usersData?.roleSummary?.supervisor || 0} Supervisors, ${usersData?.roleSummary?.admin || 0} Admins`
    },
    {
      name: 'Active Projects',
      value: loading ? '...' : projectStats.total.toString(),
      change: '+18%',
      changeType: 'increase',
      icon: BookOpen,
      color: 'bg-green-500',
      details: loading ? 'Loading...' : `${projectStats.assigned} Assigned, ${projectStats.available} Available`
    },
    {
      name: 'Submissions This Week',
      value: '10',
      change: '+8%',
      changeType: 'increase',
      icon: FileCheck,
      color: 'bg-purple-500',
      details: '3 Reviewed, 7 Pending'
    },
    {
      name: 'System Usage',
      value: '94%',
      change: '+2%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-amber-500',
      details: 'Daily active users'
    }
  ];

  const recentActivitiesList = getRecentActivities();
  const upcomingDeadlines = getUpcomingDeadlines();

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600">
                System overview and administrative controls for the Student Thesis Management System
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
                      <dd className="text-xs text-gray-500 mt-1">{item.details}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent System Activity</h3>
            <div className="flow-root">
              {!activitiesData ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-pulse">Loading activities...</div>
                </div>
              ) : recentActivitiesList.length > 0 ? (
                <ul className="-mb-8">
                  {recentActivitiesList.map((activity, idx) => {
                    const Icon = activity.icon;
                    return (
                      <li key={activity.id}>
                        <div className="relative pb-8">
                          {idx !== recentActivitiesList.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                <Icon className={`h-4 w-4 ${activity.color}`} />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-600">{activity.message}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {activity.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-center text-gray-500 py-8">No recent activities</div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center text-gray-500">Loading deadlines...</div>
              ) : upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((dateGroup, index) => (
                  <div key={dateGroup.date} className="space-y-2">
                    {/* Date Header */}
                    <div className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                      {formatDate(dateGroup.date)}
                    </div>
                    
                    {/* Deadlines for this date */}
                    <div className="space-y-2 ml-2">
                      {dateGroup.deadlines.map((deadline, deadlineIndex) => (
                        <div
                          key={`${dateGroup.date}-${deadline.type}`}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                deadline.priority === 'high'
                                  ? 'bg-red-500'
                                  : deadline.priority === 'medium'
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                              }`}
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">{deadline.title}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                            {deadline.count} items
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500">No upcoming deadlines</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;