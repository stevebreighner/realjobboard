// apiPaths.js

export const API_BASE = '/wp-json/customapi/v1';

export const API = {
  REGISTER: '/register',
  LOGIN: '/login',
  LOGOUT: '/logout',
  PROFILE: '/profile',
  UPDATE_PROFILE: '/user-profile-update',
  AVATAR_UPLOAD: '/user-profile-avatar',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  UPDATE_PASSWORD: '/update-password',
  GET_LIST: '/get-list',
  GET_DETAIL: '/get-list-detail',
  CREATE_POST: '/create-post',
  APPLY: '/apply-job',
  USER_APPLICATIONS: '/user-applications',
  USER_JOBS: '/user-jobs',
  JOB_APPLICANTS: '/job-applicants',
  UPLOAD_RESUME: '/upload-resume',
  GET_RESUMES: '/resumes',
  DELETE_RESUME: '/resumes-delete',
  UPDATE_RESUME_NOTES: '/resumes-update-resume-notes',
  START_2FA: '/2fa/start',
  MAGIC_LINK: '/magic-link',
  MAGIC_LOGIN: '/magic-login',
  PING: '/ping',
  CHECKLIST: '/checklist',
  SESSIONS: '/sessions'
};
