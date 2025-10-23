
import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Calendar, BookOpen, User, Users, Shield, Clock, MessageCircle, X, Plus, UserPlus } from 'lucide-react';
import {adminProjects, updateProjectDeadline, getAllUnassignedStudents, allSupervisors, assignProjectToStudent, addThirdMarker} from '../../api/userService';
import {useAuth} from '../../contexts/AuthContext';
import CommunicationTab from './CommunicationTab';

function ProjectManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProjectForMessage, setSelectedProjectForMessage] = useState(null);
  const [selectedProjectForAssign, setSelectedProjectForAssign] = useState(null);
  const [selectedProjectForSupervisor, setSelectedProjectForSupervisor] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [supervisorSearchTerm, setSupervisorSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    projectTitle: '',
    deadlineFirst: '',
    deadlineSecond: '',
    deadlineThird: ''
  });
  const {user} = useAuth();
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  // Get current user info (you'll need to pass this from parent or context)
  const currentUserId = user._id; // Replace with actual user ID
  const currentUserRole = 'admin'; // Replace with actual user role

  useEffect(() => {
    fetchProjects();
  }, [page]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await adminProjects();
      setProjects(res.data.data || res.data);
    
      setTotalPages(1);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getAllUnassignedStudents();
      if(response.data.success){
         setAvailableStudents(response.data.data); 
      }
    } catch (err) {
      console.error("Failed to fetch unassigned students:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
    
      const response = await allSupervisors();
   
      if(response.data.success){
         setAvailableSupervisors(response.data.data);
      }
     
    } catch (err) {
      console.error("Failed to fetch supervisors:", err);
    } finally {
      setLoading(false);
    }
  };

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'completed', label: 'Completed' }
  ];

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'Research and development', label: 'Research & Development' },
    { value: 'Applied', label: 'Applied' },
    { value: 'Theoretical', label: 'Theoretical' }
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    try {
      // API call to update deadline
      const res = await updateProjectDeadline(editingProject._id, {
          first: formatDateForAPI(formData.deadlineFirst),
          second: formatDateForAPI(formData.deadlineSecond),
          third: formatDateForAPI(formData.deadlineThird)
      });

      if (res.data.success) {
        // Update local state
        setProjects(prev => 
          prev.map(project => 
            project._id === editingProject._id 
              ? {
                  ...project,
                  deadlines: {
                    first: formData.deadlineFirst,
                    second: formData.deadlineSecond,
                    third: formData.deadlineThird
                  }
                }
              : project
          )
        );

        console.log("Project deadline updated successfully");
        resetForm();
      } else {
        console.error("Failed to update project deadline:", res.data.message);
      }
    } catch (error) {
      console.error("Error updating project deadline:", error);
    }
  };

  const handleAssignStudent = async (studentId) => {
    const payload = {
      id: selectedProjectForAssign._id,
      studentId: studentId,
    };
    
    try {
      const res = await assignProjectToStudent(payload);
      console.log('Assigning student', studentId, 'to project', selectedProjectForAssign._id);
      
      if(res.data.success){
        console.log('Assigned student', studentId, 'to project', selectedProjectForAssign._id);
        setShowAssignModal(false);
        setSelectedStudent(null);
        setSelectedProjectForAssign(null);
        fetchProjects(); // Refresh the projects list
      }
    } catch (error) {
      console.error("Error assigning student:", error);
    }
  };

  const handleAddThirdMarker = async (supervisorId) => {
    console.log("supervisor id to the payload", supervisorId);
    const payload = {
      thirdMarkerId: supervisorId, // Changed from secondSupervisorId to thirdSupervisorId
    };
    
    try {
      const res = await addThirdMarker(selectedProjectForSupervisor._id, payload);
      console.log('Adding third marker', supervisorId, 'to project', selectedProjectForSupervisor._id);
      
      if(res.data.success){
        console.log('Added third marker', supervisorId, 'to project', selectedProjectForSupervisor._id);
        setShowSupervisorModal(false);
        setSelectedSupervisor(null);
        setSelectedProjectForSupervisor(null);
        fetchProjects(); // Refresh the projects list
      }
    } catch (error) {
      console.error("Error adding third marker:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      projectTitle: '',
      deadlineFirst: '',
      deadlineSecond: '',
      deadlineThird: ''
    });
    setEditingProject(null);
    setShowModal(false);
  };

  const handleEditDeadlines = (project) => {
    // Fixed date formatting to avoid timezone issues
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      // Parse the UTC date and format for datetime-local input (YYYY-MM-DDTHH:MM)
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    };

    setFormData({
      projectTitle: project.title,
      deadlineFirst: formatDateForInput(project.deadlines?.first),
      deadlineSecond: formatDateForInput(project.deadlines?.second),
      deadlineThird: formatDateForInput(project.deadlines?.third)
    });
    setEditingProject(project);
    setShowModal(true);
  };

  const formatDateForAPI = (datetimeLocal) => {
    if (!datetimeLocal) return null;
    // Create date object from datetime-local input and convert to ISO string
    const date = new Date(datetimeLocal);
    return date.toISOString(); // This gives format: 2025-08-16T06:41:34.944Z
  };

  const handleOpenMessage = (project) => {
    setSelectedProjectForMessage(project);
    setShowMessageModal(true);
  };

  const handleCloseMessage = () => {
    setSelectedProjectForMessage(null);
    setShowMessageModal(false);
  };

  const handleOpenAssignModal = (project) => {
    setSelectedProjectForAssign(project);
    setShowAssignModal(true);
    fetchStudents(); // Fetch available students when modal opens
  };

  const handleOpenSupervisorModal = (project) => {
    setSelectedProjectForSupervisor(project);
    setShowSupervisorModal(true);
    fetchSupervisors(); // Fetch available supervisors when modal opens
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Research and development':
        return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'Applied':
        return <Shield className="h-4 w-4 text-green-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  // Fixed date formatting to show correct date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    // Use local date methods to avoid timezone issues
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredProjects = (projects || []).filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.supervisor_first?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesType = typeFilter === 'all' || project.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.department?.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const filteredSupervisors = availableSupervisors.filter(supervisor =>
    supervisor.name.toLowerCase().includes(supervisorSearchTerm.toLowerCase()) ||
    supervisor.email.toLowerCase().includes(supervisorSearchTerm.toLowerCase()) ||
    supervisor.department?.toLowerCase().includes(supervisorSearchTerm.toLowerCase())
  );

  const projectStats = {
    total: (projects || []).length,
    available: (projects || []).filter(p => p.status === 'available').length,
    assigned: (projects || []).filter(p => p.status === 'assigned').length,
    completed: (projects || []).filter(p => p.isCompleted).length
  };

return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage thesis projects, deadlines, and assignments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Projects</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{projectStats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Available</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{projectStats.available}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Assigned</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{projectStats.assigned}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-gray-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{projectStats.completed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {types.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supervisors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Loading projects...
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                              {getTypeIcon(project.type)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{project.title}</div>
                            <div className="text-xs text-gray-500">{project.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1 text-blue-500" />
                            {project.supervisor_first?.name || 'Not assigned'}
                          </div>
                          {project.supervisor_second && (
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1 text-green-500" />
                              {project.supervisor_second.name}
                            </div>
                          )}
                          {project.third_marker && (
                            <div className="flex items-center">
                              <Shield className="h-3 w-3 mr-1 text-purple-500" />
                              {project.third_marker?.name}
                            </div>
                          )}
                          {/* Add Third Marker button */}
                          {project.supervisor_first && project.supervisor_second && !project.third_marker && (
                            <button
                              onClick={() => handleOpenSupervisorModal(project)}
                              className="flex items-center text-xs text-purple-600 hover:text-purple-800"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Third Marker
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {project.assignedStudent ? (
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1 text-purple-500" />
                              {project.assignedStudent.name}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAssignModal(project)}
                              className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                            >
                              <UserPlus className="h-3 w-3 mr-1" />
                              Assign Student
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(project.status)}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditDeadlines(project)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Deadlines"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenMessage(project)}
                            className="text-green-600 hover:text-green-900"
                            title="Open Messages"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination controls */}
            {!loading && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => prev - 1)}
                  className={`px-4 py-2 rounded-lg shadow-sm font-medium transition-colors duration-200 
                    ${page === 1 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  Prev
                </button>

                <span className="text-gray-700 font-medium">
                  Page {page} of {totalPages}
                </span>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => prev + 1)}
                  className={`px-4 py-2 rounded-lg shadow-sm font-medium transition-colors duration-200 
                    ${page === totalPages 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Editing Deadlines */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={resetForm} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Update Project Deadlines
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Project: <span className="font-medium">{formData.projectTitle}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="deadlineFirst"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.deadlineFirst}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Second Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="deadlineSecond"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.deadlineSecond}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Third Deadline
                  </label>
                  <input
                    type="datetime-local"
                    name="deadlineThird"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={formData.deadlineThird}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Update Deadlines
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Messages */}
      {showMessageModal && selectedProjectForMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseMessage} />
            
            <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full">
              <div className="bg-white">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Messages - {selectedProjectForMessage.title}
                  </h3>
                  <button
                    onClick={handleCloseMessage}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Communication Component */}
                <div className="h-96">
                  <CommunicationTab
                    projectId={selectedProjectForMessage._id}
                    currentUserRole={currentUserRole}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Student Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAssignModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Assign Student to Project</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Project: <span className="font-medium">{selectedProjectForAssign?.title}</span>
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search students..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedStudent?._id === student._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>{student.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={!selectedStudent}
                  onClick={() => selectedStudent && handleAssignStudent(selectedStudent._id)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedStudent(null);
                    setSelectedProjectForAssign(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Third Marker Modal */}
      {showSupervisorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowSupervisorModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Add Third Marker</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Project: <span className="font-medium">{selectedProjectForSupervisor?.title}</span>
                </p>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search supervisors..."
                    value={supervisorSearchTerm}
                    onChange={(e) => setSupervisorSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {filteredSupervisors.map((supervisor) => (
                    <div
                      key={supervisor._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSupervisor?._id === supervisor._id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSupervisor(supervisor)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <Shield className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{supervisor.name}</p>
                          <p className="text-xs text-gray-500">{supervisor.email}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>{supervisor.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={!selectedSupervisor}
                  onClick={() => selectedSupervisor && handleAddThirdMarker(selectedSupervisor._id)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Third Marker
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSupervisorModal(false);
                    setSelectedSupervisor(null);
                    setSelectedProjectForSupervisor(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProjectManagement;