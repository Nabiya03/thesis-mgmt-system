const express = require('express');
const commentRouter = express.Router();
const { addCommentToProject, addAdminDiscussionComment, getProjectComments, getAdminDiscussionComments} = require('../controllers/comment.controller');
const  authMiddleware  = require('../middlewares/auth.middleware');
const validate = require("../middlewares/validate");

const { commentValidation } = require("../validators/commentValidators");

// Route to add a comment to a project

// COMMENTS
commentRouter.post(
  "/add-comment",
  authMiddleware,
  addCommentToProject
);

commentRouter.post(
  "/add-admin-discussion-comment",
  authMiddleware,
  addAdminDiscussionComment
);
// Route to get all comments for a project
commentRouter.get('/show-comments/:projectId', authMiddleware, getProjectComments );
// Route to get admin discussion comments for a project
commentRouter.get('/admin-discussion-comments/:projectId', authMiddleware, getAdminDiscussionComments);
// Export the router
module.exports = commentRouter;
