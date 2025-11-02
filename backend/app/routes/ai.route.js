
const express = require('express');
const aiRouter = express.Router();
const {
  handleAIRequest,
  getConversations,
  getConversation,
  saveTask,
  getSavedTasks,
  updateTaskProgress,
  deleteConversation
} = require('../controllers/ai.controller');
const  authMiddleware  = require('../middlewares/auth.middleware'); // Assuming you have auth middleware



// AI Chat Routes
aiRouter.post('/chat', authMiddleware, handleAIRequest);
aiRouter.get('/conversations', authMiddleware, getConversations);
aiRouter.get('/conversations/:conversationId',authMiddleware, getConversation);
aiRouter.delete('/conversations/:conversationId', authMiddleware, deleteConversation);

// Task Management Routes
aiRouter.post('/tasks/save',authMiddleware, saveTask);
aiRouter.get('/tasks',authMiddleware, getSavedTasks);
aiRouter.patch('/tasks/:taskId/progress', authMiddleware,updateTaskProgress);

module.exports = aiRouter;