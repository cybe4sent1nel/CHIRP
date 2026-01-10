import React, { useState, useRef, useEffect, Suspense } from "react";
import { Star, X } from "lucide-react";
const SignIn = React.lazy(() => import('@clerk/clerk-react').then(mod => ({ default: mod.SignIn })));
const SignUp = React.lazy(() => import('@clerk/clerk-react').then(mod => ({ default: mod.SignUp })));
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

const StyledButton = styled.div`
  button {
    position: relative;
    padding: 12px 35px;
    background: ${props => props.color};
    font-size: 17px;
    font-weight: 500;
    color: ${props => props.textColor};
    border: 3px solid ${props => props.color};
    border-radius: 8px;
    box-shadow: 0 0 0 ${props => props.shadowColor};
    transition: all 0.3s ease-in-out;
    cursor: pointer;
  }

  .star-1, .star-2, .star-3, .star-4, .star-5, .star-6 {
    position: absolute;
    filter: drop-shadow(0 0 0 #fffdef);
    z-index: -5;
    height: auto;
  }

  .star-1 {
    top: 20%;
    left: 20%;
    width: 25px;
    transition: all 1s cubic-bezier(0.05, 0.83, 0.43, 0.96);
  }

  .star-2 {
    top: 45%;
    left: 45%;
    width: 15px;
    transition: all 1s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-3 {
    top: 40%;
    left: 40%;
    width: 5px;
    transition: all 1s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-4 {
    top: 20%;
    left: 40%;
    width: 8px;
    transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-5 {
    top: 25%;
    left: 45%;
    width: 15px;
    transition: all 0.6s cubic-bezier(0, 0.4, 0, 1.01);
  }

  .star-6 {
    top: 5%;
    left: 50%;
    width: 5px;
    transition: all 0.8s ease;
  }

  button:hover {
    background: transparent;
    color: ${props => props.color};
    box-shadow: 0 0 25px ${props => props.shadowColor};
  }

  button:hover .star-1 {
    position: absolute;
    top: -80%;
    left: -30%;
    width: 25px;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-2 {
    position: absolute;
    top: -25%;
    left: 10%;
    width: 15px;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-3 {
    position: absolute;
    top: 55%;
    left: 25%;
    width: 5px;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-4 {
    position: absolute;
    top: 30%;
    left: 80%;
    width: 8px;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-5 {
    position: absolute;
    top: 25%;
    left: 115%;
    width: 15px;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  button:hover .star-6 {
    position: absolute;
    top: 5%;
    left: 60%;
    width: 5px;
    filter: drop-shadow(0 0 10px #fffdef);
    z-index: 2;
  }

  .fil0 {
    fill: #fffdef;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AnimatedButton = ({ label, onClick, disabled, color, textColor, shadowColor }) => {
  return (
    <StyledButton color={color} textColor={textColor} shadowColor={shadowColor}>
      <button onClick={onClick} disabled={disabled}>
        {label}
        <div className="star-1">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
        <div className="star-2">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
        <div className="star-3">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
        <div className="star-4">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
        <div className="star-5">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
        <div className="star-6">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" version="1.1" style={{shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd'}} viewBox="0 0 784.11 815.53" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs />
            <g id="Layer_x0020_1">
              <metadata id="CorelCorpID_0Corel-Layer" />
              <path className="fil0" d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z" />
            </g>
          </svg>
        </div>
      </button>
    </StyledButton>
  );
};

const StyledWrapper = styled.div`
  .container::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    background-image: radial-gradient(
      ellipse 1.5px 2px at 1.5px 50%,
      #0000 0,
      #0000 90%,
      #000 100%
    );
    background-size: 25px 8px;
  }

  .container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    --c: #09f;
    background-color: #000;
    background-image: radial-gradient(4px 100px at 0px 235px, var(--c), #0000),
      radial-gradient(4px 100px at 300px 235px, var(--c), #0000),
      radial-gradient(1.5px 1.5px at 150px 117.5px, var(--c) 100%, #0000 150%),
      radial-gradient(4px 100px at 0px 252px, var(--c), #0000);
    background-size: 300px 235px, 300px 235px, 300px 235px, 300px 252px;
    animation: hi 150s linear infinite;
    z-index: 0;
  }

  @keyframes hi {
    0% { background-position: 0px 220px, 3px 220px, 151.5px 337.5px, 25px 24px; }
    to { background-position: 0px 6800px, 3px 6800px, 151.5px 6917.5px, 25px 13632px; }
  }
`;

const Pattern = ({ paused = false }) => (
  <StyledWrapper>
    <div className={`container ${paused ? 'paused' : ''}`} />
  </StyledWrapper>
);

// Pause background animation when modal open via CSS
/* In CSS, .container.paused { animation: none; background-image: none; } */

const termsContent = `
TERMS OF SERVICE

Last Updated: December 2024

1. ACCEPTANCE OF TERMS
By accessing and using Chirp ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.

2. DESCRIPTION OF SERVICE
Chirp is a social media platform that allows users to:
- Create and share posts, images, and stories
- Connect with other users and build professional networks
- Send direct messages and make voice/video calls
- Receive real-time notifications

3. USER ACCOUNTS
- You must be at least 13 years old to use this Service
- You are responsible for maintaining the confidentiality of your account
- You agree to provide accurate and complete information
- You may not use another person's account without permission

4. USER CONDUCT
You agree NOT to:
- Post harmful, threatening, or harassing content
- Impersonate any person or entity
- Upload malicious code or viruses
- Spam or send unsolicited messages
- Violate any applicable laws or regulations
- Infringe on intellectual property rights

5. CONTENT OWNERSHIP
- You retain ownership of content you post
- By posting, you grant Chirp a license to display your content
- Chirp may remove content that violates these terms

6. PRIVACY
Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.

7. TERMINATION
Chirp reserves the right to terminate or suspend your account at any time for violations of these terms.

8. DISCLAIMER OF WARRANTIES
The Service is provided "as is" without warranties of any kind.

9. LIMITATION OF LIABILITY
Chirp shall not be liable for any indirect, incidental, or consequential damages.

10. CHANGES TO TERMS
We may modify these terms at any time. Continued use after changes constitutes acceptance.

11. CONTACT
For questions about these Terms, contact us at support@chirp.app

© ${new Date().getFullYear()} Chirp. All rights reserved.
`;

const privacyContent = `
PRIVACY POLICY

Last Updated: December 2024

1. INTRODUCTION
Chirp ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.

2. INFORMATION WE COLLECT

Personal Information:
- Name and email address
- Profile picture and bio
- Posts, comments, and messages
- Connection and follower lists

Usage Information:
- Device information and IP address
- Browser type and operating system
- Pages visited and features used
- Time spent on the platform

3. HOW WE USE YOUR INFORMATION
We use your information to:
- Provide and maintain the Service
- Personalize your experience
- Send notifications and updates
- Improve our platform
- Ensure security and prevent fraud
- Comply with legal obligations

4. INFORMATION SHARING
We may share your information with:
- Other users (based on your privacy settings)
- Service providers who assist our operations
- Law enforcement when required by law
- Business partners with your consent

5. DATA SECURITY
We implement industry-standard security measures including:
- Encryption of data in transit and at rest
- Regular security audits
- Access controls and authentication
- Secure data centers

6. YOUR RIGHTS
You have the right to:
- Access your personal data
- Correct inaccurate information
- Delete your account and data
- Export your data
- Opt-out of marketing communications

7. COOKIES AND TRACKING
We use cookies and similar technologies to:
- Remember your preferences
- Analyze usage patterns
- Provide personalized content

8. CHILDREN'S PRIVACY
Our Service is not intended for children under 13. We do not knowingly collect data from children.

9. INTERNATIONAL TRANSFERS
Your data may be transferred to and processed in countries other than your own.

10. DATA RETENTION
We retain your data for as long as your account is active or as needed to provide services.

11. THIRD-PARTY LINKS
Our Service may contain links to third-party sites. We are not responsible for their privacy practices.

12. CHANGES TO THIS POLICY
We may update this policy periodically. We will notify you of significant changes.

13. CONTACT US
For privacy-related questions:
Email: privacy@chirp.app

Developer: Fahad Khan (@cybe4sent1nel)

© ${new Date().getFullYear()} Chirp. All rights reserved.
`;

const LegalModal = ({ isOpen, onClose, type, onAgree }) => {
  const [canAgree, setCanAgree] = useState(false);
  const contentRef = useRef(null);

  const scrollRaf = useRef(null);

  const handleScroll = () => {
    if (!contentRef.current) return;
    if (scrollRaf.current) return;
    scrollRaf.current = requestAnimationFrame(() => {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      setCanAgree(scrollTop + clientHeight >= scrollHeight - 20);
      scrollRaf.current = null;
    });
  };

  useEffect(() => {
    setCanAgree(false);
    return () => {
      if (scrollRaf.current) {
        cancelAnimationFrame(scrollRaf.current);
      }
    };
  }, [isOpen, type]);

  if (!isOpen) return null;

  const content = type === "terms" ? termsContent : privacyContent;
  const title = type === "terms" ? "Terms of Service" : "Privacy Policy";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>
        
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-gray-300 text-sm leading-relaxed whitespace-pre-line"
        >
          {content}
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-between items-center">
          <p className="text-gray-500 text-sm">
            {canAgree ? "You can now agree" : "Scroll to read the entire document"}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 border border-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onAgree();
                onClose();
              }}
              disabled={!canAgree}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                canAgree
                  ? "bg-green-600 hover:bg-green-500 text-white cursor-pointer"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              I Agree
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [agreed, setAgreed] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      navigate("/");
    }
  }, [isSignedIn, navigate]);

  useEffect(() => {
    if (termsAgreed && privacyAgreed) {
      setAgreed(true);
    }
  }, [termsAgreed, privacyAgreed]);

  const handleTermsClick = (e) => {
    e.preventDefault();
    setModalType("terms");
  };

  const handlePrivacyClick = (e) => {
    e.preventDefault();
    setModalType("privacy");
  };

  const handleModalAgree = () => {
    if (modalType === "terms") {
      setTermsAgreed(true);
      setModalType(null);
      // Auto-show privacy modal after terms
      setTimeout(() => {
        if (!privacyAgreed) {
          setModalType("privacy");
        }
      }, 300);
    } else if (modalType === "privacy") {
      setPrivacyAgreed(true);
      setModalType(null);
    }
  };



  return (
    <div className="min-h-screen bg-black relative">
      {!modalType && <Pattern />}

      <LegalModal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        type={modalType}
        onAgree={handleModalAgree}
      />

      <div className="relative z-10 min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Left side: Logo */}
        <div className="flex items-center justify-center p-10">
          <img
            src="/LOGOO.png"
            alt="Chirp Logo"
            className="w-64 md:w-80 lg:w-96 drop-shadow-2xl"
          />
        </div>

        {/* Right side: Auth content */}
        <div className="flex flex-col items-start justify-center p-8 md:p-12 lg:p-16">
          <div className="max-w-lg">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
              Find your flock & be heard above the noise
            </h1>

            <p className="text-gray-400 text-lg md:text-xl mb-8">
              Create your free account to connect with professionals, join
              conversations, and showcase your work.
            </p>

            {/* Terms checkbox */}
            <div className="mb-8">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    if (e.target.checked && (!termsAgreed || !privacyAgreed)) {
                      if (!termsAgreed) {
                        setModalType("terms");
                      } else if (!privacyAgreed) {
                        setModalType("privacy");
                      }
                    } else {
                      setAgreed(e.target.checked);
                      if (!e.target.checked) {
                        setTermsAgreed(false);
                        setPrivacyAgreed(false);
                      }
                    }
                  }}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-gray-300 text-sm leading-relaxed">
                  I agree to the{" "}
                  <button
                    onClick={handleTermsClick}
                    className={`hover:underline transition ${
                      termsAgreed ? "text-green-400" : "text-amber-400"
                    }`}
                  >
                    Terms of Service {termsAgreed && "✓"}
                  </button>{" "}
                  and{" "}
                  <button
                    onClick={handlePrivacyClick}
                    className={`hover:underline transition ${
                      privacyAgreed ? "text-green-400" : "text-amber-400"
                    }`}
                  >
                    Privacy Policy {privacyAgreed && "✓"}
                  </button>
                </span>
              </label>
              {(!termsAgreed || !privacyAgreed) && (
                <p className="text-gray-500 text-xs mt-2 ml-8">
                  Click each link and scroll to the bottom to agree
                </p>
              )}
            </div>

            {/* Buttons */}
             <div className="flex flex-col sm:flex-row gap-4">
               <AnimatedButton
                 label="Sign up"
                 onClick={() => { console.log('Login.jsx: Sign up clicked - navigating to /auth?mode=signup&agreed=1'); navigate('/auth?mode=signup&agreed=1'); }}
                 disabled={!agreed}
                 color="#fec195"
                 textColor="#181818"
                 shadowColor="#fec1958c"
               />

               <AnimatedButton
                 label="Sign in"
                 onClick={() => { console.log('Login.jsx: Sign in clicked - navigating to /auth?mode=login&agreed=1'); navigate('/auth?mode=login&agreed=1'); }}
                 disabled={!agreed}
                 color="#4ade80"
                 textColor="#ffffff"
                 shadowColor="#4ade8099"
               />
             </div>

            {/* Continue with Clerk */}
            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/auth?mode=clerk')}
                disabled={!agreed}
                className={`text-sm transition ${
                  agreed
                    ? "text-gray-400 hover:text-white hover:underline"
                    : "text-gray-600 cursor-not-allowed"
                }`}
              >
                Or continue with Clerk Authentication →
              </button>
            </div>

            {/* Stars decoration */}
            <div className="flex items-center gap-1 mt-10">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-transparent fill-amber-500"
                  />
                ))}
              <span className="text-gray-400 ml-2 text-sm">
                Trusted by thousands of creators
              </span>
            </div>
            {/* Footer - visible app name and policy links for OAuth verification */}
            <div className="mt-6 text-sm text-gray-500">
              <strong>CHIRP</strong> — <a href="/privacy-policy" className="hover:underline text-amber-300">Privacy Policy</a> · <a href="/terms-of-service" className="hover:underline text-amber-300">Terms</a>
            </div>          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
