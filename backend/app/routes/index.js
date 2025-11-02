const express = require("express");
const router = express.Router();

//importing the routes here
const authRouter = require('./auth.route');
const userRouter = require('./user.route');
const projectRouter = require('./project.route');
const submissionRouter = require('./submission.route');
const commentRouter = require('./comment.route');
const aiRouter = require('./ai.route');


//defining the routes
router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/project', projectRouter);
router.use('/submission', submissionRouter);
router.use('/comment', commentRouter);
router.use('/ai', aiRouter);

//in case of no route found
router.use((req, res, next) => {
   res.status(404).json({ errors: { msg: 'URL_NOT_FOUND' } });
});

module.exports = router;
