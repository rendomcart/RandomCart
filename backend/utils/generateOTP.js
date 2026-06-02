export const generateOTP = () => {
  // Generate a 6 digit random numeric string
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};
