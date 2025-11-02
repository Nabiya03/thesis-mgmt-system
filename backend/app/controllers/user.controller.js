const User = require('../models/user.model');
const UserService = require('../services/user.service');
const { ApiResponse } = require('../utils/ApiResponse');
const Project = require('../models/project.model');
const Submission = require('../models/submission.model');

class UserController {
    static async register(req, res, next) {
        try {
            const data = req.body;
            const newUser = await UserService.register(data);
            return res.status(201).json(new ApiResponse(201, newUser, "User registered successfully."));
        } catch (error) {
            next(error);
        }
    }

    static async getAllUsers(req, res, next) {
        try {
          console.log("Get all users request:", req.query);
          if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json(new ApiResponse(403, null, "Access denied. Admins only."));
          }
          
          const { page, limit, type } = req.query;
          const filters = { type }; // any filter fields
          const options = { page, limit };
          const result = await UserService.getAllUsers(filters, options);

            return res.status(200).json(
              new ApiResponse(
                200, {
                  users: result.docs,
                  total: result.totalDocs,
                  page: result.page,
                  totalPages: result.totalPages
                }, "Users retrieved successfully."));
        } catch (error) {
            next(error);
        }
    }

    // Update User Controller
static async updateUser(req, res, next) {
  try {
    const { id } = req.params; // user id in route param
    const data = req.body;

    const updatedUser = await UserService.updateUser(id, data);
    return res.status(200).json(new ApiResponse(200, updatedUser, "User updated successfully."));
  } catch (error) {
    next(error);
  }
}

// Delete User Controller
static async deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    const deletedUser = await UserService.deleteUser(id);
    return res.status(200).json(new ApiResponse(200, deletedUser, "User deleted successfully."));
  } catch (error) {
    next(error);
  }
}

// for dashboard
static async getDashboardStats (req, res, next) {
  try {
    // 1️ Get latest student date and count
    const latestStudent = await User.findOne({ role: "student" })
      .sort({ createdAt: -1 }) // most recent
      .select("createdAt name email");

    if (!latestStudent) {
      return res.status(404).json(new ApiResponse(404, null, "No students found."));
    }

    const latestDate = latestStudent.createdAt.toISOString().split("T")[0]; // only date part
    const studentCount = await User.countDocuments({
      role: "student",
      createdAt: {
        $gte: new Date(latestDate),
        $lt: new Date(new Date(latestDate).getTime() + 24 * 60 * 60 * 1000),
      },
    });

    // 2️ Get latest project details
    const latestProject = await Project.findOne()
      .sort({ createdAt: -1 })
      .populate("supervisor_first", "name") // only fetch supervisor's name
      .select("title supervisor_first createdAt");

    if (!latestProject) {
      return res.status(404).json(new ApiResponse(404, null, "No projects found."));
    }

    // 3️ Count submissions that have no grading + get latest one
    const ungradedSubmissions = await Submission.aggregate([
      { $unwind: "$submissions" },
      {
        $match: {
          $or: [
            { "submissions.grading": { $exists: false } },
            { "submissions.grading": { $size: 0 } }
          ]
        }
      },
      { $sort: { "submissions.createdAt": -1 } }, // latest first
      {
        $project: {
          createdAt: "$submissions.createdAt"
        }
      }
    ]);

    const ungradedCount = ungradedSubmissions.length;
    const latestUngraded = ungradedSubmissions.length > 0 ? ungradedSubmissions[0].createdAt : null;

    // Response
    res.status(200).json(
      new ApiResponse(
        200,
        {
          recentStudents: {
            date: latestDate,
            count: studentCount,
            createdAt: latestStudent.createdAt
          },
          recentProject: {
            title: latestProject.title,
            createdAt: latestProject.createdAt,
            supervisorName: latestProject.supervisor_first?.name || "N/A",
          },
          ungradedSubmissions: {
            count: ungradedCount,
            latestCreatedAt: latestUngraded
          }
        },
        "Dashboard stats fetched successfully."
      )
    );
  } catch (error) {
    next(error);
  }
}


}




module.exports = UserController;