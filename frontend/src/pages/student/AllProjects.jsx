import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, BookOpen, User, Calendar, Tag } from 'lucide-react';
import {getAvailableProjectsForStudents} from '../../api/userService';

function AllProjects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');


  const [projects, setProjects] = useState([]);
  
    useEffect(() => {
       fetchProjects();
     }, []);
      const fetchProjects = async () => {
        try {
          const res = await getAvailableProjectsForStudents();
          setProjects(res.data.data.project);
         // setTotalPages(res.data.data.totalPages); // should come from backend
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };

  const categories = ['all', 'Research and development', 'Applied', 'IoT', 'Quantum Computing'];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.supervisor_first?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Available Projects</h1>
              <p className="mt-1 text-sm text-gray-600">
                Browse and apply for thesis projects from various supervisors
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <BookOpen className="h-4 w-4" />
              <span>{filteredProjects.length} projects available</span>
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
                  placeholder="Search projects, supervisors, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
<div className="space-y-4">
  {filteredProjects.map((project) => (
    <div
      key={project._id}
      className="bg-white shadow rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {project.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
                  
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

                  {/* Project Type */}
                  <div className="flex items-center space-x-1">
                    <Tag className="h-4 w-4" />
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {project.type}
                    </span>
                  </div>

                  {/* Calendar (duration) */}
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>

               
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
            <div className="flex flex-col items-end space-y-3">
              <div className="text-right text-sm text-gray-500">
                <div>{project.appliedStudentsCount} applications</div>
              </div>
              <Link
                to={`/student/project/${project._id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

      {filteredProjects.length === 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or check back later for new projects.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllProjects;