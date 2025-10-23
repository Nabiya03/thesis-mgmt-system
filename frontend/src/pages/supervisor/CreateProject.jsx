

import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {createProject} from '../../api/userService';

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

function CreateProject() {

  const { user } = useAuth();
  const [dialog, setDialog] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    year: '2024-25',
    title: '',
    description: '',
    type: '',
    assignmentNote1: false,
    assignmentNote2: false,
    supervisor: '' // Example: could come from logged-in user data
  });

  const [errors, setErrors] = useState({});

  const typeOptions = ['Research and development', 'Applied'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
   // if (!formData.year.trim()) newErrors.year = 'Year is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.type) newErrors.type = 'Type is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      const payload = {
            title: formData.title,
            description: formData.description,
            type: formData.type
          };

      const res = await createProject(payload);
      console.log("response..", res);
     if(res.data.success){
        // Show success dialog
        setDialog({ message: 'Project created successfully!', type: 'success' });
      }
    } catch (err){
        console.error("error in creating project", err.message);
    }
    if (validateForm()) {
      console.log('Creating project:', formData);
    
    }
  };

  const handleDialogClose = () => {
    setDialog(null);
    // Navigate after closing dialog
    if (dialog?.type === 'success') {
      navigate('/supervisor/projects');
    }
  };

  return (
    <>

      {/* Dialog Notification */}
      {dialog && (
        <Dialog 
          message={dialog.message} 
          type={dialog.type} 
          onClose={handleDialogClose}
        />
      )}
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Project</h1>
        <p className="text-sm text-gray-600 mb-6">
          Fill in the details for the new project
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Year */}
          
            <div>
            <label className="block text-sm font-medium text-gray-700">Year *</label>
            <input
              type="text"
              value={formData.year}
              readOnly
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
            />
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea
              name="description"
              id="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type *</label>
            <select
              name="type"
              id="type"
              value={formData.type}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 ${
                errors.type ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Type</option>
              {typeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
          </div>

          {/* Assignment Notes */}
          <div>
            <span className="block text-sm font-medium text-gray-700">Assignment Notes</span>
            <div className="flex space-x-4 mt-1">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="assignmentNote1"
                  checked={formData.assignmentNote1}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm">First note description</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="assignmentNote2"
                  checked={formData.assignmentNote2}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm">Second note description</span>
              </label>
            </div>
          </div>

          {/* Supervisor */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Supervisor</label>
            <input
              type="text"
              value={user.name}
              readOnly
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/supervisor/projects')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

export default CreateProject;