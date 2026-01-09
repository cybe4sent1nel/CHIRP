import api from "../../api/axios";

export const authProvider = {
  login: async ({ email, otp }) => {
    console.log("🔐 [LOGIN] Attempt started - Email:", email, "OTP provided:", !!otp);
    
    if (otp) {
      // Verify OTP
      try {
        console.log("📧 [LOGIN] Verifying OTP...");
        const { data } = await api.post("/admin/login/verify", { email, otp });
        console.log("✅ [LOGIN] Verification response:", data);
        
        if (data.success) {
          localStorage.setItem("admin_token", data.token);
          localStorage.setItem("admin_email", email);
          localStorage.setItem("admin_data", JSON.stringify(data.admin));
          console.log("✅ [LOGIN] OTP verified successfully, tokens stored");
          return { success: true };
        }
        console.log("❌ [LOGIN] OTP verification failed:", data.message);
        return {
          success: false,
          error: {
            name: "LoginError",
            message: data.message || "Invalid OTP",
          },
        };
      } catch (error) {
        console.error("❌ [LOGIN] OTP verification error:", error);
        return {
          success: false,
          error: {
            name: "LoginError",
            message: error.response?.data?.message || "Verification failed",
          },
        };
      }
    } else {
      // Initiate login - send OTP
      try {
        console.log("📤 [LOGIN] Initiating OTP send...");
        const { data } = await api.post("/admin/login/initiate", { email });
        console.log("✅ [LOGIN] OTP initiate response:", data);
        
        if (data.success) {
          console.log("✅ [LOGIN] OTP sent successfully");
          return {
            success: true,
            redirectTo: false,
            successNotification: {
              message: "OTP Sent",
              description: "Check your email for the verification code",
            },
          };
        }
        console.log("❌ [LOGIN] OTP send failed:", data.message);
        return {
          success: false,
          error: {
            name: "LoginError",
            message: data.message || "Failed to send OTP",
          },
        };
      } catch (error) {
        console.error("❌ [LOGIN] OTP initiate error:", error);
        return {
          success: false,
          error: {
            name: "LoginError",
            message: error.response?.data?.message || "Login failed",
          },
        };
      }
    }
  },

  logout: async () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_data");
    return { success: true, redirectTo: "/admin/login" };
  },

  check: async () => {
    console.log("🔍 [AUTH CHECK] Starting authentication check...");
    
    const token = localStorage.getItem("admin_token");
    const adminData = localStorage.getItem("admin_data");
    
    console.log("📋 [AUTH CHECK] Admin token exists:", !!token);
    console.log("📋 [AUTH CHECK] Admin data exists:", !!adminData);
    
    // Check if user is logged in as a regular user (Clerk)
    // Look for Clerk session data in localStorage
    const clerkKeys = Object.keys(localStorage).filter(key => 
      key.includes('clerk') || key.includes('__clerk')
    );
    const hasClerkSession = clerkKeys.length > 0;
    
    console.log("🔑 [AUTH CHECK] Clerk session detected:", hasClerkSession);
    console.log("🔑 [AUTH CHECK] Clerk keys found:", clerkKeys);
    
    // Has token - verify admin role
    if (token && adminData) {
      console.log("✅ [AUTH CHECK] Admin credentials found, verifying role...");
      try {
        const admin = JSON.parse(adminData);
        console.log("👤 [AUTH CHECK] Admin role:", admin.role);
        
        // Check if user has admin role
        if (admin.role && ['super_admin', 'admin', 'moderator'].includes(admin.role)) {
          console.log("✅ [AUTH CHECK] Admin role verified - AUTHENTICATED");
          return { authenticated: true };
        }
        
        // Has token but not an admin - show 403
        console.log("⛔ [AUTH CHECK] User has token but not admin role - REDIRECTING TO 403");
        return {
          authenticated: false,
          redirectTo: "/error/403",
          error: {
            message: "Access denied - Admin privileges required",
            name: "Forbidden",
          },
        };
      } catch (error) {
        console.error("❌ [AUTH CHECK] Failed to parse admin data:", error);
        // Invalid token data - redirect to login
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_email");
        localStorage.removeItem("admin_data");
        console.log("🔄 [AUTH CHECK] Cleared invalid admin data - REDIRECTING TO LOGIN");
        return {
          authenticated: false,
          redirectTo: "/admin/login",
        };
      }
    }
    
    // No admin token - check if regular user trying to access admin
    if (!token) {
      console.log("⚠️ [AUTH CHECK] No admin token found");
      
      // If user is logged in with Clerk but no admin token, show 403
      if (hasClerkSession) {
        console.log("⛔ [AUTH CHECK] Regular user detected (Clerk session) - REDIRECTING TO 403");
        return {
          authenticated: false,
          redirectTo: "/error/403",
          error: {
            message: "Access denied - Admin privileges required",
            name: "Forbidden",
          },
        };
      }
      
      // Not logged in at all - redirect to admin login
      console.log("🔓 [AUTH CHECK] No user logged in - REDIRECTING TO ADMIN LOGIN");
      return {
        authenticated: false,
        redirectTo: "/admin/login",
      };
    }
    
    console.log("⚠️ [AUTH CHECK] Fallback - REDIRECTING TO ADMIN LOGIN");
    return {
      authenticated: false,
      redirectTo: "/admin/login",
    };
  },

  getPermissions: async () => {
    const adminData = localStorage.getItem("admin_data");
    if (adminData) {
      const admin = JSON.parse(adminData);
      return admin.permissions;
    }
    return null;
  },

  getIdentity: async () => {
    const adminData = localStorage.getItem("admin_data");
    if (adminData) {
      const admin = JSON.parse(adminData);
      return {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=667eea&color=fff`,
      };
    }
    return null;
  },

  onError: async (error) => {
    if (error.status === 401 || error.status === 403) {
      return { logout: true, redirectTo: "/admin/login" };
    }
    return { error };
  },
};
