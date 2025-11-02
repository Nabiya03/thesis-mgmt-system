const express = require('express');
const UserRouter = express.Router();
const UserController = require('../controllers/user.controller');
const  authMiddleware  = require('../middlewares/auth.middleware');
const projectController = require('../controllers/projectController');

UserRouter.post('/register', authMiddleware, UserController.register);
UserRouter.get('/all-users', authMiddleware, UserController.getAllUsers);
UserRouter.post('/supervisors', authMiddleware, projectController.getAllSupervisorsByDepartment);
UserRouter.get('/students', authMiddleware, projectController.getAllUnassignedStudents);
UserRouter.put("/:id", authMiddleware, UserController.updateUser);
UserRouter.delete("/:id", authMiddleware, UserController.deleteUser);
UserRouter.get('/all', projectController.getAllUser);
UserRouter.get('/all-supervisors', projectController.getAllSupervisors);

UserRouter.get('/email', authMiddleware, projectController.exportAssignedStudentsCSV);
UserRouter.get('/stats', UserController.getDashboardStats);
module.exports = UserRouter;