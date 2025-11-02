const express = require('express');
const projectRouter = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middlewares/auth.middleware');

projectRouter.post('/create', authMiddleware, projectController.createProject);
projectRouter.get('/', authMiddleware, projectController.getAllProjects);
projectRouter.get('/supervisor/all', authMiddleware, projectController.supervisorProjects);
projectRouter.get('/student', authMiddleware, projectController.getStudentProjects);
projectRouter.get('/available/students', authMiddleware, projectController.getUnassignedStudentsByDepartment);
projectRouter.put('/assign', authMiddleware, projectController.assignProject);
projectRouter.get('/dep-available', authMiddleware, projectController.getAllProjectsForStudent);
projectRouter.get('/detail', authMiddleware, projectController.getProjectDetailsStudent);
projectRouter.get('/:id', authMiddleware, projectController.getProjectDetails);

projectRouter.patch('/:id/update', authMiddleware, projectController.updateProject);
projectRouter.put('/apply', authMiddleware, projectController.applyToProject);
projectRouter.get('/:id/applications', authMiddleware, projectController.getProjectApplications);
//supervisor routes

projectRouter.put('/:id/assign-third-marker', authMiddleware, projectController.addthirdMarker);
projectRouter.put('/:id/assign-supervisor-second', authMiddleware, projectController.addSecondSupervisor);
//admin routes
projectRouter.post('/calendars', authMiddleware, projectController.createCalendar); 
projectRouter.get('/calendars/:department', authMiddleware, projectController.getCalendar); 
projectRouter.put('/update/calendar', authMiddleware, projectController.updateDeadline);
projectRouter.get('/all/calendars', authMiddleware, projectController.getAllCalendars); // Get all calendars
projectRouter.put('/:id/update-deadlines', authMiddleware, projectController.updateProjectDeadlines); // Update deadlines for a project

module.exports = projectRouter;