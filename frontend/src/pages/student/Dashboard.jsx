import React, {useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, FileText, Upload, Target, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import UnassignedStudentPage from './UnAssignedStudent';
import MyProject from './MyProject';
import { getProjectDetails} from '../../api/userService';


function Dashboard() {
  const { user } = useAuth();
  const [assignedProject, setAssignedProject] = useState(null);
  const [loading, setLoading] = useState(true);
 
  const currentUserId = user._id;
  useEffect(() => {
    checkAssignedProject();
  }, []);

  const checkAssignedProject = async () => {
    try {
      const res = await getProjectDetails(currentUserId);
      console.log("res", res);
      setAssignedProject(res.data.data || null);
    } catch (error) {
      console.error("Error fetching assigned project:", error);
    } finally {
      setLoading(false);
    }
  };


 
  if (loading) return <p>Loading...</p>;
   return assignedProject ? (
    <MyProject  />
  ) : (
    <UnassignedStudentPage />
  );
 
}

export default Dashboard;
