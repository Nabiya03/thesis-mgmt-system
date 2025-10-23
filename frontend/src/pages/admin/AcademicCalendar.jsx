import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Clock, Users, CheckCircle } from 'lucide-react';
import {createDeadline, getAllDeadlines} from '../../api/userService';
import CalendarDeadlines from "./CalendarDeadlines"; 
function AcademicCalendar() {
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
   const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
const [formData, setFormData] = useState({
  department: "",
  draftProposal: "",
  presentation: "",
  thesis: ""
});

  const eventTypes = [
    { value: 'deadline', label: 'Submission Deadline', color: 'bg-red-100 text-red-800' },
    { value: 'meeting', label: 'Meeting/Review', color: 'bg-blue-100 text-blue-800' },
    { value: 'presentation', label: 'Presentation', color: 'bg-purple-100 text-purple-800' },
    { value: 'workshop', label: 'Workshop/Training', color: 'bg-green-100 text-green-800' },
    { value: 'holiday', label: 'Holiday/Break', color: 'bg-gray-100 text-gray-800' },
    { value: 'registration', label: 'Registration Period', color: 'bg-amber-100 text-amber-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-amber-600' },
    { value: 'high', label: 'High', color: 'text-red-600' }
  ];


  // Mock calendar events
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Literature Review Deadline',
      description: 'Final submission deadline for literature review chapters',
      date: '2024-02-15',
      time: '23:59',
      type: 'deadline',
      affectedRoles: ['student'],
      priority: 'high',
      createdBy: 'System',
      studentsAffected: 45
    },
    {
      id: 2,
      title: 'Supervisor Meeting Week',
      description: 'Scheduled weekly meetings between students and supervisors',
      date: '2024-02-19',
      time: '09:00',
      type: 'meeting',
      affectedRoles: ['student', 'supervisor'],
      priority: 'medium',
      createdBy: 'Dr. Smith',
      studentsAffected: 23
    },
    {
      id: 3,
      title: 'Research Methodology Workshop',
      description: 'Workshop on advanced research methodologies for thesis students',
      date: '2024-02-22',
      time: '14:00',
      type: 'workshop',
      affectedRoles: ['student'],
      priority: 'low',
      createdBy: 'Academic Office',
      studentsAffected: 67
    },
    {
      id: 4,
      title: 'Progress Report Due',
      description: 'Mid-semester progress reports for all active thesis projects',
      date: '2024-03-01',
      time: '23:59',
      type: 'deadline',
      affectedRoles: ['student'],
      priority: 'high',
      createdBy: 'System',
      studentsAffected: 84
    },
    {
      id: 5,
      title: 'Final Presentation Scheduling',
      description: 'Deadline for scheduling final thesis presentations',
      date: '2024-03-15',
      time: '17:00',
      type: 'registration',
      affectedRoles: ['student', 'supervisor'],
      priority: 'medium',
      createdBy: 'Academic Office',
      studentsAffected: 12
    }
  ]);

  //view calenders
   const fetchCalendars = async () => {
      try {
        const res = await getAllDeadlines();
        setCalendars(res.data.data);
       
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

      useEffect(() => {
    fetchCalendars();
  }, []);

  const handleInputChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingEvent) {
      setEvents(prev => prev.map(event => 
        event.id === editingEvent.id 
          ? { ...formData, id: editingEvent.id, createdBy: editingEvent.createdBy, studentsAffected: editingEvent.studentsAffected }
          : event
      ));
    } else {
     
  const toUTCString = (date) => {
    if (!date) return null;
    const utcDate = new Date(date + "T23:59:59Z");
    return utcDate.toISOString(); 
  };
    const payload = {
      department: formData.department,
      deadlines: [
        { deadline: toUTCString(formData.draftProposal) },
        { deadline: toUTCString(formData.presentation) },
        { deadline: toUTCString(formData.thesis) }
      ]
    };
            const res = await createDeadline(payload);
      
            if (res.data?.success) {
              const newEvent = res.data.data; 
      
             
            setEvents(prev => [...prev, newEvent]);
               fetchCalendars();
             
            } else {
              console.error(" Failed to add user:", res.data?.message);
            }
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      type: 'deadline',
      affectedRoles: ['student'],
      priority: 'medium'
    });
    setEditingEvent(null);
    setShowModal(false);
  };

  const handleEdit = (event) => {
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      type: event.type,
      affectedRoles: event.affectedRoles,
      priority: event.priority
    });
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleDelete = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(prev => prev.filter(event => event.id !== eventId));
    }
  };

  const getEventTypeInfo = (type) => {
    return eventTypes.find(t => t.value === type) || eventTypes[0];
  };

  const getPriorityInfo = (priority) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  const submissionLabels = {
  1: "Draft Proposal",
  2: "Presentation",
  3: "Thesis"
};

const calculateDeadlineStats = () => {
  const now = new Date();
  let totalDeadlines = 0;
  let upcomingDeadlines = 0;
  let pastDeadlines = 0;

  calendars.forEach(department => {
    department.deadlines.forEach(deadline => {
      totalDeadlines++;
      const deadlineDate = new Date(deadline.deadline);
      if (deadlineDate > now) {
        upcomingDeadlines++;
      } else {
        pastDeadlines++;
      }
    });
  });

  return { totalDeadlines, upcomingDeadlines, pastDeadlines };
};

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Academic Calendar</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage deadlines, meetings, and important academic dates
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
     <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Calendar className="h-8 w-8 text-blue-500" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">Total Deadlines</dt>
            <dd className="text-2xl font-semibold text-gray-900">{calculateDeadlineStats().totalDeadlines}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>

  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Deadlines</dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {calculateDeadlineStats().upcomingDeadlines}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>

  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <CheckCircle className="h-8 w-8 text-red-500" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">Past Deadlines</dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {calculateDeadlineStats().pastDeadlines}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Events List */}
      <div className="bg-white shadow rounded-lg">
      
        <CalendarDeadlines calendars={calendars} fetchCalendars={fetchCalendars}/>
      </div>

      {/* Modal */}
     {showModal && (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={resetForm}
      />
      <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 
        text-left overflow-hidden shadow-xl transform transition-all sm:my-8 
        sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add Submission Deadlines
          </h3>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <select
              name="department"
              required
              value={formData.department}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
               <option value="Civil Engineering">Civil Engineering</option>
                <option value="Aerospace Engineering">Aerospace Engineering</option>
                 <option value="Marine Engineering">Marine Engineering</option>
            </select>
          </div>

          {/* Draft Proposal Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Draft Proposal Deadline</label>
            <input
              type="date"
              name="draftProposal"
              required
              value={formData.draftProposal}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Presentation Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Presentation Deadline</label>
            <input
              type="date"
              name="presentation"
              required
              value={formData.presentation}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Thesis Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Thesis Deadline</label>
            <input
              type="date"
              name="thesis"
              required
              value={formData.thesis}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 
              focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
              text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md 
              text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
              focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Deadlines
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default AcademicCalendar;