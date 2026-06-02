import { useState, useRef, useEffect } from 'react';

const OtpInput = ({ length = 6, onOtpChange }) => {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Initial focus on the first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last character in case of multiple
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    onOtpChange(newOtp.join(""));

    // Move to next input if current field is filled
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length).replace(/\D/g, "");
    if (pastedData) {
      const newOtp = [...otp];
      pastedData.split("").forEach((char, index) => {
        if (index < length) newOtp[index] = char;
      });
      setOtp(newOtp);
      onOtpChange(newOtp.join(""));
      // Focus on the next empty box or the last box
      const nextEmptyIndex = newOtp.findIndex(val => val === "");
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1;
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex].focus();
      }
    }
  };

  return (
    <div className="flex gap-2 justify-between">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          ref={(ref) => inputRefs.current[index] = ref}
          value={data}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-10 h-12 sm:w-12 sm:h-14 border border-gray-300 rounded text-center text-xl font-bold focus:border-primary focus:ring-2 focus:ring-primary outline-none transition-all"
        />
      ))}
    </div>
  );
};

export default OtpInput;
