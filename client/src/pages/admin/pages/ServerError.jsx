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
        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
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
          <div style={{ maxWidth: "350px", margin: "0 auto" }}>
            <Lottie animationData={animationData} loop={true} />
          </div>
        )}
        <Result
          status="500"
          title={
            <span style={{ fontSize: "24px", fontWeight: "bold" }}>
              500 - Internal Server Error
            </span>
          }
          subTitle={
            <div style={{ fontSize: "16px", color: "#666", marginTop: "20px" }}>
              <p style={{ fontSize: "18px", fontWeight: "600", color: "#f5576c" }}>
                {randomMessage}
              </p>
              <p style={{ marginTop: "10px" }}>
                Something went wrong on our end. Our tech pigeons are working on it!
              </p>
            </div>
          }
          extra={
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
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
          }
        />
        <div style={{ marginTop: "30px", padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}>
          <p style={{ fontSize: "14px", color: "#666", margin: 0 }}>
            💡 <strong>What happened?</strong>
          </p>
          <p style={{ fontSize: "13px", color: "#888", marginTop: "8px" }}>
            The server encountered an unexpected condition. If this keeps happening,
            please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServerError;