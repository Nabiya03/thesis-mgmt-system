import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, ArrowRight, Users, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

function UnassignedStudentPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user?.name}!
              </h1>
              <p className="text-gray-600">
                You haven't been assigned to any project yet. Let's find you the perfect thesis project!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center max-w-2xl mx-auto">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            
            {/* Title and Description */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Start Your Thesis Journey?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Browse through all the available projects for your dissertation and find one that matches your interests and career goals.
            </p>

            {/* Call to Action Button */}
            <div className="mb-8">
              <Link
                  to={`/student/projects`} 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                // onClick={() => {
                //   // Navigate to available projects - replace with your actual navigation logic
                //   window.location.href = '/student/projects';
                // }}
              >
                <Search className="h-5 w-5 mr-2" />
                Browse Available Projects
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </div>

            {/* Additional Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                What happens next?
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Browse through available thesis projects</p>
                <p>• Review project descriptions and requirements</p>
                <p>• Apply for projects that interest you</p>
                <p>• Wait for supervisor approval</p>
                <p>• Start working on your assigned project</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnassignedStudentPage;