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
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "40px",
          maxWidth: "600px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {animationData && (
          <div style={{ maxWidth: "300px", margin: "0 auto" }}>
            <Lottie animationData={animationData} loop={true} />
          </div>
        )}
        <Result
          status="403"
          title={
            <span style={{ fontSize: "24px", fontWeight: "bold" }}>
              403 - Forbidden
            </span>
          }
          subTitle={
            <div style={{ fontSize: "16px", color: "#666", marginTop: "20px" }}>
              <p style={{ fontSize: "18px", fontWeight: "600", color: "#667eea" }}>
                {randomMessage}
              </p>
              <p style={{ marginTop: "10px" }}>
                You don't have permission to access this admin area.
              </p>
            </div>
          }
          extra={
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
              }}
            >
              🏠 Back to Home
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default Forbidden;