import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/common/Login';
import StudentLayout from './layouts/StudentLayout';
import SupervisorLayout from './layouts/SupervisorLayout';
import AdminLayout from './layouts/AdminLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import AllProjects from './pages/student/AllProjects';
import ProjectApplication from './pages/student/ProjectApplication';
import MyProject from './pages/student/MyProject';
import SubmissionPage from './pages/student/SubmissionPage';
import AITasks from './pages/student/AITasks';
import StudentViewGradingPage from './pages/student/ViewGrade';

// Supervisor Pages
import SupervisorDashboard from './pages/supervisor/Dashboard';
import CreateProject from './pages/supervisor/CreateProject';
import MyProjects from './pages/supervisor/MyProjects';
import ProjectDetail from './pages/supervisor/ProjectDetail';
import SubmissionsReview from './pages/supervisor/SubmissionsReview';
import SubmissionGradingPage from './pages/supervisor/GradingPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AcademicCalendar from './pages/admin/AcademicCalendar';
import UserManagement from './pages/admin/UserManagement';
import AssignSupervisor from './pages/admin/AssignSupervisor';
import SystemSettings from './pages/admin/SystemSettings';
import ProjectManagement from './pages/admin/ProjectManagement';


function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${user.role}/dashboard`} replace />} />
      
      {/* Student Routes */}
      <Route path="/student/*" element={
        <ProtectedRoute allowedRoles={['student']}>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="projects" element={<AllProjects />} />
        <Route path="project/:projectId" element={<ProjectApplication />} />
        <Route path="my-project" element={<MyProject />} />
        <Route path="submit" element={<SubmissionPage />} />
        <Route path="tasks" element={<AITasks />} />
        <Route path="submission/:projectId/:submissionId/grading" element={<StudentViewGradingPage />} />
      </Route>

      {/* Supervisor Routes */}
      <Route path="/supervisor/*" element={
        <ProtectedRoute allowedRoles={['supervisor']}>
          <SupervisorLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<SupervisorDashboard />} />
        <Route path="create-project" element={<CreateProject />} />
        <Route path="projects" element={<MyProjects />} />
        <Route path="project/:projectId" element={<ProjectDetail />} />
        <Route path="submissions/:projectId" element={<SubmissionsReview />} />
          <Route path='submissions/:projectId/:submissionId/grade' element={<SubmissionGradingPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="calendar" element={<AcademicCalendar />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="assign" element={<AssignSupervisor />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="projects" element={<ProjectManagement />} />
      </Route>

      <Route path="*" element={<Navigate to={`/${user.role}/dashboard`} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;