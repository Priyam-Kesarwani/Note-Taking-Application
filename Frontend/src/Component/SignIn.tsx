import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const [email, setEmail] = useState<string>("");
  const [otpVisible, setOtpVisible] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [keepLoggedIn, setKeepLoggedIn] = useState<boolean>(false);

  const API_BASE = "https://note-taking-application-backend-odaf.onrender.com"; // Backend URL
  const navigate = useNavigate();

  // Send OTP
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage("Please enter your email.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        setMessage("OTP sent successfully to your email.");
      } else {
        setMessage(data.message || "Failed to send OTP.");
      }
    } catch (error) {
      setMessage("Error sending OTP.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setMessage("Please enter OTP.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("OTP verified! Redirecting...");
        localStorage.setItem('token', data.token);
        if (keepLoggedIn) {
          localStorage.setItem("token", data.token ?? "");
        } else {
          sessionStorage.setItem("token", data.token ?? "");
        }
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setMessage(data.message || "OTP verification failed.");
      }
    } catch (error) {
      setMessage("Error verifying OTP.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full">
      {/* Left section */}
      <div className="flex-grow md:basis-[41%] p-4">

{/*         <header className="flex justify-between space-x-4 mb-10 md:hidden">
          <img src="/time.png" alt="" />
          <img src="/status.png" alt="" />
        </header> */}

        {/* Logo */}
         <div className="flex items-center justify-center md:justify-start mb-6 space-x-4 md:space-x-0">
          <img src="/image.png" alt="Logo" className="md:w-7 md:h-7 md:mr-2" />
          <span className="text-5xl md:text-lg font-semibold">HD</span>
        </div>
        <div className="flex flex-col justify-center items-center md:items-start px-8 h-180 md:h-screen -mt-5  space-y-3 md:space-y-0">
          {/* Content */}
          <h2 className="text-6xl md:text-3xl font-bold mb-2">Sign in</h2>
          <p className="text-gray-500 mb-6 text-2xl md:text-lg">
            Please login to continue your account.
          </p>

          <form
            onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
            className="w-full max-w-md space-y-3.5"
          >
            {/* Email Field */}
            <label className="relative block">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-5 py-4 md:px-4 md:py-3 w-full text-md border-gray-400 focus:outline-none focus:border-blue-400 border-2 peer bg-inherit rounded-md"
                placeholder=" "
                disabled={loading || otpSent}
              />
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 px-1 text-md bg-white
    pointer-events-none transition-all duration-200
    peer-placeholder-shown:text-md peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2
    peer-focus:text-blue-400 peer-focus:text-sm peer-focus:-top-2 peer-focus:-translate-y-0
    peer-[&:not(:placeholder-shown)]:text-sm peer-[&:not(:placeholder-shown)]:-top-2 peer-[&:not(:placeholder-shown)]:-translate-y-0"
              >
                Email
              </span>
            </label>

            {/* OTP Field (visible only after OTP sent) */}
            {otpSent && (
              <label className="relative block">
                <input
                  required
                  type={otpVisible ? "text" : "password"} // toggle input type
                  className="px-5 py-4 md:px-4 md:py-3 w-full text-md border-gray-400 focus:outline-none focus:border-blue-400 border-2 rounded-md"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                />
                <img
                  src={otpVisible ? "/eye.png" : "/eye-off.png"}
                  alt=""
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 cursor-pointer select-none"
                  onClick={() => setOtpVisible((prev) => !prev)}
                  draggable={false}
                />
              </label>
            )}

            {/* Send / Resend OTP */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="text-blue-500 text-sm hover:underline"
              >
                {otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>

            {/* Keep me logged in checkbox */}
            {otpSent && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="keepLoggedIn"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="keepLoggedIn" className="text-sm text-gray-700">
                  Keep me logged in
                </label>
              </div>
            )}

            {/* Verify OTP Button */}
            {otpSent && (
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-md mt-4"
              >
                {loading ? "Verifying..." : "Sign in"}
              </button>
            )}
          </form>

          {/* Message */}
          {message && (
            <p className="mt-3 text-sm text-center text-gray-600">{message}</p>
          )}

          <p className="mt-4 text-lg md:text-sm text-gray-500 text-center w-full">
            Need an account?{" "}
            <a href="/signup" className="text-blue-500 underline font-medium">
              Create one
            </a>
          </p>
        </div>
      </div>

      {/* Right section */}
      <div className="hidden md:flex md:basis-[59%] p-4">
        <img
          src="bg.jpg"
          alt=""
          className="object-cover w-full h-full rounded-xl"
        />
      </div>
    </div>
  );
};

export default SignIn;
