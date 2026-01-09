import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

const Forbidden = () => {
  const navigate = useNavigate();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/animations/error 403.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load animation:", err));
  }, []);

  const wittyMessages = [
    "Chirp chirp! This nest is for admin birds only! 🐦",
    "Whoops! Only the head pigeon can enter this coop! 🪶",
    "Access denied! This perch is reserved for admin eagles! 🦅",
    "Fly away, little sparrow! Admin feathers required! 🕊️",
    "Tweet tweet! Wrong branch, buddy. Admins only! 🐤",
  ];

  const randomMessage = wittyMessages[Math.floor(Math.random() * wittyMessages.length)];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#ffffff",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Error Code Badge */}
        <div style={{ 
          display: "inline-block", 
          padding: "8px 24px", 
          background: "rgba(102, 126, 234, 0.1)", 
          borderRadius: "50px",
          border: "2px solid rgba(102, 126, 234, 0.3)",
          marginBottom: "30px"
        }}>
          <span style={{ fontSize: "18px", fontWeight: "700", color: "#667eea", letterSpacing: "2px" }}>ERROR 403</span>
        </div>

        {/* Lottie Animation */}
        {animationData && (
          <div style={{ maxWidth: "550px", margin: "0 auto 40px", opacity: "0.75" }}>
            <Lottie animationData={animationData} loop={true} />
          </div>
        )}
        
        <div style={{ fontSize: "32px", fontWeight: "800", marginTop: "20px", marginBottom: "10px", color: "#2d3748" }}>
          Access Forbidden
        </div>
        
        {/* Decorative Line */}
        <div style={{ 
          width: "80px", 
          height: "4px", 
          background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)", 
          margin: "20px auto",
          borderRadius: "2px"
        }} />
        
        <div style={{ fontSize: "16px", color: "#666", marginTop: "20px", maxWidth: "500px", margin: "20px auto" }}>
          <p style={{ fontSize: "18px", fontWeight: "600", color: "#667eea", marginBottom: "15px" }}>
            {randomMessage}
          </p>
          <p style={{ marginTop: "10px", lineHeight: "1.6" }}>
            You don't have permission to access this area.
          </p>
          <p style={{ fontSize: "14px", color: "#999", marginTop: "15px", fontStyle: "italic" }}>
            If you believe this is a mistake, please contact the administrator.
          </p>
        </div>
        
        <Button
          type="primary"
          size="large"
          onClick={() => navigate("/")}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            border: "none",
            height: "45px",
            fontSize: "16px",
            borderRadius: "8px",
            boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            marginTop: "30px",
          }}
        >
          🏠 Back to Home
        </Button>
      </div>
    </div>
  );
};

export default Forbidden;