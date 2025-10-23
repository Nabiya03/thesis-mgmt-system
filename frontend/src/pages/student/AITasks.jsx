
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageCircle, 
  Target, 
  CheckSquare, 
  Square, 
  Clock, 
  Star,
  Save,
  Trash2,
  Filter,
  Plus,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle,
  X
} from 'lucide-react';
import { API_BASE_URL } from "../../constants/ApiConstants";

// Dialog Component
const Dialog = ({ message, type = 'success', onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            {type === 'success' ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <X className="h-8 w-8 text-red-600" />
            )}
          </div>
          <div className="ml-3">
            <h3 className={`text-lg font-medium ${
              type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {type === 'success' ? 'Success!' : 'Error!'}
            </h3>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              type === 'success' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Function to render text with bold formatting
const renderTextWithBold = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Split by **text** pattern and render with bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove the ** markers and make it bold
      const boldText = part.slice(2, -2);
      return <strong key={index} className="font-semibold">{boldText}</strong>;
    }
    return part;
  });
};

const AIAssistant = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [savedTasks, setSavedTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [showTaskSaveModal, setShowTaskSaveModal] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');
  const [dialog, setDialog] = useState(null); // New state for dialog
  
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // API base URL - adjust according to your setup
  const API_BASE = API_BASE_URL;
  
  useEffect(() => {
    fetchConversations();
    fetchSavedTasks();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to show dialog instead of alert
  const showDialog = (message, type = 'success') => {
    setDialog({ message, type });
  };

  const closeDialog = () => {
    setDialog(null);
  };

  // API calls
  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      showDialog('Failed to fetch conversations. Please try again.', 'error');
    }
  };

  const fetchSavedTasks = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai/tasks?status=${taskFilter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSavedTasks(data.data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      showDialog('Failed to fetch tasks. Please try again.', 'error');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          conversationId: currentConversation?._id
        })
      });
      console.log("response ", response);

      const data = await response.json();
      
      if (data.success) {
        // Update current conversation or create new one
        if (data.data.conversationId) {
          await fetchConversationById(data.data.conversationId);
        }
        
        // Handle task responses
        if (data.data.type === 'task') {
          setPendingTaskData({
            ...data.data.response,
            originalPrompt: prompt
          });
          setShowTaskSaveModal(true);
        }
        
        setPrompt('');
        fetchConversations(); // Refresh conversations list
      } else {
        showDialog('Failed to send message. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showDialog('Failed to send message. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationById = async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE}/ai/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCurrentConversation(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      showDialog('Failed to fetch conversation. Please try again.', 'error');
    }
  };

  const saveTask = async (taskSaveData) => {
    try {
      const response = await fetch(`${API_BASE}/ai/tasks/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          taskData: pendingTaskData,
          ...taskSaveData
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowTaskSaveModal(false);
        setPendingTaskData(null);
        fetchSavedTasks();
        showDialog('Task saved successfully!', 'success');
      } else {
        showDialog('Failed to save task. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      showDialog('Failed to save task. Please try again.', 'error');
    }
  };

  const updateTaskProgress = async (taskId, taskItemId, completed) => {
    try {
      const response = await fetch(`${API_BASE}/ai/tasks/${taskId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          taskItemId,
          completed
        })
      });

      const data = await response.json();
      if (data.success) {
        fetchSavedTasks();
        showDialog('Task progress updated successfully!', 'success');
      } else {
        showDialog('Failed to update task progress. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Failed to update task progress:', error);
      showDialog('Failed to update task progress. Please try again.', 'error');
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    chatInputRef.current?.focus();
  };

  const selectConversation = (conversation) => {
    setCurrentConversation(conversation);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      writing: '✍️',
      research: '🔍',
      development: '💻',
      analysis: '📊',
      planning: '📋'
    };
    return icons[category] || '📋';
  };

  const renderMessage = (message, index) => {
    const isUser = message.sender === 'user';
    
    return (
      <div key={message._id || index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-3xl px-4 py-3 rounded-lg ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-900'
        }`}>
          {message.messageType === 'task' && !isUser ? (
            <TaskPreview 
              taskData={typeof message.content === 'string' ? JSON.parse(message.content) : message.content}
              onSave={() => {
                setPendingTaskData({
                  ...JSON.parse(message.content),
                  originalPrompt: 'From conversation'
                });
                setShowTaskSaveModal(true);
              }}
            />
          ) : (
            <div className="whitespace-pre-wrap">
              {renderTextWithBold(message.content)}
            </div>
          )}
          <div className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'chat' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'tasks' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tasks
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chat' ? (
            <div className="p-4">
              <button
                onClick={startNewConversation}
                className="w-full mb-4 flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Chat</span>
              </button>
              
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation._id}
                    onClick={() => selectConversation(conversation)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentConversation?._id === conversation._id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">
                      {conversation.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(conversation.lastActivity).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4">
              {/* Task Filter */}
              <div className="mb-4">
                <select
                  value={taskFilter}
                  onChange={(e) => {
                    setTaskFilter(e.target.value);
                    fetchSavedTasks();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Tasks</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Saved Tasks */}
              <div className="space-y-3">
                {savedTasks.map((task) => (
                  <SavedTaskCard
                    key={task._id}
                    task={task}
                    onUpdateProgress={updateTaskProgress}
                    onRefresh={fetchSavedTasks}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentConversation?.title || 'New Conversation'}
          </h2>
         
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentConversation?.messages?.length > 0 ? (
            <>
              {currentConversation.messages.map((message, index) => renderMessage(message, index))}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a new conversation</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Ask anything about your academic work, request task breakdowns, or get explanations on complex topics.
                </p>
                
                {/* Example Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {[
                    'Break down my thesis writing into manageable tasks',
                    'Explain machine learning concepts in simple terms',
                    'Help me plan my research methodology',
                    'Create a literature review timeline'
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                    >
                      <div className="flex items-start space-x-2">
                        <Star className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{example}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <div className="flex-1">
              <textarea
                ref={chatInputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask me anything about your academic work..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{loading ? 'Sending...' : 'Send'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Task Save Modal */}
      {showTaskSaveModal && pendingTaskData && (
        <TaskSaveModal
          taskData={pendingTaskData}
          onSave={saveTask}
          onClose={() => {
            setShowTaskSaveModal(false);
            setPendingTaskData(null);
          }}
        />
      )}

      {/* Custom Dialog */}
      {dialog && (
        <Dialog
          message={dialog.message}
          type={dialog.type}
          onClose={closeDialog}
        />
      )}
    </div>
  );
};

// Saved Task Card Component
const SavedTaskCard = ({ task, onUpdateProgress, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleTaskToggle = async (taskId, taskItemId, completed) => {
    setUpdating(true);
    try {
      await onUpdateProgress(taskId, taskItemId, completed);
      await onRefresh(); // Refresh to get updated data
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      {/* Task Header */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm truncate">{task.title}</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs rounded-full ${
              task.isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {task.progress?.percentage || 0}%
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${task.progress?.percentage || 0}%` }}
          />
        </div>
        <div className="text-xs text-gray-500">
          {task.progress?.completed || 0} of {task.progress?.total || 0} tasks completed
        </div>
      </div>

      {/* Expanded Task Details */}
      {expanded && task.tasks && (
        <div className="border-t border-gray-200 p-3">
          <div className="space-y-2">
            {task.tasks.map((taskItem, index) => (
              <div
                key={taskItem.id || index}
                className={`flex items-start space-x-3 p-2 rounded transition-colors ${
                  taskItem.completed ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <button
                  onClick={() => handleTaskToggle(task._id, taskItem.id, !taskItem.completed)}
                  className="mt-1 hover:scale-105 transition-transform"
                  disabled={updating}
                >
                  {taskItem.completed ? (
                    <CheckSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs transition-all ${
                    taskItem.completed 
                      ? 'text-green-900 line-through opacity-75' 
                      : 'text-gray-900'
                  }`}>
                    {taskItem.text}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      taskItem.priority === 'high' ? 'bg-red-100 text-red-800' :
                      taskItem.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {taskItem.priority}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{taskItem.estimatedTime}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Task Preview Component
const TaskPreview = ({ taskData, onSave, isFromSavedTask = false, taskId = null, onUpdateProgress = null }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [taskStates, setTaskStates] = useState({});
  const [updating, setUpdating] = useState(false);

  // Initialize task states
  useEffect(() => {
    if (taskData?.tasks) {
      const initialStates = {};
      taskData.tasks.forEach(task => {
        initialStates[task.id || Math.random()] = task.completed || false;
      });
      setTaskStates(initialStates);
    }
  }, [taskData]);

  const toggleTaskComplete = async (taskItemId) => {
    if (isFromSavedTask && onUpdateProgress && taskId) {
      // This is a saved task - call API to update
      setUpdating(true);
      try {
        const currentState = taskStates[taskItemId] || false;
        await onUpdateProgress(taskId, taskItemId, !currentState);
        // Update local state after successful API call
        setTaskStates(prev => ({
          ...prev,
          [taskItemId]: !currentState
        }));
      } catch (error) {
        console.error('Failed to update task:', error);
      } finally {
        setUpdating(false);
      }
    } else {
      // This is a preview task - just update local state
      setTaskStates(prev => ({
        ...prev,
        [taskItemId]: !prev[taskItemId]
      }));
    }
  };

  const tasksToShow = showAllTasks ? taskData?.tasks || [] : (taskData?.tasks || []).slice(0, 3);
  const hasMoreTasks = (taskData?.tasks?.length || 0) > 3;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 my-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
          <Target className="h-4 w-4" />
          <span>{taskData?.title || 'Task Breakdown'}</span>
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <>
          <div className="space-y-2 mb-4">
            {tasksToShow.map((task, index) => {
              const taskItemId = task.id || `task-${index}`;
              const isCompleted = taskStates[taskItemId] || false;
              
              return (
                <div key={taskItemId} className={`flex items-start space-x-3 p-2 rounded transition-colors ${
                  isCompleted ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <button
                    onClick={() => toggleTaskComplete(taskItemId)}
                    className="mt-1 hover:scale-105 transition-transform"
                    disabled={updating}
                  >
                    {isCompleted ? (
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm transition-all ${
                      isCompleted 
                        ? 'text-green-900 line-through opacity-75' 
                        : 'text-gray-900'
                    }`}>
                      {task.text}
                    </p>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimatedTime}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {hasMoreTasks && !showAllTasks && (
              <button
                onClick={() => setShowAllTasks(true)}
                className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              >
                Show {(taskData?.tasks?.length || 0) - 3} more tasks...
              </button>
            )}
            
            {showAllTasks && hasMoreTasks && (
              <button
                onClick={() => setShowAllTasks(false)}
                className="w-full text-center py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                Show less
              </button>
            )}
          </div>

          {/* Show Save button only for preview tasks, not saved tasks */}
          {!isFromSavedTask && (
            <div className="border-t pt-3">
              <button
                onClick={onSave}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Save className="h-4 w-4" />
                <span>Save Task Plan</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Task Save Modal Component
const TaskSaveModal = ({ taskData, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: taskData.title || '',
    tags: '',
    dueDate: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Save Task Plan</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="research, thesis, urgent"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date (optional)
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Task Detail Panel Component
const TaskDetailPanel = ({ savedTasks, onUpdateProgress, onRefresh }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);

  if (!selectedTask && savedTasks.length > 0) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <h3 className="font-medium text-gray-900 mb-4">Task Details</h3>
        <p className="text-gray-600 text-sm">Select a task to view details</p>
      </div>
    );
  }

  if (selectedTask) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">{selectedTask.title}</h3>
            <button
              onClick={() => setSelectedTask(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ×
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${selectedTask.progress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600">
            {selectedTask.progress.completed} of {selectedTask.progress.total} completed
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {selectedTask.tasks.map((task) => (
              <div
                key={task.id}
                className={`p-3 rounded-lg border transition-colors ${
                  task.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => onUpdateProgress(selectedTask._id, task.id, !task.completed)}
                    className="mt-1"
                  >
                    {task.completed ? (
                      <CheckSquare className="h-4 w-4 text-green-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${
                      task.completed 
                        ? 'text-green-900 line-through' 
                        : 'text-gray-900'
                    }`}>
                      {task.text}
                    </p>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full border ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800 border-red-300' :
                        task.priority === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-green-100 text-green-800 border-green-300'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimatedTime}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AIAssistant;