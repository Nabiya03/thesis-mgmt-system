const logger = require('../loggers/winston.logger');
const { ApiError } = require("../utils/ApiError");

const bcrypt = require("bcrypt");
const {User} = require("../models")();


class UserService{
      static async register(payload) {
        try{
            console.log("payload recieved", payload);
            const { name, department, role, email, password } = payload;

        if (!name || !department || !role || !email || !password) {
            throw new ApiError(400, "All fields are required.");
        }

        // Check if user with email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError(409, "Email already exists.");
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save user without uniqueId
        const newUser = await User.create({
            name,
            department,
            role,
            email,
            password: hashedPassword,
        });

        console.log("New user created:", newUser);

        const { customAlphabet } = await import('nanoid');
    const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);


        // Generate and assign a unique user ID
        let uniqueId;
        let exists = true;
        while (exists) {
            uniqueId = nanoid();
            exists = await User.findOne({ uniqueId });
        }
        console.log("Generated uniqueId:", uniqueId);
        
        newUser.uniqueId = uniqueId;
        await newUser.save();

        return newUser;
    } catch (error) {
            logger.error(`User registration failed: ${error.message}`);
            throw new ApiError(500, "User registration failed.");
        }
}
    static async getAllUsers(filters, options) {
        try {
            // const users = await User.find({
            //     role: { $ne: 'admin' } // Exclude admin users
            // }).select('-password'); // Exclude password field
            const query = { role: { $ne: 'admin' } };

            console.log("Filters:", filters);
            console.log("quey:", query);
            if (filters.type) query.type = filters.type;

              const paginateOptions = {
                page: parseInt(options.page) || 1,
                limit: parseInt(options.limit) || 150,
                //sort: { createdAt: -1 },
                 select: '-password', // Exclude the password field
                lean: true,
            };
            console.log("Paginate options:", paginateOptions);

            const users = await User.paginate(query, paginateOptions);
            return users;
        } catch (error) {
            logger.error(`Failed to retrieve users: ${error.message}`);
            throw new ApiError(500, "Failed to retrieve users.");
    }
}

// Update User
static async updateUser(userId, payload) {
  try {
    const { name, department, email, password, role } = payload;
    console.log("payload in edit", payload);
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    // Check email conflict if email is updated
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(409, "Email already exists.");
      }
      user.email = email;
    }

    // Update other fields
    if (name) user.name = name;
    if (department) user.department = department;
    if(role) user.role = role;

    // Update password if provided
    if (password) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
    }

    await user.save();
    return user;
  } catch (error) {
    logger.error(`Failed to update user: ${error.message}`);
    throw new ApiError(500, "Failed to update user.");
  }
}

            // Delete User
static async deleteUser(userId) {
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }
    return user;
  } catch (error) {
    logger.error(`Failed to delete user: ${error.message}`);
    throw new ApiError(500, "Failed to delete user.");
  }
}

}




module.exports = UserService;