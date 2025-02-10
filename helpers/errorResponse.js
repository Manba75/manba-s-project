 export const errorResponse = (success, message, data = null, error = null) => {
  return {
    success,
    message,
    data,
    error
  };
};