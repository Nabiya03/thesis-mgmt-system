const {User, Project} = require("../models")();
const { ApiResponse } = require('../utils/ApiResponse');
const logger = require('../loggers/winston.logger');

const addCommentToProject = async (req, res, next) => {
  try {
 
    const userId = req.user.id; 
    const { projectId, message } = req.body;
   
    const role = req.user.role; 

    if (!projectId || !message) {
      return res.status(400).json(new ApiResponse(400, null, 'projectId and message are required.') );
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json(new ApiResponse (404, null, 'Project not found.' ));

    const isAllowed =
      (req.user.role === 'student' && project.assignedStudent?.toString() === userId) ||
      (req.user.role === 'supervisor' && (
        project.supervisor_first.toString() === userId ||
        project.supervisor_second?.toString() === userId
      ));


    if (!isAllowed) {
      return res.status(403).json(new ApiResponse(401, null, 'Access denied to comment on this project.' ));
    }

    const newComment = {
      senderId: userId,
      role,
      message,
      createdAt: new Date()
    };

    project.comments.push(newComment);
    await project.save();

   
    res.status(200).json(new ApiResponse(200, newComment, 'Comment added successfully.'));
  } catch (err) {
    logger.error(`Error adding comment to project: ${err.message}`);
    next();
  }
};


const addAdminDiscussionComment = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is stored in req.user._id
    const role = req.user.role; // Assuming user role is stored in req.user.role
    const { projectId, message } = req.body;

    if (!projectId || !message) {
      return res.status(400).json(new ApiResponse (400, null, 'projectId and message are required.' ));
    }

    if (!['admin', 'supervisor'].includes(role)) {
      return res.status(403).json(new ApiResponse (403, null,'Only admins and supervisors can comment in this thread.' ));
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json(new ApiResponse (404, null, 'Project not found.' ));

    const isAllowed =
      (role === 'admin') ||
      (role === 'supervisor' && (
        project.supervisor_first.toString() === userId ||
        project.supervisor_second?.toString() === userId
      ));

    if (!isAllowed) {
      return res.status(403).json(new ApiResponse (403, null, 'Access denied to comment in admin discussion.' ));
    }

    const newComment = {
      senderId: userId,
      role,
      message,
      createdAt: new Date()
    };

 

    project.adminDiscussion.push(newComment);
    await project.save();

    res.status(200).json(new ApiResponse(200, newComment, 'Admin discussion comment added.'));
  } catch (err) {
   
    logger.error(`Error adding admin discussion comment: ${err.message}`);
    res.status(500).json(new ApiResponse(500, null, 'Failed to add admin discussion comment.'));
  }
};

//to show all comments of a project
const getProjectComments = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate('comments.senderId', 'name email role');
    if (!project) return res.status(404).json(new ApiResponse (404, null, 'Project not found.' ));

    const isAllowed =
      (role === 'student' && project.assignedStudent?.toString() === userId) ||
      (role === 'supervisor' && (
        project.supervisor_first.toString() === userId ||
        project.supervisor_second?.toString() === userId
      ));

    if (!isAllowed) {
           return res.status(403).json(new ApiResponse (403, null, 'Access denied to vieew comment in discussion.' ));
    }

    res.status(200).json(new ApiResponse(200, project.comments, 'Project comments fetched successfully.'));
  } catch (err) {
    console.error('Error fetching project comments:', err);
    logger.error(`Error fetching project comments: ${err.message}`);
    res.status(500).json(new ApiResponse(500, null, 'Failed to fetch project comments.'));
  }
};

//to view admin discussion comments
const getAdminDiscussionComments = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate('adminDiscussion.senderId', 'name email role');
    if (!project) return res.status(404).json(new ApiResponse (404, null, 'Project not found.' ));

    const isAllowed =
      (role === 'admin') ||
      (role === 'supervisor' && (
        project.supervisor_first.toString() === userId ||
        project.supervisor_second?.toString() === userId
      ));

    if (!isAllowed) {
         return res.status(403).json(new ApiResponse (403, null, 'Access denied to vieew comment in discussion.' ));
    }

    res.status(200).json(new ApiResponse(200, project.adminDiscussion, 'Admin discussion comments fetched successfully.'));
  } catch (err) {
    logger.error(`Error fetching admin discussion comments: ${err.message}`);
    res.status(500).json(new ApiResponse(500, null, 'Failed to fetch admin discussion comments.'));
  }
};




module.exports = {
    addCommentToProject,
    addAdminDiscussionComment,
    getProjectComments,
    getAdminDiscussionComments
}