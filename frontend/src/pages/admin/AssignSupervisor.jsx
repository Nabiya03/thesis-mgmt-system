import React, { useState } from 'react';
import { Search, Users, User, Link, CheckCircle, AlertCircle } from 'lucide-react';

function AssignSupervisor() {
  const [studentSearch, setStudentSearch] = useState('');
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [assignments, setAssignments] = useState([]);

  // Mock students without supervisors
  const unassignedStudents = [
    {
      id: 1,
      name: 'Emma Wilson',
      email: 'emma.w@university.edu',
      studentId: 'CS2024003',
      department: 'Computer Science',
      year: 'Senior',
      gpa: 3.8,
      interests: ['Machine Learning', 'AI', 'Data Science']
    },
    {
      id: 2,
      name: 'David Brown',
      email: 'david.b@university.edu',
      studentId: 'CS2024004',
      department: 'Computer Science',
      year: 'Senior',
      gpa: 3.6,
      interests: ['Cybersecurity', 'Network Security', 'Cryptography']
    },
    {
      id: 3,
      name: 'Sarah Davis',
      email: 'sarah.d@university.edu',
      studentId: 'DS2024005',
      department: 'Data Science',
      year: 'Senior',
      gpa: 3.9,
      interests: ['Big Data', 'Analytics', 'Machine Learning']
    },
    {
      id: 4,
      name: 'Michael Johnson',
      email: 'michael.j@university.edu',
      studentId: 'CS2024006',
      department: 'Computer Science',
      year: 'Junior',
      gpa: 3.7,
      interests: ['Web Development', 'Mobile Apps', 'UI/UX']
    }
  ];

  // Mock available supervisors
  const availableSupervisors = [
    {
      id: 1,
      name: 'Dr. Jane Smith',
      email: 'jane.smith@university.edu',
      department: 'Computer Science',
      title: 'Professor',
      specializations: ['Machine Learning', 'AI', 'Computer Vision'],
      currentStudents: 5,
      maxStudents: 8,
      rating: 4.8
    },
    {
      id: 2,
      name: 'Prof. Michael Chen',
      email: 'michael.chen@university.edu',
      department: 'Computer Science',
      title: 'Associate Professor',
      specializations: ['Blockchain', 'Cybersecurity', 'Distributed Systems'],
      currentStudents: 3,
      maxStudents: 6,
      rating: 4.6
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      email: 'emily.r@university.edu',
      department: 'Data Science',
      title: 'Assistant Professor',
      specializations: ['Data Analytics', 'Big Data', 'Statistical Modeling'],
      currentStudents: 4,
      maxStudents: 7,
      rating: 4.9
    },
    {
      id: 4,
      name: 'Dr. James Wilson',
      email: 'james.w@university.edu',
      department: 'Computer Science',
      title: 'Professor',
      specializations: ['Software Engineering', 'System Design', 'Cloud Computing'],
      currentStudents: 6,
      maxStudents: 8,
      rating: 4.7
    }
  ];

  // Mock existing assignments
  const [existingAssignments, setExistingAssignments] = useState([
    {
      id: 1,
      student: { name: 'John Doe', email: 'john.doe@university.edu', studentId: 'CS2024001' },
      supervisor: { name: 'Dr. Jane Smith', email: 'jane.smith@university.edu' },
      assignedDate: '2024-01-15',
      status: 'active',
      project: 'AI-Powered Healthcare Diagnosis'
    },
    {
      id: 2,
      student: { name: 'Alice Johnson', email: 'alice.j@university.edu', studentId: 'DS2024002' },
      supervisor: { name: 'Dr. Emily Rodriguez', email: 'emily.r@university.edu' },
      assignedDate: '2024-01-10',
      status: 'active',
      project: 'Big Data Analytics Platform'
    }
  ]);

  const handleAssignSupervisor = () => {
    if (selectedStudent && selectedSupervisor) {
      const newAssignment = {
        id: Date.now(),
        student: selectedStudent,
        supervisor: selectedSupervisor,
        assignedDate: new Date().toISOString().split('T')[0],
        status: 'active',
        project: 'To be assigned'
      };
      
      setExistingAssignments(prev => [...prev, newAssignment]);
      setSelectedStudent(null);
      setSelectedSupervisor(null);
      
      // Show success message (in real app, this would be a proper notification)
      alert(`Successfully assigned ${selectedStudent.name} to ${selectedSupervisor.name}`);
    }
  };

  const filteredStudents = unassignedStudents.filter(student =>
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.studentId.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.department.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredSupervisors = availableSupervisors.filter(supervisor =>
    supervisor.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
    supervisor.email.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
    supervisor.department.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
    supervisor.specializations.some(spec => spec.toLowerCase().includes(supervisorSearch.toLowerCase()))
  );

  const getMatchScore = (student, supervisor) => {
    if (!student || !supervisor) return 0;
    
    const studentInterests = student.interests.map(i => i.toLowerCase());
    const supervisorSpecs = supervisor.specializations.map(s => s.toLowerCase());
    
    const matches = studentInterests.filter(interest =>
      supervisorSpecs.some(spec => spec.includes(interest) || interest.includes(spec))
    );
    
    return (matches.length / Math.max(studentInterests.length, supervisorSpecs.length)) * 100;
  };

  const matchScore = getMatchScore(selectedStudent, selectedSupervisor);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assign Supervisors</h1>
              <p className="mt-1 text-sm text-gray-600">
                Match students with appropriate supervisors based on interests and expertise
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{unassignedStudents.length} unassigned students</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{availableSupervisors.length} available supervisors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students Column */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Unassigned Students</h2>
              <span className="text-sm text-gray-500">{filteredStudents.length} students</span>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{student.name}</h3>
                      <p className="text-xs text-gray-600">{student.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>ID: {student.studentId}</span>
                        <span>{student.year}</span>
                        <span>GPA: {student.gpa}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{student.department}</p>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {student.interests.map((interest, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Supervisors Column */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Available Supervisors</h2>
              <span className="text-sm text-gray-500">{filteredSupervisors.length} supervisors</span>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search supervisors..."
                  value={supervisorSearch}
                  onChange={(e) => setSupervisorSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSupervisors.map((supervisor) => (
                <div
                  key={supervisor.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedSupervisor?.id === supervisor.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSupervisor(supervisor)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{supervisor.name}</h3>
                      <p className="text-xs text-gray-600">{supervisor.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{supervisor.title}</span>
                        <span>Rating: {supervisor.rating}/5</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{supervisor.department}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>Students: {supervisor.currentStudents}/{supervisor.maxStudents}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${(supervisor.currentStudents / supervisor.maxStudents) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {supervisor.specializations.map((spec, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Panel */}
      {(selectedStudent || selectedSupervisor) && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Preview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Student</h3>
                {selectedStudent ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-medium text-blue-900">{selectedStudent.name}</p>
                    <p className="text-sm text-blue-700">{selectedStudent.email}</p>
                    <p className="text-xs text-blue-600">{selectedStudent.department} • {selectedStudent.year}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-500">
                    No student selected
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Supervisor</h3>
                {selectedSupervisor ? (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="font-medium text-green-900">{selectedSupervisor.name}</p>
                    <p className="text-sm text-green-700">{selectedSupervisor.email}</p>
                    <p className="text-xs text-green-600">{selectedSupervisor.title} • {selectedSupervisor.department}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-500">
                    No supervisor selected
                  </div>
                )}
              </div>
            </div>

            {selectedStudent && selectedSupervisor && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Compatibility Analysis</h3>
                  <div className="flex items-center space-x-2">
                    {matchScore >= 60 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      matchScore >= 60 ? 'text-green-600' : 'text-amber-600'
                    }`}>
                      {matchScore.toFixed(0)}% Match
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${
                        matchScore >= 60 ? 'bg-green-600' : 'bg-amber-600'
                      }`}
                      style={{ width: `${matchScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {matchScore >= 80 ? 'Excellent match based on interests and expertise' :
                     matchScore >= 60 ? 'Good match with some overlapping areas' :
                     'Limited overlap - consider alternative matches'}
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleAssignSupervisor}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Assign Supervisor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing Assignments */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Current Assignments ({existingAssignments.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supervisor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {existingAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{assignment.student.name}</div>
                        <div className="text-sm text-gray-500">{assignment.student.email}</div>
                        {assignment.student.studentId && (
                          <div className="text-xs text-gray-400">ID: {assignment.student.studentId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{assignment.supervisor.name}</div>
                        <div className="text-sm text-gray-500">{assignment.supervisor.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.project}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.assignedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {assignment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignSupervisor;