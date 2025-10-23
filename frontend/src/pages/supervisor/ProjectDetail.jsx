import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Tag, Edit, Users, Mail, Search, UserPlus, Check, X } from 'lucide-react';
import {getProjectById, getALlSupervisors, addSecondMarker, getAvailableStudents, assignProjectToStudent} from '../../api/userService'
function ProjectDetail() {
  const { projectId } = useParams();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
const [project, setProject] = useState(null); // project state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 const [availableStudents, setAvailableStudents] = useState([]);
 const [addSupervisorModal, setAddSupervisorModal] = useState(false);
 const [availableSupervisors, setAvailableSupervisors] = useState([]);


  useEffect(() => {
    if (!projectId) return; // avoid calling if no ID

    fetchProject();
  }, [projectId]); // re-fetch if projectId changes

   const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await getProjectById(projectId);
        setProject(response.data.data); // set API response to state
      } catch (err) {
        setError(err.message || "Failed to fetch project");
      } finally {
        setLoading(false);
      }
    };


    useEffect(() => {
    fetchStudents();
  }, []);

   const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await getAvailableStudents();
        if(response.data.success){
           setAvailableStudents(response.data.data); // set API response to state
        }
       
      } catch (err) {
        setError(err.message || "Failed to fetch project");
      } finally {
        setLoading(false);
      }
    };


    const fetchSupervisors = async () => {
  try {
    setLoading(true);
    const response = await getALlSupervisors({ projectId }); // Pass projectId as payload
    if (response.data.success) {
      setAvailableSupervisors(response.data.data); // Save API response to state
    }
  } catch (err) {
    setError(err.message || "Failed to fetch supervisors");
  } finally {
    setLoading(false);
  }
};

      if (loading) return <p>Loading project...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;


  const handleAssignStudent = async (studentId) => {

    const payload = {
            id: projectId,
            studentId: studentId,
           // type: formData.type
          };
    const res = await assignProjectToStudent(payload);
    console.log('Assigning student', studentId, 'to project', projectId);
    if(res.data.success){
      console.log('Assigned student ', studentId, ' to project ', projectId);
       setShowAssignModal(false);
    setSelectedStudent(null);
      fetchProject();
    }
   
  };

  const handleAddSecondMarker = async (supervisorId) => {
    // In real app, assign student to project
    console.log("supervisor id to the payloaf", supervisorId)
    const payload = {
            secondSupervisorId: supervisorId,
           // type: formData.type
          };
    const res = await addSecondMarker(projectId, payload);
    console.log('Assigning student', supervisorId, 'to project', projectId);
    if(res.data.success){
      console.log('Assigned student ', supervisorId, ' to project ', projectId);
       setAddSupervisorModal(false);
    setSelectedSupervisor(null);
      fetchProject();
    }
   
  };


  const filteredStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSupervisors = availableSupervisors.filter(supervisor =>
  supervisor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  supervisor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
  supervisor.department.toLowerCase().includes(searchTerm.toLowerCase())
);


  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center space-x-4">
        <Link
          to="/supervisor/projects"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {project.type}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {project.status}
                    </span>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{project.duration}</span>
                    </div>
                  </div>
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

          {/* Student Applications */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Applications ({project.appliedStudentsCount})</h2>
              {project.appliedStudentsCount > 0 ? (
                <div className="space-y-6">
                  {project.appliedStudents.map((application) => (
                    <div key={application._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{application.name}</h3>
                            <p className="text-sm text-gray-600">{application.email}</p>
                           
                          </div>
                        </div>
                        
                      </div>
                      
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Students haven't applied to this project yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Project Stats */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Status</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assigned Students</span>
                  <span className="text-sm font-medium text-gray-900">
                  {project?.assignedStudent ? 1 : 0}/1
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Applications</span>
                  <span className="text-sm font-medium text-gray-900">{project.appliedStudentsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Students */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Assigned Students</h2>
                {project?.assignedStudent ? 1 : 0 < 1 && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Assign Student
                  </button>
                )}
              </div>
              {project?.assignedStudent ? 1 : 0 > 0 ? (
                <div className="space-y-3">
                  <div><p>Hello</p></div>
                    <div key={project?.assignedStudent?._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{project?.assignedStudent?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{project?.assignedStudent?.email}</p>
                      </div>
                    </div>
                
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No students assigned</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
               {/* Add Second Marker button - only visible if no second_supervisor */}
                    {!project.supervisor_second && (
                      <button
                        onClick={() => {
                          setAddSupervisorModal(true);
                          fetchSupervisors(); // Fetch list when opening modal
                        }}
                        className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
                        Add Second Marker
                      </button>
                    )}
               
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Student Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAssignModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Assign Student to Project</h3>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                            <span> {student.department}</span>
                            {/* <span>GPA: {student.gpa}</span> */}
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
                  onClick={() => setShowAssignModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )} 
      
      
  

{/* Add Second Marker Modal */}
{addSupervisorModal && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      {/* Background overlay */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={() => setAddSupervisorModal(false)}
      />

      {/* Modal */}
      <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 
                      text-left overflow-hidden shadow-xl transform transition-all 
                      sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Add Second Marker</h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md 
                         leading-5 bg-white placeholder-gray-500 focus:outline-none 
                         focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 
                         focus:border-blue-500"
              placeholder="Search supervisors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Supervisors List */}
        <div className="max-h-64 overflow-y-auto">
          <div className="space-y-2">
            {filteredSupervisors.map((supervisor) => (
              <div
                key={supervisor._id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedSupervisor?._id === supervisor._id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedSupervisor(supervisor)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
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

        {/* Actions */}
        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            disabled={!selectedSupervisor}
            onClick={() =>
              selectedSupervisor && handleAddSecondMarker(selectedSupervisor._id)
            }
            className="w-full inline-flex justify-center rounded-md border border-transparent 
                       shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white 
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 
                       disabled:cursor-not-allowed"
          >
            Add Second Marker
          </button>
          <button
            type="button"
            onClick={() => setAddSupervisorModal(false)}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 
                       shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 
                       hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                       focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
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

export default ProjectDetail;