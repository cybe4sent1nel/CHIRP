import { useState, useEffect } from "react";
import { useLogin } from "@refinedev/core";
import { Card, Form, Input, Button, Typography, Space, Alert } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export const AdminLogin = () => {
  const { mutate: login, isLoading } = useLogin();
  const [step, setStep] = useState(1); // 1: email, 2: OTP
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    console.log('[ADMIN UI] 🔐 Navigated to /admin/login');
    console.log('[ADMIN UI] ===== ADMIN LOGIN PAGE LOADED =====');
    
    // Log initial auth state
    const adminToken = localStorage.getItem('admin_token');
    const adminEmail = localStorage.getItem('admin_email');
    const adminData = localStorage.getItem('admin_data');
    
    console.log('[ADMIN UI] Current auth state:', {
      hasAdminToken: !!adminToken,
      adminEmail,
      hasAdminData: !!adminData
    });

    return () => {
      console.log('[ADMIN UI] ❌ Left /admin/login page');
    };
  }, []);

  const handleEmailSubmit = async (values) => {
    console.log('[ADMIN UI] ===== EMAIL SUBMISSION START =====');
    console.log('[ADMIN UI] 📧 User attempting admin login with email:', values.email);
    
    setError("");
    setEmail(values.email);
    
    login(
      { email: values.email },
      {
        onSuccess: () => {
          console.log('[ADMIN UI] ✅ OTP request successful, moving to verification step');
          setStep(2);
        },
        onError: (error) => {
          console.log('[ADMIN UI] ❌ OTP request failed:', error.message);
          console.log('[ADMIN UI] Full error:', error);
          setError(error.message);
        },
      }
    );
  };

  const handleOtpSubmit = async (values) => {
    console.log('[ADMIN UI] ===== OTP SUBMISSION START =====');
    console.log('[ADMIN UI] 🔐 User attempting OTP verification');
    console.log('[ADMIN UI] Email:', email);
    console.log('[ADMIN UI] OTP digits:', values.otp.length);
    
    setError("");
    
    login(
      { email, otp: values.otp },
      {
        onSuccess: () => {
          console.log('[ADMIN UI] ✅ OTP verified successfully!');
          console.log('[ADMIN UI] 🎉 Admin login complete');
        },
        onError: (error) => {
          console.log('[ADMIN UI] ❌ OTP verification failed:', error.message);
          console.log('[ADMIN UI] Full error:', error);
          setError(error.message);
        },
      }
    );
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          borderRadius: 16,
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              🐦 Chirp Admin
            </Title>
            <Text type="secondary">
              {step === 1 ? "Enter your admin email" : "Enter verification code"}
            </Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError("")}
            />
          )}

          {step === 1 ? (
            <Form
              layout="vertical"
              onFinish={handleEmailSubmit}
              requiredMark={false}
            >
              <Form.Item
                name="email"
                label="Admin Email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="admin@chirp.com"
                  size="large"
                  autoFocus
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={isLoading}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                }}
              >
                Send Verification Code
              </Button>
            </Form>
          ) : (
            <Form
              layout="vertical"
              onFinish={handleOtpSubmit}
              requiredMark={false}
            >
              <Alert
                message={`Code sent to ${email}`}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item
                name="otp"
                label="Verification Code"
                rules={[
                  { required: true, message: "Please enter the code" },
                  { len: 6, message: "Code must be 6 digits" },
                ]}
              >
                <Input
                  prefix={<LockOutlined />}
                  placeholder="000000"
                  size="large"
                  maxLength={6}
                  autoFocus
                  style={{ letterSpacing: "0.5em", fontSize: "18px", textAlign: "center" }}
                />
              </Form.Item>

              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={isLoading}
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                  }}
                >
                  Verify & Login
                </Button>
                
                <Button
                  type="link"
                  block
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                >
                  ← Back to email
                </Button>
              </Space>
            </Form>
          )}

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              🔒 Secure admin access with 2FA
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default AdminLogin;
