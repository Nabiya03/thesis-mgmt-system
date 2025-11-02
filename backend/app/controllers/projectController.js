const Project = require('../models/project.model');
const { ApiResponse } = require('../utils/ApiResponse');
const Calendar = require('../models/calendar.model'); 
const User = require('../models/user.model');
const logger = require('../loggers/winston.logger');
const mongoose = require('mongoose');
const { Parser } = require('json2csv');


exports.createProject = async (req, res, next) => {
  try {
    const { title, description, type } = req.body;
    const supervisor_first = req.user.id;

    if (!title || !description || !type) {
      return res.status(400).json(new ApiResponse(400, null, 'Title, description, and type are required.'));
    }

    const validTypes = ['Research and development', 'Applied'];
    if (!validTypes.includes(type)) {
      return res.status(400).json(new ApiResponse(400, null, 'Type must be "Research and development" or "Applied".'));
    }

    // Step 1: Get supervisor's department
    const supervisor = await User.findById(supervisor_first);
    if (!supervisor || !supervisor.department) {
      return res.status(400).json(new ApiResponse(400, null, 'Supervisor department not found.'));
    }

    // Step 2: Fetch deadlines from Calendar
    const calendar = await Calendar.findOne({ department: supervisor.department });
    if (!calendar || !Array.isArray(calendar.deadlines) || calendar.deadlines.length < 3) {
      return res.status(400).json(new ApiResponse(400, null, 'Could not fetch 3 deadlines for the supervisor\'s department.'));
    }

    // Step 3: Map deadlines to first, second, third
    const sortedDeadlines = [...calendar.deadlines].sort((a, b) => a.submissionNumber - b.submissionNumber);
    const deadlines = {
      first: sortedDeadlines[0]?.deadline,
      second: sortedDeadlines[1]?.deadline,
      third: sortedDeadlines[2]?.deadline
    };

    // Step 4: Create project with deadlines
    const project = new Project({
      title,
      description,
      supervisor_first,
      type,
      department: supervisor.department,
      status: 'available',
      deadlines
    });

    await project.save();

    res.status(201).json(new ApiResponse(201, project, 'Project created successfully with deadlines.'));
  } catch (error) {
    next(error);
  }
};


//admin can update deadlines for the particular project
exports.updateProjectDeadlines = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first, second, third } = req.body;

    // Only admin can update
    if (req.user.role !== 'admin') {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Only admins can update project deadlines.'));
    }

    // Validate at least one field is provided
    if (!first && !second && !third) {
      return res.status(400).json(new ApiResponse(400, null, 'At least one deadline (first, second, or third) must be provided.'));
    }

    // Validate fields (if present)
    const updatedDeadlines = {};
    if (first) {
      const date = new Date(first);
      if (isNaN(date)) {
        return res.status(400).json(new ApiResponse(400, null, 'Invalid "first" deadline.'));
      }
      updatedDeadlines['deadlines.first'] = date;
    }
    if (second) {
      const date = new Date(second);
      if (isNaN(date)) {
        return res.status(400).json(new ApiResponse(400, null, 'Invalid "second" deadline.'));
      }
      updatedDeadlines['deadlines.second'] = date;
    }
    if (third) {
      const date = new Date(third);
      if (isNaN(date)) {
        return res.status(400).json(new ApiResponse(400, null, 'Invalid "third" deadline.'));
      }
      updatedDeadlines['deadlines.third'] = date;
    }

    // Update project
    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updatedDeadlines },
      { new: true }
    );

    if (!project) {
      return res.status(404).json(new ApiResponse(404, null, 'Project not found.'));
    }

    res.status(200).json(new ApiResponse(200, project, 'Project deadlines updated successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.getAllProjects = async (req, res, next) => {
  try {
   const projects = await Project.find().populate('supervisor_first supervisor_second third_marker assignedStudent');

     res.status(200).json(new ApiResponse(200, projects, 'Projects fetched successfully.'));
  } catch (error) {
    logger.error(`Failed to retrieve projects: ${error.message}`);
     next(error);
  }
};

// all projects for supervisor
exports.supervisorProjects = async (req, res, next) => {
  try {
    if (req.user.role !== 'supervisor') {
      return res.status(403).json(new ApiResponse(403, null, 'Not Authorised.'));
    }

    const supervisorId = req.user.id;
    console.log("sup id", supervisorId);

    // Find projects where supervisorId matches in any of the three fields
    const projects = await Project.find({
  $or: [
    { supervisor_first: new mongoose.Types.ObjectId(supervisorId) },
    { supervisor_second: new mongoose.Types.ObjectId(supervisorId) },
    { third_marker: new mongoose.Types.ObjectId(supervisorId) }
  ]
}).select('-adminDiscussion -comments') // Exclude these fields
      .populate('assignedStudent', 'name email') // Only name & email for assigned student
      .lean();

      console.log("projects found..", projects);

    // Add relation & appliedStudentsCount
    const projectsWithMeta = projects.map(project => {
      let relation = null;

      if (project.supervisor_first?.toString() === supervisorId) {
        relation = 'supervisor_first';
      } else if (project.supervisor_second?.toString() === supervisorId) {
        relation = 'supervisor_second';
      } else if (project.third_marker?.toString() === supervisorId) {
        relation = 'third_marker';
      }
      console.log("relation", relation);
      return {
        ...project,
        relation,
        appliedStudentsCount: project.appliedStudents?.length || 0
      };
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        { projects: projectsWithMeta },
        'Supervisor projects retrieved successfully.'
      )
    );

  } catch (error) {
    next(error);
  }
};

//all students who havent been assigned to any project..
exports.getUnassignedStudentsByDepartment = async (req, res, next) => {
  try {
    console.log("req.user", req.user);
   
    const user = await User.findById(req.user.id).select('department');
    const department = user.department;

    // Step 1: Get all assigned student IDs from projects
    const assignedStudentIds = await Project.find(
      { assignedStudent: { $ne: null } },
      { assignedStudent: 1 }
    ).distinct('assignedStudent');
    console.log("asssigned stud ids", assignedStudentIds);

    // Step 2: Get all students in the department that are NOT assigned
    const students = await User.find({
      role: 'student',
      department: department,
      _id: { $nin: assignedStudentIds }
    }).select('name email department');
    console.log("students..", students);

     res.status(200).json(
      new ApiResponse(200, students, 'Unassigned students retrieved successfully.')
    );
  } catch (error) {
   logger.error(`failed to fetch students ${error.message}`);
   next()
  }
};


// all students who haven't been assigned to any project (regardless of department)
exports.getAllUnassignedStudents = async (req, res, next) => {
  try {
    // Step 1: Get all assigned student IDs from projects
    const assignedStudentIds = await Project.find(
      { assignedStudent: { $ne: null } },
      { assignedStudent: 1 }
    ).distinct('assignedStudent');
    console.log("assigned studnt sids ", assignedStudentIds);

    // Step 2: Get all students that are NOT assigned
    const students = await User.find({
      role: 'student',
      _id: { $nin: assignedStudentIds }
    }).select('name email department');
  
    res.status(200).json(
      new ApiResponse(200, students, 'Unassigned students retrieved successfully.')
    );
  } catch (error) {
    logger.error(`Failed to fetch unassigned students: ${error.message}`);
    next(error);
  }
};


// all the supervisors of the department excluding supervisor_second and third_marker of a given project
exports.getAllSupervisorsByDepartment = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json(new ApiResponse(400, null, 'Project ID is required.'));
    }

    // Step 1: Get the current user's department
    const user = await User.findById(req.user.id).select('department');
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, 'User not found.'));
    }

    const department = user.department;

    // Step 2: Get project details to know supervisor_second and third_marker
    const project = await Project.findById(projectId).select('supervisor_second third_marker');
    if (!project) {
      return res.status(404).json(new ApiResponse(404, null, 'Project not found.'));
    }
  
    // Step 3: Build exclusion list
    const excludeIds = [req.user.id]; // exclude the current user
    if (project.supervisor_second) excludeIds.push(project.supervisor_second.toString());
    if (project.third_marker) excludeIds.push(project.third_marker.toString());

   
    // Step 4: Find all supervisors in department excluding above IDs
    const supervisors = await User.find({
      role: 'supervisor',
      department: department,
      _id: { $nin: excludeIds }
    }).select('name email department');

    return res.status(200).json(
      new ApiResponse(200, supervisors, 'All supervisors retrieved successfully.')
    );
  } catch (error) {
    logger.error(`Failed to fetch supervisors: ${error.message}`);
    next(error);
  }
};

//get all the available prokects for the student's department
exports.getAllProjectsForStudent = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json(
        new ApiResponse(403, null, 'Access denied: Student role required')
      );
    }

    // Fetch student details
    const user = await User.findById(req.user.id).select('department');
    if (!user || !user.department) {
      return res.status(404).json(
        new ApiResponse(404, null, 'Department not found for the current student')
      );
    }

    // Find all available projects for this department
    const projects = await Project.find({
      department: user.department,
      status: 'available'
    })
      .select('-adminDiscussion -comments') // exclude sensitive fields
      .populate('supervisor_first', 'name email')
      .populate('supervisor_second', 'name email')
      .populate('third_marker', 'name email')
      .lean();

    // Count total available projects
    const totalProjects = projects.length;
        const projectsWithMeta = projects.map(project => {
    

      return {
        totalProjects: projects.length,
        ...project,
        appliedStudentsCount: project.appliedStudents?.length || 0
      };
    });

    return res.status(200).json(
      new ApiResponse(
        200,{
           project: projectsWithMeta,
        },
       
        'Available projects retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};


exports.getStudentProjects = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Student role required'));
    }
    const studentId = req.user.id;
    const projects = await Project.find({
      $or: [
        { status: 'available' },
        { assignedStudent: studentId }
      ]
    }).populate('supervisor_first supervisor_second assignedStudent');
    res.status(200).json(new ApiResponse(200, projects, 'Projects retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.assignProject = async (req, res, next) => {
  try {
    const {id,  studentId } = req.body;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(new ApiResponse(404, null, 'Project not found.'));
    }
    if (req.user.role === 'student') {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied'));
    }
    if (project.status !== 'available') {
      return res.status(400).json(new ApiResponse(400, null, 'Project is not available for assignment.'));
    }
    
    project.assignedStudent = studentId;
    project.assignedAt = new Date();
    project.status = 'assigned';
    await project.save();

    res.status(200).json(new ApiResponse(200, project, 'Project assigned successfully.'));
  } catch (error) {
    next(error);
  }
};

//teacher can add second supervisor to the project
exports.addSecondSupervisor = async (req, res, next) => {
  try {
    const { id } = req.params;
 
    const { secondSupervisorId } = req.body;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(new ApiResponse(404, null, 'Project not found.'));
    }
    if (req.user.role !== 'supervisor' || project.supervisor_first.toString() !== req.user.id) {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Only the first supervisor can add a second supervisor.'));
    }
    if (project.supervisor_second) {
      return res.status(400).json(new ApiResponse(400, null, 'Second supervisor already assigned.'));
    }
    project.supervisor_second = secondSupervisorId;
    await project.save();
    res.status(200).json(new ApiResponse(200, project, 'Second supervisor added successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.addthirdMarker = async (req, res, next) => {
  try {
    const { id } = req.params;
   
    const { thirdMarkerId } = req.body;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(new ApiResponse(404, null, 'Project not found.'));
    }
   
    project.third_marker = thirdMarkerId;
    await project.save();
    res.status(200).json(new ApiResponse(200, project, 'Second supervisor added successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.getProjectDetails = async (req, res, next) => {
  try {
    console.log("inside project details function");
    const { id } = req.params;
    const project = await Project.findById(id)
                    .select('-adminDiscussion -comments')
                    .populate('supervisor_first supervisor_second assignedStudent')
                    .populate('appliedStudents', 'name email');

    if (!project) {
      return res.status(404).json(new ApiResponse(404, null, 'Project not found.'));
    }
    if (req.user.role === 'student' && project.assignedStudent && project.assignedStudent._id.toString() !== req.user.id) {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Project not assigned to this student.'));
    }
    const userId = req.user.id;
    console.log("user id", userId);
    console.log("user id in field", project.supervisor_first._id);
    let relation = null;

      if (project.supervisor_first?._id.toString() === userId) {
        relation = 'supervisor_first';
        console.log("relation", relation);
      } else if (project.supervisor_second?._id.toString() === userId) {
        relation = 'supervisor_second';
      } else if (project.third_marker?._id.toString() === userId) {
        relation = 'third_marker';
      }
        const appliedStudentsCount = project.appliedStudents?.length || 0;

    // Merge everything into one object
    const projectDetails = {
      ...project.toObject(),
      relation,
      appliedStudentsCount
    };

    res.status(200).json(new ApiResponse(200, projectDetails, 'Project details retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.getProjectDetailsStudent = async (req, res, next) => {
  try {
    const  studentId  = req.user.id; // or req.body

    const { id } = req.params;
 
      const project = await Project.findOne({ assignedStudent: studentId })
                    .select('-adminDiscussion -comments')
                    .populate('supervisor_first supervisor_second assignedStudent')
                    .populate('supervisor_first', 'name email')
                    .populate('supervisor_second', 'name email')
                    .populate('appliedStudents', 'name email');

    if (!project) {
      return res.status(404).json(new ApiResponse(404, null, 'Project not found.'));
    }
    if (req.user.role === 'student' && project.assignedStudent && project.assignedStudent._id.toString() !== req.user.id) {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Project not assigned to this student.'));
    }
    const userId = req.user.id;
    
    let relation = null;

      if (project.supervisor_first?._id.toString() === userId) {
        relation = 'supervisor_first';
        console.log("relation", relation);
      } else if (project.supervisor_second?._id.toString() === userId) {
        relation = 'supervisor_second';
      } else if (project.third_marker?._id.toString() === userId) {
        relation = 'third_marker';
      }
        const appliedStudentsCount = project.appliedStudents?.length || 0;

    // Merge everything into one object
    const projectDetails = {
      ...project.toObject(),
      relation,
      appliedStudentsCount
    };

    res.status(200).json(new ApiResponse(200, projectDetails, 'Project details retrieved successfully.'));
  } catch (error) {
    logger.error(`error in fetching details.. ${error.message}`);
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(new ApiResponse(404, null, 'Project not found.'));
    }
    if (req.user.role === 'supervisor' && project.supervisor_first.toString() !== req.user.id) {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Only the supervisor can update this project.'));
    }
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Only supervisors or admins can update projects.'));
    }

    if (title) project.title = title;
    if (description) project.description = description;
    if (status && ['available', 'assigned'].includes(status)) project.status = status;
    await project.save();

    res.status(200).json(new ApiResponse(200, project, 'Project updated successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.applyToProject = async (req, res, next) => {
  try {
    
    const { id } = req.body;
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(new ApiResponse(404, null, 'Project not found.'));
    }
    if (req.user.role !== 'student') {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Only students can apply to projects.'));
    }
    if (project.status !== 'available') {
      return res.status(400).json(new ApiResponse(400, null, 'Project is not available for application.'));
    }
    if (project.assignedStudent) {
      return res.status(400).json(new ApiResponse(400, null, 'Project is already assigned.'));
    }
    if (project.appliedStudents.includes(req.user.id)) {
      return res.status(409).json(new ApiResponse(409, null, 'You have already applied to this project.'));
    }

    project.appliedStudents.push(req.user.id);
    await project.save();

    res.status(200).json(new ApiResponse(200, project, 'Application submitted successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.getProjectApplications = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate('appliedStudents');
    if (!project) {
      return res.status(404).json(new ApiResponse(404, null, 'Project not found.'));
    }
    if (req.user.role !== 'supervisor' || project.supervisor_first.toString() !== req.user.id) {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Only the supervisor can view applications.'));
    }
    res.status(200).json(new ApiResponse(200, project.appliedStudents, 'Applications retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.createCalendar = async (req, res, next) => {
  try {
    const { department, deadlines } = req.body;
    if (!department || !deadlines || !Array.isArray(deadlines)) {
      return res.status(400).json(new ApiResponse(400, null, 'Department and deadlines array are required.'));
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Only admins can manage calendars.'));
    }
    if (deadlines.length > 3) {
      return res.status(400).json(new ApiResponse(400, null, 'Maximum of 3 deadlines allowed.'));
    }
    const validDeadlines = deadlines.map((d, index) => ({
      submissionNumber: index + 1,
      deadline: new Date(d.deadline).toISOString(),
    })).filter(d => d.deadline); // Validate dates
    if (validDeadlines.length !== deadlines.length) {
      return res.status(400).json(new ApiResponse(400, null, 'Invalid deadline format. Use ISO date strings (e.g., "2025-08-01T23:59:59Z").'));
    }

    let calendar = await Calendar.findOne({ department });
    if (calendar) {
      calendar.deadlines = validDeadlines;
    } else {
      calendar = new Calendar({ department, deadlines: validDeadlines });
    }
    await calendar.save();

    res.status(200).json(new ApiResponse(200, calendar, 'Calendar updated successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.getCalendar = async (req, res, next) => {
  try {
    const { department } = req.params;
    if (!department) {
      return res.status(400).json(new ApiResponse(400, null, 'Department is required.'));
    }
    const calendar = await Calendar.findOne({ department }).populate('deadlines');
    if (!calendar) {
      return res.status(404).json(new ApiResponse(404, null, 'Calendar not found for this department.'));
    }
    res.status(200).json(new ApiResponse(200, calendar, 'Calendar retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};

exports.getAllCalendars = async (req, res, next) => {
  try {
  
    if (req.user.role !== 'admin') {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Only admins can view all calendars.'));
    }
    console.log('User role:', req.user.role);
    const calendars = await Calendar.find();
    res.status(200).json(new ApiResponse(200, calendars, 'All calendars retrieved successfully.'));
  } catch (error) {
    next(error);
  }
};


exports.updateDeadline = async (req, res, next) => {
  try {
    const { department, submissionNumber, deadline } = req.body;

    if (!deadline) {
      return res.status(400).json(new ApiResponse(400, null, "Deadline is required."));
    }

    if (req.user.role !== "admin") {
      return res.status(403).json(new ApiResponse(403, null, "Only admins can update deadlines."));
    }

    // Step 1: Update Calendar deadline
    const calendar = await Calendar.findOneAndUpdate(
      { department, "deadlines.submissionNumber": parseInt(submissionNumber) },
      { $set: { "deadlines.$.deadline": new Date(deadline).toISOString() } },
      { new: true }
    );

    if (!calendar) {
      return res.status(404).json(new ApiResponse(404, null, "Calendar or deadline not found."));
    }

    //  Step 2: Update all Projects for that department
    let deadlineField;
    if (parseInt(submissionNumber) === 1) deadlineField = "deadlines.first";
    else if (parseInt(submissionNumber) === 2) deadlineField = "deadlines.second";
    else if (parseInt(submissionNumber) === 3) deadlineField = "deadlines.third";

    if (!deadlineField) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid submission number."));
    }

    await Project.updateMany(
      { department },
      { $set: { [deadlineField]: new Date(deadline).toISOString() } }
    );

    res.status(200).json(new ApiResponse(200, calendar, "Deadline updated successfully and synced to projects."));

  } catch (error) {
    next(error);
  }
};


exports.exportAssignedStudentsCSV = async (req, res, next) => {
  try {
    // Role check
    if (req.user.role !== 'supervisor') {
      return res.status(403).json(new ApiResponse(403, null, 'Access denied: Only supervisors can export student data.'));
    }

    const supervisorId = req.user.id;

    // Fetch projects where this supervisor is first or second supervisor
    const projects = await Project.find({
      $or: [
        { supervisor_first: supervisorId },
        { supervisor_second: supervisorId }
      ],
      assignedStudent: { $ne: null } // only projects with assigned students
    }).populate('assignedStudent', 'name email');

    if (!projects.length) {
      return res.status(404).json(new ApiResponse(404, null, 'No assigned students found.'));
    }

    // Extract unique students
    const studentMap = new Map();
    projects.forEach(p => {
      if (p.assignedStudent) {
        studentMap.set(p.assignedStudent._id.toString(), {
          name: p.assignedStudent.name,
          email: p.assignedStudent.email
        });
      }
    });

    const students = Array.from(studentMap.values());

    // Convert to CSV
    const json2csvParser = new Parser({ fields: ['name', 'email'] });
    const csv = json2csvParser.parse(students);

   // Force download
res.setHeader('Content-Type', 'text/csv');
res.setHeader(
  'Content-Disposition',
  `attachment; filename="assigned_students_${Date.now()}.csv"`
);

// Instead of res.end(csv), use send with buffer
return res.status(200).send(Buffer.from(csv, 'utf-8'));

  } catch (error) {
    logger.error(`Error exporting assigned students: ${error.message}`);
    next(error);
  }
};


exports.getAllUser = async (req, res, next) => {
  try {
    // Fetch all users (excluding password)
    const users = await User.find().select('-password');

    // Count total users
    const totalUsers = await User.countDocuments();

    // Count users by role
    const roleCounts = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    // Transform into an object { student: X, admin: Y, supervisor: Z }
    const roleSummary = roleCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { student: 0, admin: 0, supervisor: 0 });

    res.status(200).json(
      new ApiResponse(200, {
        totalUsers,
        roleSummary
      }, "Users retrieved successfully")
    );
  } catch (error) {
    next(new ApiError(500, null, "Failed to retrieve users"));
  }
};


exports.getAllSupervisors = async (req, res, next) => {
  try {
    // Find all supervisors, return only name, email, department
    const supervisors = await User.find({ role: 'supervisor' })
      .select('name email department');

    const totalSupervisors = supervisors.length;

    res.status(200).json(
      new ApiResponse(200, 
     
        supervisors
      , "Supervisors retrieved successfully")
    );
  } catch (error) {
    next(new ApiError(500, null, "Failed to retrieve supervisors"));
  }
};
