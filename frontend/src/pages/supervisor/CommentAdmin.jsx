import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, User, Clock, RefreshCw } from 'lucide-react';
import {sendMessageAdmin, viewMessageAdmin} from '../../api/userService';

function AdminDiscussionTab({ projectId, currentUserRole, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  useEffect(() => {
    if (projectId) {
      fetchMessages();
    }
  }, [projectId]);

  // Fetch messages from API
  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await viewMessageAdmin(projectId);

      if (!response.data.success) {
        throw new Error('Failed to fetch messages');
      }
      
      if (response.data.success && response.data.data) {
        // Transform API response to match component structure
        const transformedComments = response.data.data.map((message, index) => ({
          id: index,
          author: message.senderId.name,
          role: message.senderId.role,
          senderId: message.senderId._id || message.senderId.id, // Get the actual user ID
          message: message.message,
          timestamp: formatTimestamp(message.createdAt),
          // Check if this message is from the current user (regardless of role)
          isOwnMessage: (message.senderId._id || message.senderId.id) === currentUserId,
          isEdited: message.isEdited,
          createdAt: message.createdAt
        }));

        // Sort by creation time (oldest first)
        transformedComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        setComments(transformedComments);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send new message
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    try {
      setSending(true);
      setError(null);

      const payload = {
        projectId: projectId,
        message: newComment.trim()
      };

      const response = await sendMessageAdmin(payload)

      if (!response.data.success) {
        throw new Error('Failed to send message');
      }
      
      if (response.data.success) {
        // Clear the input
        setNewComment('');
        
        // Refresh messages to get the latest ones
        await fetchMessages();
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Refresh messages manually
  const handleRefresh = () => {
    fetchMessages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Project Communication</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          title="Refresh messages"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-400">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex ${comment.isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start space-x-2 max-w-lg">
                  {/* Avatar for other users (left side) */}
                  {!comment.isOwnMessage && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2 max-w-sm ${
                      comment.isOwnMessage
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    {/* Author and timestamp */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-medium ${
                          comment.isOwnMessage ? 'text-blue-100' : 'text-gray-600'
                        }`}
                      >
                        {comment.isOwnMessage ? 'You' : `${comment.author} (${comment.role})`}
                      </span>
                      {comment.isEdited && (
                        <span
                          className={`text-xs ml-2 ${
                            comment.isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                          }`}
                        >
                          edited
                        </span>
                      )}
                    </div>
                    
                    {/* Message content */}
                    <p className={`text-sm leading-relaxed ${comment.isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                      {comment.message}
                    </p>
                    
                    {/* Timestamp */}
                    <div className="flex items-center justify-end mt-1">
                      <span
                        className={`text-xs flex items-center ${
                          comment.isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                        }`}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {comment.timestamp}
                      </span>
                    </div>
                  </div>
                  
                  {/* Avatar for own messages (right side) */}
                  {comment.isOwnMessage && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Auto scroll target */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input Form */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <div className="flex-1">
            <textarea
              rows={2}
              className="block w-full border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Type your message..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={sending}
            />
            <div className="text-xs text-gray-500 mt-1">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || sending}
            className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 border border-transparent rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            {sending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminDiscussionTab;