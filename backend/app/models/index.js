const User = require('./user.model');
const Project = require('./project.model');
const Submission = require('./submission.model');
const Messages = require('./message.model');

module.exports = () => {
  return { User, Project, Submission, Messages };
};