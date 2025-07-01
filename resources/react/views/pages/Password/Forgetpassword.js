import React, { useState } from "react";

const Forgetpassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // const response = await fetch("https://sks-prepod.tipic.co.in/api/forgot-password", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ email }),
      // });
      const response = await post("/api/forgot-password",{ email });
      if (response.ok) {
        setMessage("A reset link has been sent to your email.");
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Something went wrong.");
      }
    } catch (error) {
      setMessage("Failed to send reset email. Please try again later.");
    }
  };

  return (
    <div>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Send Reset Link</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Forgetpassword;
