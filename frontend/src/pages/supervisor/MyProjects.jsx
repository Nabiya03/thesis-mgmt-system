import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Users, Calendar, Edit, MoreVertical, Download, User } from 'lucide-react';
import {getProjects, allStudentsEmail} from '../../api/userService'

function MyProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [projects, setProjects] = useState([]);

  useEffect(() => {
     fetchProjects();
   }, []);
    
  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data.data.projects);
     // setTotalPages(res.data.data.totalPages); // should come from backend
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  
  const statusOptions = [
    { value: 'all', label: 'All Projects' },
    { value: 'available', label: 'Available' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'completed', label: 'Completed' },
  ];

  const getStatusColor = (status) => {
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

  // Function to get relation display text and color
  const getRelationDisplay = (relation) => {
    switch (relation) {
      // case 'supervisor_first':
      //   return { text: 'Supervisor', color: 'bg-purple-100 text-purple-800' };
      case 'supervisor_second':
        return { text: '2nd Marker', color: 'bg-orange-100 text-orange-800' };
      case 'third_marker':
        return { text: '3rd Marker', color: 'bg-teal-100 text-teal-800' };
      default:
        return { text: 'self', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const filteredProjects = projects.filter(project => {
    // Fix search to handle undefined/null values
    const searchableText = `${project.title || ''} ${project.category || ''} ${project.description || ''}`.toLowerCase();
    const matchesSearch = searchTerm === '' || searchableText.includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEmailDownload = async () => {
    try {
        const response = await allStudentsEmail();

      // Create a blob from response
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      // Create temporary download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `assigned_students_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading CSV:", err);
      alert("Failed to download student emails.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
     <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your thesis projects and track student progress
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            {/* New Download Button */}
            <button
              onClick={handleEmailDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Students CSV
            </button>

            {/* Existing Create Project Button */}
            <Link
              to="/supervisor/create-project"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Project
            </Link>
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
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredProjects.map((project) => {
          const relationDisplay = getRelationDisplay(project.relation);
          
          return (
            <div key={project.id} className="bg-white shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {project.title}
                    </h3>
                    <div className="flex items-center space-x-4 mb-3 flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.type}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      {/* New Relation Badge */}
                      {project.relation && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${relationDisplay.color}`}>
                          <User className="h-3 w-3 mr-1" />
                          {relationDisplay.text}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Project Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      {/* <Users className="h-4 w-4" />
                      <span>{project.assignedStudents.length}/{project.maxStudents} assigned</span> */}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{project.appliedStudentsCount || 0} applications</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Assigned Students */}
                {project.assignedStudent && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Assigned Students:</h4>
                    <div className="space-y-1">
                      {/* {project.assignedStudents.map((student) => (
                        <div key={student.id} className="text-sm text-gray-600">
                          {student.name} ({student.email})
                        </div>
                      ))} */}
                  
                        <div key={project.assignedStudent._id} className="text-sm text-gray-600">
                          {project.assignedStudent.name} ({project.assignedStudent.email})
                        </div>
                  
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Link
                      to={`/supervisor/project/${project._id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Link>
                    {project.assignedStudent && (
                      <Link
                        to={`/supervisor/submissions/${project._id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Review Submissions
                      </Link>
                    )}
                  </div>
                  
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-12 text-center">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating your first thesis project.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                to="/supervisor/create-project"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProjects;