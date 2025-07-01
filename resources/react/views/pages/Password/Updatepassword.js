import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { post } from "../../../util/api";

const Updatepassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setMessage("Invalid or missing token. Redirecting...");
      setTimeout(() => navigate("/error"), 3000);
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const payload = { token, newPassword };
      const response = await post("/api/newPassword", payload);
      if (response.message === "Password updated successfully") { 
        setMessage("Password updated successfully!");
        window.alert("Password updated successfully!");
        navigate("/login");

      } else {
        const errorData = await response.json();
    
        switch (errorData.status) {
          case "invalid_token":
            setMessage(errorData.message || "Invalid or expired token.");
            window.alert(errorData.message || "Invalid or expired token.");
            break;
          case "user_not_found":
            setMessage(errorData.message || "User not found.");
            window.alert(errorData.message || "User not found.");
            break;
          case "validation_failed":
            setMessage(
              errorData.message || "Validation failed. Please check your input."
            );
            window.alert(
              errorData.message || "Validation failed. Please check your input."
            );
            break;
          case "update_failed":
          case "processing_error":
            setMessage(
              errorData.message ||
                "An error occurred while processing your request."
            );
            window.alert(
              errorData.message ||
                "An error occurred while processing your request."
            );
            break;
          default:
            setMessage(
              errorData.message ||
                "An unknown error occurred. Please try again later."
            );
            window.alert(
              errorData.message ||
                "An unknown error occurred. Please try again later."
            );
            break;
        }
      }
    } catch (error) {
      setMessage("Invalid or expired token.");
    } finally {
      setLoading(false);
    }
  };    
    
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f8f9fa",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#fff",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          borderRadius: "10px",
          padding: "20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
            color: "#333",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Reset Password
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
                color: "#555",
              }}
            >
              New Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={passwordVisible ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#007bff",
                  fontWeight: "bold",
                }}
              >
                {passwordVisible ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontWeight: "bold",
                color: "#555",
              }}
            >
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={passwordVisible ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#007bff",
                  fontWeight: "bold",
                }}
              >
                {passwordVisible ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              border: "none",
              borderRadius: "5px",
              backgroundColor: "#007bff",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "16px",
              transition: "background-color 0.3s",
            }}
            disabled={loading}
            onMouseEnter={(e) =>
              (e.target.style.backgroundColor = "#0056b3")
            }
            onMouseLeave={(e) =>
              (e.target.style.backgroundColor = "#007bff")
            }
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
        {message && (
          <p
            style={{
              marginTop: "15px",
              color: message.includes("successfully") ? "#28a745" : "#dc3545",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Updatepassword;