const { OpenAI } = require("openai");
const Conversation = require("../models/conversation.model");
const SavedTask = require("../models/savedtask.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
const logger = require("../loggers/winston.logger");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function detectModeRuleBased(prompt) {
  const text = prompt.toLowerCase();

  const taskKeywords = [
    "break down", "step by step", "divide into steps", "roadmap",
    "timeline", "generate tasks", "action plan", "milestones",
    "plan my", "outline the steps", "how to complete",
    "work plan", "approach", "schedule", "project phases"
  ];

  const explainKeywords = [
    "what is", "explain", "define", "meaning of", "definition of",
    "overview of", "in simple terms", "describe", "tell me about",
    "how does", "importance of", "advantages and disadvantages",
    "pros and cons"
  ];

  const matches = { task: 0, explain: 0 };

  taskKeywords.forEach(word => { if (text.includes(word)) matches.task++; });
  explainKeywords.forEach(word => { if (text.includes(word)) matches.explain++; });

  if (matches.task > 1) return "task";
  if (matches.explain > 1) return "explain";
  return null;
}

async function detectModeAI(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system",
        content: "You are a mode classifier. Classify the following prompt into one of: TASK, EXPLAIN, CHAT. Return only one word. If the prompt asks you to write or produce a part of a thesis, but not break it into steps, treat it as EXPLAIN. TASK is only for breaking a larger goal into smaller steps with order and difficulty." 
      },
      { role: "user", content: prompt }
    ],
    temperature: 0
  });

  return response.choices[0].message.content.trim().toLowerCase();
}

// Main AI Request Handler
exports.handleAIRequest = async (req, res, next) => {
  try {
    const { prompt, conversationId } = req.body;
    const { id: studentId } = req.user;

    if (!prompt) throw new ApiError("Prompt is required", 400);

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ 
        _id: conversationId, 
        studentId,
        isActive: true 
      });
      if (!conversation) {
        throw new ApiError("Conversation not found", 404);
      }
    } else {
      conversation = new Conversation({ 
        studentId,
        title: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt,
        messages: []
      });
    }

    // Add user message to conversation
    conversation.messages.push({
      content: prompt,
      sender: 'user',
      messageType: 'chat'
    });

    // Detect mode
    let mode = detectModeRuleBased(prompt);
    console.log("Detected mode:", mode);

    if (!mode) {
      mode = await detectModeAI(prompt);
      console.log("AI classified mode:", mode);
    }

    // Select system prompt
    const systemMessage = {
      task: `You are an academic task planner. Break the user goal into step-by-step subtasks. 
             Return a JSON object with this structure:
             {
               "title": "Brief title for the goal",
               "tasks": [
                 {
                   "id": 1,
                   "text": "Task description",
                   "priority": "high|medium|low",
                   "estimatedTime": "2-4 hours",
                   "category": "writing|research|development|analysis|planning"
                 }
               ]
             }`,
      explain: "You are an academic tutor. Explain the concept clearly and comprehensively for a student audience. Provide detailed explanations with examples where appropriate.",
      chat: "You are a helpful academic assistant. Answer the question naturally and conversationally."
    }[mode] || "You are a helpful academic assistant. Answer the question naturally and conversationally.";

    // Get AI response
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    const aiText = response.choices[0].message.content;

    // Handle different response types
    if (mode === "task") {
      try {
        const taskData = JSON.parse(aiText);
        
        // Add assistant message with task type
        conversation.messages.push({
          content: JSON.stringify(taskData),
          sender: 'assistant',
          messageType: 'task'
        });

        await conversation.save();

        return res.status(200).json(new ApiResponse(200, {
          type: "task",
          response: taskData,
          conversationId: conversation._id,
          messageId: conversation.messages[conversation.messages.length - 1]._id
        }, 'Task breakdown generated successfully'));

      } catch (error) {
        // If JSON parsing fails, treat as regular response
        conversation.messages.push({
          content: aiText,
          sender: 'assistant',
          messageType: 'task'
        });

        await conversation.save();

        return res.status(200).json(new ApiResponse(200, {
          type: "task",
          response: aiText,
          conversationId: conversation._id,
          messageId: conversation.messages[conversation.messages.length - 1]._id
        }, 'Task response generated successfully'));
      }
    } else {
      // Handle chat and explain responses
      conversation.messages.push({
        content: aiText,
        sender: 'assistant',
        messageType: mode
      });

      await conversation.save();

      return res.status(200).json(new ApiResponse(200, {
        type: mode,
        response: aiText,
        conversationId: conversation._id,
        messageId: conversation.messages[conversation.messages.length - 1]._id
      }, `${mode} response generated successfully`));
    }

  } catch (err) {
    logger.error(`AI processing failed: ${err.message}`);
    next(new ApiError("AI processing failed", 500));
  }
};

// Get Conversations
exports.getConversations = async (req, res, next) => {
  try {
    const { id: studentId } = req.user;
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({ 
      studentId, 
      isActive: true 
    })
    .sort({ lastActivity: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('title lastActivity messages')
    .lean();

    // Add message count and last message preview
    const conversationsWithPreview = conversations.map(conv => ({
      ...conv,
      messageCount: conv.messages.length,
      lastMessage: conv.messages[conv.messages.length - 1]?.content.substring(0, 100) + '...' || '',
      lastMessageType: conv.messages[conv.messages.length - 1]?.messageType || 'chat'
    }));

    res.status(200).json(new ApiResponse(200, conversationsWithPreview, 'Conversations fetched successfully'));
  } catch (err) {
    logger.error(`Failed to fetch conversations: ${err.message}`);
    next(new ApiError("Failed to fetch conversations", 500));
  }
};

// Get Single Conversation
exports.getConversation = async (req, res, next) => {
  try {
    const { id: studentId } = req.user;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({ 
      _id: conversationId, 
      studentId,
      isActive: true 
    });

    if (!conversation) {
      throw new ApiError("Conversation not found", 404);
    }

    res.status(200).json(new ApiResponse(200, conversation, 'Conversation fetched successfully'));
  } catch (err) {
    logger.error(`Failed to fetch conversation: ${err.message}`);
    next(new ApiError("Failed to fetch conversation", 500));
  }
};

// Save Task
exports.saveTask = async (req, res, next) => {
  try {
    const { id: studentId } = req.user;
    const { taskData, title, tags, dueDate, notes } = req.body;

    if (!taskData || !taskData.tasks) {
      throw new ApiError("Task data is required", 400);
    }

    const savedTask = new SavedTask({
      studentId,
      originalPrompt: taskData.originalPrompt || 'Generated task',
      title: title || taskData.title || 'My Task Plan',
      tasks: taskData.tasks,
      tags: tags || [],
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || ''
    });

    await savedTask.save();

    res.status(201).json(new ApiResponse(201, savedTask, 'Task saved successfully'));
  } catch (err) {
    logger.error(`Failed to save task: ${err.message}`);
    next(new ApiError(500, null, "Failed to save task"));
  }
};

// Get Saved Tasks
exports.getSavedTasks = async (req, res, next) => {
  try {
    const { id: studentId } = req.user;
    const { page = 1, limit = 10, status, tag } = req.query;

    let filter = { studentId };
    if (status === 'completed') filter.isCompleted = true;
    if (status === 'pending') filter.isCompleted = false;
    if (tag) filter.tags = tag;

    const tasks = await SavedTask.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await SavedTask.countDocuments(filter);

    res.status(200).json(new ApiResponse(200, {
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, 'Tasks fetched successfully'));
  } catch (err) {
    logger.error(`Failed to fetch tasks: ${err.message}`);
    next(new ApiError("Failed to fetch tasks", 500));
  }
};

// Update Task Progress
exports.updateTaskProgress = async (req, res, next) => {
  try {
    const { id: studentId } = req.user;
    const { taskId } = req.params;
    const { taskItemId, completed, notes } = req.body;

    const savedTask = await SavedTask.findOne({ _id: taskId, studentId });
    if (!savedTask) {
      throw new ApiError("Task not found", 404);
    }

    const taskItem = savedTask.tasks.find(t => t.id === parseInt(taskItemId));
    if (!taskItem) {
      throw new ApiError("Task item not found", 404);
    }

    taskItem.completed = completed;
    if (notes !== undefined) {
      savedTask.notes = notes;
    }

    await savedTask.save();

    res.status(200).json(new ApiResponse(200, savedTask, 'Task progress updated successfully'));
  } catch (err) {
    logger.error(`Failed to update task progress: ${err.message}`);
    next(new ApiError("Failed to update task progress", 500));
  }
};

// Delete Conversation
exports.deleteConversation = async (req, res, next) => {
  try {
    const { id: studentId } = req.user;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, studentId },
      { isActive: false },
      { new: true }
    );

    if (!conversation) {
      throw new ApiError("Conversation not found", 404);
    }

    res.status(200).json(new ApiResponse(200, null, 'Conversation deleted successfully'));
  } catch (err) {
    logger.error(`Failed to delete conversation: ${err.message}`);
    next(new ApiError("Failed to delete conversation", 500));
  }
};


// Get Task Statistics
exports.getTaskStats = async (req, res, next) => {
  try {
    const { id: studentId } = req.user;

    const stats = await SavedTask.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: ['$isCompleted', 1, 0] } },
          totalTaskItems: { $sum: '$progress.total' },
          completedTaskItems: { $sum: '$progress.completed' },
          avgProgress: { $avg: '$progress.percentage' }
        }
      }
    ]);

    const tagStats = await SavedTask.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const categoryStats = await SavedTask.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      { $unwind: '$tasks' },
      { $group: { _id: '$tasks.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json(new ApiResponse(200, {
      overview: stats[0] || {
        totalTasks: 0,
        completedTasks: 0,
        totalTaskItems: 0,
        completedTaskItems: 0,
        avgProgress: 0
      },
      tagStats,
      categoryStats
    }, 'Task statistics fetched successfully'));

  } catch (err) {
    logger.error(`Failed to fetch task stats: ${err.message}`);
    next(new ApiError("Failed to fetch task statistics", 500));
  }
};

// Delete Task
exports.deleteTask = async (req, res, next) => {
  try {
    const { id: studentId } = req.user;
    const { taskId } = req.params;

    const task = await SavedTask.findOneAndDelete({ _id: taskId, studentId });
    
    if (!task) {
      throw new ApiError("Task not found", 404);
    }

    res.status(200).json(new ApiResponse(200, null, 'Task deleted successfully'));
  } catch (err) {
    logger.error(`Failed to delete task: ${err.message}`);
    next(new ApiError("Failed to delete task", 500));
  }
};

// Update Task Details
exports.updateTask = async (req, res, next) => {
  try {
    const { id: studentId } = req.user;
    const { taskId } = req.params;
    const { title, tags, dueDate, notes } = req.body;

    const task = await SavedTask.findOne({ _id: taskId, studentId });
    if (!task) {
      throw new ApiError("Task not found", 404);
    }

    if (title) task.title = title;
    if (tags !== undefined) task.tags = tags;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
    if (notes !== undefined) task.notes = notes;

    await task.save();

    res.status(200).json(new ApiResponse(200, task, 'Task updated successfully'));
  } catch (err) {
    logger.error(`Failed to update task: ${err.message}`);
    next(new ApiError("Failed to update task", 500));
  }
};

// Search Conversations
exports.searchConversations = async (req, res, next) => {
  try {
    const { id: studentId } = req.user;
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      throw new ApiError("Search query is required", 400);
    }

    const searchRegex = new RegExp(q, 'i');
    
    const conversations = await Conversation.find({
      studentId,
      isActive: true,
      $or: [
        { title: searchRegex },
        { 'messages.content': searchRegex }
      ]
    })
    .sort({ lastActivity: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('title lastActivity messages');

    res.status(200).json(new ApiResponse(200, conversations, 'Search results fetched successfully'));
  } catch (err) {
    logger.error(`Search failed: ${err.message}`);
    next(new ApiError("Search failed", 500));
  }
};
