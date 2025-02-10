const formatResponse = (statusCode, statusMessage, data = {}) => {
  const currentTime= new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return {
    status_code: statusCode,
    status_message: statusMessage,
    datetime: currentTime,
    data,
  };
};

export default formatResponse