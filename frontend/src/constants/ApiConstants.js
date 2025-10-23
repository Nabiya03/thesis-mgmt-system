export const API_BASE_URL =  "import.meta.env.VITE_API_KEY/api" || "http://localhost:5000/api";

export const API_ENDPOINTS = {
  //admin APIS

  LOGIN: "/auth/login",
  ADD_USER: "/user/register",
  GET_ALL_USERS: "/user/all-users",
  ADD_DEADLINES: "/project/calendars",
  VIEW_ALL_DEADLINES: "/project/all/calendars",
  EDIT_DEADLINE: "/project/update/calendar",
  PROJECTS_FOR_ADMIN: "/project",
   SEND_MESSAGE_ADMIN: '/comment/add-admin-discussion-comment',
  GET_MESSAGES_ADMIN: (id) => `/comment/admin-discussion-comments/${id}`,
  UPDATE_USERS: (id) => `/user/${id}`,
  DELETE_USER: (id) => `/user/${id}`,
  UNASSIGNED_STUDENTS: '/user/students',
  USERS_COUNT: '/user/all',
  SUPERVISORS_ALL: '/user/all-supervisors',
  THIRD_MARKER: (id) => `/project/${id}/assign-third-marker`,
  RECENT_ACTIVITIES: '/user/stats',

  //supervisor APIs
  CREATE_PROOJECT: "/project/create",
  VIEW_PROJECTS: "/project/supervisor/all",
  GET_PROJECT_BY_ID: (id) => `/project/${id}`,
  GET_AVAILABLE_STUDETNS: "/project/available/students",
  ASSIGN_PROJECT_BY_ID:  `/project/assign`,
  GET_SUPERVISORS: '/user/supervisors',
  ADD_SECOND_MARKER: (id) => `/project/${id}/assign-supervisor-second`,
  ADD_GRADING: '/submission/grade-submission',
  EDIT_DEADLINE_PROJECT: (id) => `/project/${id}/update-deadlines`,
  ALL_STUDENTS_EMAIL: '/user/email',
  SUBMISSION_DASHBOARD: '/submission/supervisor/submissions',
 

  GET_SUBMISSION_DETAILS: '/submission/detail',
  SEND_MESSAGE: '/comment/add-comment',
  GET_MESSAGES: (id) => `/comment/show-comments/${id}`,
  //students APIs
  GET_AVAILABLE_PROJECTS: '/project/dep-available',
  APPLY_PROJECT: '/project/apply',
  GET_PROJECT_DETAILS: '/project/detail',
  PRESIGNED_URL: '/submission/generate-upload-url',
  SAVE_SUBMISSION_DATA: '/submission/save-data',
  GENERATE_DOWNLOAD_URL: '/submission/generate-download-url',
};
