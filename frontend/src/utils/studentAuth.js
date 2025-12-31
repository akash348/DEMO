const TOKEN_KEY = "pragati_student_token";

export const getStudentToken = () => localStorage.getItem(TOKEN_KEY);

export const setStudentToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStudentToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};
