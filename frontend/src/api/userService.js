import apiClient from "./ApiClient";
import { API_ENDPOINTS } from "../constants/ApiConstants";

//admi APIS

//add user
export const addUser = (userData) => {
  return apiClient.post(API_ENDPOINTS.ADD_USER, userData);
};

//get all users with pagination
export const getAllUsers = (page = 1, limit = 10) => {
  return apiClient.get(API_ENDPOINTS.GET_ALL_USERS, {
    params: { page, limit }
  });
};

//create deadlines
export const createDeadline = (deadlineData) => {
  return apiClient.post(API_ENDPOINTS.ADD_DEADLINES, deadlineData);
}

//view all deadlines
export const getAllDeadlines = () => {
  return apiClient.get(API_ENDPOINTS.VIEW_ALL_DEADLINES);
}

//edit deadline
export const updateDeadline = (deadlineData)  => {
  return apiClient.put(API_ENDPOINTS.EDIT_DEADLINE, deadlineData);
}

//admin projects
export const adminProjects = () => {
  return apiClient.get(API_ENDPOINTS.PROJECTS_FOR_ADMIN);
}

//update project deadlines
export const updateProjectDeadline = (id, data) => {
  return apiClient.put(API_ENDPOINTS.EDIT_DEADLINE_PROJECT(id), data);
}

//update user
export const updateUser = (id, data) => {
  return apiClient.put(API_ENDPOINTS.UPDATE_USERS(id), data);
}

//delete user
export const deleteUser = (id) => {
  return apiClient.delete(API_ENDPOINTS.DELETE_USER(id));
}

//get all unassigned students
export const getAllUnassignedStudents = () => {
  return apiClient.get(API_ENDPOINTS.UNASSIGNED_STUDENTS);
}

//get all supervisors
export const allSupervisors = () => {
  return apiClient.get(API_ENDPOINTS.SUPERVISORS_ALL);
}

//assign third marker
export const addThirdMarker = (id, data) => {
  console.log("id and data..", id, data);
  return apiClient.put(API_ENDPOINTS.THIRD_MARKER(id), data);
}

//recent activities
export const recentActivities = () => {
  return apiClient.get(API_ENDPOINTS.RECENT_ACTIVITIES);
}

//supervisor API funcitons

//to create project
export const createProject = (projectData) => {
  return apiClient.post(API_ENDPOINTS.CREATE_PROOJECT, projectData);
}

//to view all projects
export const getProjects = () => {
  return apiClient.get(API_ENDPOINTS.VIEW_PROJECTS);
}

//prooject details
export const getProjectById = (id) => {
  return apiClient.get(API_ENDPOINTS.GET_PROJECT_BY_ID(id));
};

//get available students for assigning project
export const getAvailableStudents = () => {
  return apiClient.get(API_ENDPOINTS.GET_AVAILABLE_STUDETNS);
}

//assign project to a student
export const assignProjectToStudent = (data) => {
  return apiClient.put(API_ENDPOINTS.ASSIGN_PROJECT_BY_ID, data);
}

//get all supervisors list for assigning second marker
export const getALlSupervisors = (data) => {
  return apiClient.post(API_ENDPOINTS.GET_SUPERVISORS, data);
}

//add second marker
export const addSecondMarker = (id, data) => {
  return apiClient.put(API_ENDPOINTS.ADD_SECOND_MARKER(id), data);
}

//grading
export const submitGrading = (payload) => {
  return apiClient.post(API_ENDPOINTS.ADD_GRADING, payload);
}

//all students email export
export const allStudentsEmail = () => {
  return apiClient.get(API_ENDPOINTS.ALL_STUDENTS_EMAIL, {
    responseType: "blob",
  });
};

export const submissionDashboard = () => {
  return apiClient.get(API_ENDPOINTS.SUBMISSION_DASHBOARD);
}

//common apis for communication thread

//to send a message at admin-seurvisor side
export const sendMessageAdmin = (data) => {
  return apiClient.post(API_ENDPOINTS.SEND_MESSAGE_ADMIN, data);
}
//to view messages at admin-supervisor side
export const viewMessageAdmin = (id) => {
  return apiClient.get(API_ENDPOINTS.GET_MESSAGES_ADMIN(id));
}

//to send a message at supervisor-student side
export const sendMessage = (data) => {
  return apiClient.post(API_ENDPOINTS.SEND_MESSAGE, data);
}

//to view messages at supervisor-student side
export const viewMessage = (id) => {
  return apiClient.get(API_ENDPOINTS.GET_MESSAGES(id));
}


//user count at admin
export const getUsersCount = () => {
  return apiClient.get(API_ENDPOINTS.USERS_COUNT);
}

//studetns APIS
export const getAvailableProjectsForStudents = () => {
  return apiClient.get(API_ENDPOINTS.GET_AVAILABLE_PROJECTS);
}

//apply to a project

export const applytoProject = (data) => {
  return apiClient.put(API_ENDPOINTS.APPLY_PROJECT, data);
}

//get project details
export const getProjectDetails = () => {
  return apiClient.get(API_ENDPOINTS.GET_PROJECT_DETAILS);
}
export const generateUploadUrl = (payload) => {
  return apiClient.post(API_ENDPOINTS.PRESIGNED_URL, payload);
}

export const saveSubmissionMetadata = (payload) => {
  return apiClient.post(API_ENDPOINTS.SAVE_SUBMISSION_DATA, payload);
}

//to get submission details
export const getSubmissionDetails = (payload) => {
  return apiClient.post(API_ENDPOINTS.GET_SUBMISSION_DETAILS, payload);
}

//to generate download url
export const generateDownloadUrl = (s3Key, fileName) => {
  return apiClient.get(API_ENDPOINTS.GENERATE_DOWNLOAD_URL, {
    params: { s3Key, fileName },
  });
};


