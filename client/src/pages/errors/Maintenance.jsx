import { Button } from "antd";
import { useState, useEffect } from "react";

const MaintenancePage = () => {
  const [maintenanceData, setMaintenanceData] = useState(null);

  useEffect(() => {
    // Fetch maintenance data if available
    fetch("/api/maintenance")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.maintenance) {
          setMaintenanceData(data.maintenance);
        }
      })
      .catch(() => {
        setMaintenanceData({
          title: "We'll be back soon!",
          message: "We're currently performing maintenance to improve your experience.",
          estimatedTime: "a few hours",
        });
      });
  }, []);

  const pigeonMessages = [
    "🐦 Chirp is taking a coffee break... and we don't blame them!",
    "🐦 Our servers are getting a spa day. They deserve it!",
    "🐦 We're under maintenance. Even digital birds need their rest!",
    "🐦 Chirp is getting a makeover. We'll be gorgeous soon!",
    "🐦 Our hamsters are running extra hard right now... please wait!",
    "🐦 We're fixing some bugs (the real kind, not pigeon kind)!",
    "🐦 Maintenance mode: ON. Common sense: hopefully ON too!",
    "🐦 Be back soon! We're just rearranging the digital furniture.",
    "🐦 Chirp is doing yoga. Namaste, we'll be back!",
    "🐦 Our tech team is caffeinating. Maintenance in progress!",
  ];

  const randomMessage = pigeonMessages[Math.floor(Math.random() * pigeonMessages.length)];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#ffffff",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Video */}
      <video
        src="/maintainence.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.15,
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Maintenance Badge */}
        <div
          style={{
            display: "inline-block",
            padding: "8px 24px",
            background: "rgba(102, 126, 234, 0.1)",
            borderRadius: "50px",
            border: "2px solid rgba(102, 126, 234, 0.3)",
            marginBottom: "30px",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#667eea",
              letterSpacing: "2px",
            }}
          >
            MAINTENANCE
          </span>
        </div>

        {/* Logo */}
        <div
          style={{
            marginBottom: "40px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src="/LOGOO.png"
            alt="Chirp Logo"
            style={{
              height: "120px",
              width: "auto",
              objectFit: "contain",
              margin: "0 auto",
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: "800",
            marginBottom: "10px",
            color: "#2d3748",
          }}
        >
          {maintenanceData?.title || "We'll be back soon!"}
        </div>

        {/* Decorative Line */}
        <div
          style={{
            width: "80px",
            height: "4px",
            background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
            margin: "20px auto",
            borderRadius: "2px",
          }}
        />

        {/* Messages */}
        <div
          style={{
            fontSize: "16px",
            color: "#666",
            marginTop: "20px",
            maxWidth: "600px",
            margin: "20px auto",
          }}
        >
          <p
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: "#667eea",
              marginBottom: "15px",
            }}
          >
            {randomMessage}
          </p>
          <p style={{ marginTop: "10px", lineHeight: "1.6" }}>
            {maintenanceData?.message ||
              "We're currently performing maintenance to improve your experience."}
          </p>

          {maintenanceData?.estimatedTime && (
            <p style={{ fontSize: "14px", color: "#999", marginTop: "15px" }}>
              ⏱️ Estimated time: <strong>{maintenanceData.estimatedTime}</strong>
            </p>
          )}

          {maintenanceData?.contactEmail && (
            <p style={{ fontSize: "14px", color: "#999", marginTop: "10px" }}>
              📧 Contact: <strong>{maintenanceData.contactEmail}</strong>
            </p>
          )}

          <p
            style={{
              fontSize: "13px",
              color: "#aaa",
              marginTop: "20px",
              fontStyle: "italic",
            }}
          >
            Thank you for your patience. We're working hard to bring Chirp back
            online!
          </p>
        </div>

        {/* Refresh Button */}
        <Button
          type="primary"
          size="large"
          onClick={() => window.location.reload()}
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
          ↻ Check Again
        </Button>
      </div>
    </div>
  );
};

export default MaintenancePage;
