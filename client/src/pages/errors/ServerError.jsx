import { Result, Button } from "antd";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

const ServerError = () => {
  const navigate = useNavigate();
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/animations/error 500.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load animation:", err));
  }, []);

  const wittyMessages = [
    "Oops! Our nest fell apart! 🪹",
    "The server bird flew away! 🐦‍⬛",
    "Houston, we have a pigeon problem! 🚀🐦",
    "Our servers are having a bird bath break! 🛁",
    "The flock got confused! Chirp chirp error! 🐤",
    "Even admin eagles can't fix this one! 🦅💔",
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
          background: "rgba(245, 87, 108, 0.1)", 
          borderRadius: "50px",
          border: "2px solid rgba(245, 87, 108, 0.3)",
          marginBottom: "30px"
        }}>
          <span style={{ fontSize: "18px", fontWeight: "700", color: "#f5576c", letterSpacing: "2px" }}>ERROR 500</span>
        </div>

        {/* Lottie Animation */}
        {animationData && (
          <div style={{ maxWidth: "550px", margin: "0 auto 40px", opacity: "0.75" }}>
            <Lottie animationData={animationData} loop={true} />
          </div>
        )}
        
        <div style={{ fontSize: "32px", fontWeight: "800", marginTop: "20px", marginBottom: "10px", color: "#2d3748" }}>
          Internal Server Error
        </div>
        
        {/* Decorative Line */}
        <div style={{ 
          width: "80px", 
          height: "4px", 
          background: "linear-gradient(90deg, #f093fb 0%, #f5576c 100%)", 
          margin: "20px auto",
          borderRadius: "2px"
        }} />
        
        <div style={{ fontSize: "16px", color: "#666", marginTop: "20px", maxWidth: "500px", margin: "20px auto" }}>
          <p style={{ fontSize: "18px", fontWeight: "600", color: "#f5576c", marginBottom: "15px" }}>
            {randomMessage}
          </p>
          <p style={{ marginTop: "10px", lineHeight: "1.6" }}>
            Something went wrong on our end. Our tech pigeons are working on it!
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "30px" }}>
          <Button
            type="primary"
            size="large"
            onClick={() => window.location.reload()}
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              border: "none",
              height: "45px",
              fontSize: "16px",
              borderRadius: "8px",
              boxShadow: "0 4px 15px rgba(245, 87, 108, 0.4)",
            }}
          >
            🔄 Try Again
          </Button>
          <Button
            size="large"
            onClick={() => navigate("/")}
            style={{
              height: "45px",
              fontSize: "16px",
              borderRadius: "8px",
            }}
          >
            🏠 Back to Home
          </Button>
        </div>
        
        <div style={{ 
          marginTop: "40px", 
          padding: "24px", 
          background: "rgba(248, 249, 250, 0.5)", 
          borderRadius: "12px",
          border: "1px solid rgba(0,0,0,0.06)",
          maxWidth: "500px",
          margin: "40px auto 0"
        }}>
          <p style={{ fontSize: "15px", color: "#555", margin: 0, fontWeight: "600" }}>
            💡 What happened?
          </p>
          <p style={{ fontSize: "14px", color: "#777", marginTop: "12px", lineHeight: "1.6" }}>
            The server encountered an unexpected condition. If this keeps happening,
            please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServerError;