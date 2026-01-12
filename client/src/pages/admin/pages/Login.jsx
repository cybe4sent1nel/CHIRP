import { useState, useEffect } from "react";
import { Card, Form, Input, Button, Typography, Space, Alert, Spin, Select, message } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

const { Title, Text } = Typography;

// Chirp logo
const ChirpLogo = () => (
  <img 
    src="/LOGOO.png" 
    alt="Chirp Logo" 
    style={{ height: 45, marginRight: 12 }}
    onError={(e) => {
      e.target.style.display = 'none';
    }}
  />
);

export const AdminLogin = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [step, setStep] = useState(1); // 1: email, 2: OTP
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [adminEmails, setAdminEmails] = useState([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSentEmail, setAutoSentEmail] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Handle resend timer countdown
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Load available admin emails on mount
  useEffect(() => {
    const loadAdminEmails = async () => {
      try {
        console.log('[ADMIN LOGIN] Loading admin emails from database...');
        const response = await api.get('/api/admin/emails');
        
        if (response.data.success) {
          const emails = response.data.emails || [];
          console.log('[ADMIN LOGIN] Available admin emails:', emails);
          setAdminEmails(emails);
          
          // If only one admin, auto-select and send auth code
          if (emails.length === 1) {
            const adminEmail = emails[0];
            console.log('[ADMIN LOGIN] Auto-selecting single admin email:', adminEmail);
            setEmail(adminEmail);
            setAutoSentEmail(adminEmail);
            
            // Auto-send auth code
            setTimeout(() => {
              handleAutoSendCode(adminEmail);
            }, 500);
          }
        }
      } catch (err) {
        console.error('[ADMIN LOGIN] Error loading admin emails:', err);
        setError('Could not load admin emails. Please try again.');
      } finally {
        setLoadingEmails(false);
      }
    };

    loadAdminEmails();
  }, []);

  const handleAutoSendCode = async (adminEmail) => {
    console.log('[ADMIN LOGIN] Auto-sending auth code to:', adminEmail);
    setIsLoading(true);
    
    try {
      const response = await api.post('/api/admin/login/initiate', { 
        email: adminEmail 
      });
      
      if (response.data.success) {
        console.log('[ADMIN LOGIN] ✅ Auth code sent successfully');
        setStep(2);
        setResendTimer(60);
        message.success('Auth code sent to your email!');
      }
    } catch (err) {
      console.log('[ADMIN LOGIN] ❌ Auth code send failed:', err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to send auth code";
      
      if (err.response?.status === 403) {
        setError("Access Denied: This email is not authorized to access the admin dashboard");
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSelect = async (selectedEmail) => {
    console.log('[ADMIN LOGIN] User selected email:', selectedEmail);
    setEmail(selectedEmail);
    setError("");
    setIsLoading(true);
    
    try {
      const response = await api.post('/api/admin/login/initiate', { 
        email: selectedEmail 
      });
      
      if (response.data.success) {
        console.log('[ADMIN LOGIN] ✅ Auth code sent successfully');
        setStep(2);
        setResendTimer(60);
        message.success('Auth code sent to your email!');
      }
    } catch (err) {
      console.log('[ADMIN LOGIN] ❌ Auth code send failed:', err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to send auth code";
      
      if (err.response?.status === 403) {
        setError("Access Denied: This email is not authorized to access the admin dashboard");
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    setResendLoading(true);
    try {
      const response = await api.post('/api/admin/login/initiate', { 
        email 
      });
      
      if (response.data.success) {
        setResendTimer(60);
        message.success('Auth code resent to your email!');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpSubmit = async (values) => {
    console.log('[ADMIN LOGIN] ===== OTP SUBMISSION START =====');
    console.log('[ADMIN LOGIN] Email:', email);
    console.log('[ADMIN LOGIN] Auth code digits:', values.otp.length);
    
    setError("");
    setIsLoading(true);
    
    try {
      const response = await api.post('/api/admin/login/verify', { 
        email, 
        otp: values.otp 
      });
      
      if (response.data.success) {
        console.log('[ADMIN LOGIN] ✅ Auth code verified successfully!');
        
        // Store credentials
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('admin_email', email);
        localStorage.setItem('admin_data', JSON.stringify(response.data.admin));
        
        message.success('Login successful! Redirecting to dashboard...');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/admin/dashboard', { replace: true });
        }, 500);
      }
    } catch (err) {
      console.log('[ADMIN LOGIN] ❌ Auth code verification failed:', err);
      const errorMsg = err.response?.data?.message || err.message || "Invalid auth code";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (loadingEmails) {
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <ChirpLogo />
                <Title level={2} style={{ marginBottom: 0 }}>
                  Chirp Admin
                </Title>
              </div>
              <Text type="secondary">Loading admin accounts...</Text>
            </div>
            <Spin size="large" />
          </Space>
        </Card>
      </div>
    );
  }

  // No admin accounts
  if (adminEmails.length === 0) {
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <ChirpLogo />
                <Title level={2} style={{ marginBottom: 0 }}>
                  Chirp Admin
                </Title>
              </div>
            </div>
            <Alert
              message="No Admin Accounts"
              description="There are no admin accounts in the system. Please contact support."
              type="error"
              showIcon
            />
          </Space>
        </Card>
      </div>
    );
  }

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <ChirpLogo />
              <Title level={2} style={{ marginBottom: 0 }}>
                Chirp Admin
              </Title>
            </div>
            <Text type="secondary">
              {step === 1 ? "Select your admin email" : "Enter verification code"}
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

          {autoSentEmail && step === 2 && (
            <Alert
              message="✅ Auth code sent!"
              description={`Check your email at ${email} for the 6-digit authentication code`}
              type="success"
              showIcon
            />
          )}

          {step === 1 ? (
            <Form layout="vertical" requiredMark={false}>
              <Form.Item
                label="Select Admin Email"
                required
              >
                <Select
                  placeholder="Choose your admin email"
                  value={email || undefined}
                  onChange={handleEmailSelect}
                  loading={isLoading}
                  size="large"
                  options={adminEmails.map((addr) => ({
                    label: addr,
                    value: addr,
                  }))}
                />
              </Form.Item>

              <Text type="secondary" style={{ fontSize: 12 }}>
                🔒 Secure admin access with two-factor authentication
              </Text>
            </Form>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleOtpSubmit}
              requiredMark={false}
            >
              <Alert
                message={`✅ Auth code sent to ${email}`}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Form.Item
                name="otp"
                label="Authentication Code"
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
                  type="default"
                  block
                  onClick={handleResendCode}
                  disabled={resendTimer > 0}
                  loading={resendLoading}
                  style={{
                    color: resendTimer > 0 ? '#999' : '#667eea',
                    borderColor: resendTimer > 0 ? '#ddd' : '#667eea',
                  }}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
                </Button>
                
                <Button
                  type="link"
                  block
                  onClick={() => {
                    setStep(1);
                    setError("");
                    setResendTimer(0);
                    form.resetFields();
                  }}
                >
                  ← Back to email selection
                </Button>
              </Space>
            </Form>
          )}

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              🔐 Two-Factor Authentication enabled for maximum security
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default AdminLogin;
