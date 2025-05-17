import { useState, useEffect } from "react";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle Google OAuth callback
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        login(token, userData);
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to parse Google auth data', err);
      }
    }
  }, [searchParams, login, navigate]);

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Welcome to CertifyChain
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your blockchain-powered certificate management solution
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <GoogleLoginButton />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              {isSignUp ? <SignUpForm /> : <LoginForm />}
            </div>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>

            <div className="flex items-center justify-center mt-4">
              <div className="text-center text-sm">
                <p className="text-gray-600">
                  By signing up, you agree to our{" "}
                  <a href="#" className="font-medium text-primary hover:text-primary/80">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="font-medium text-primary hover:text-primary/80">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Image/illustration */}
      <div className="hidden md:flex md:flex-1 bg-primary">
        <div className="w-full h-full flex flex-col items-center justify-center text-white p-16">
          <div className="text-center max-w-lg">
            <h1 className="text-3xl font-bold mb-6">Blockchain-Verified Certificates</h1>
            <p className="text-lg mb-8 text-white/90">
              Securely manage your academic achievements with our blockchain-powered 
              certificate management system.
            </p>
            
            <div className="space-y-4 mt-12">
              <div className="flex items-start space-x-3 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <div className="mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-semibold mb-1">Secure Verification</h4>
                  <p className="text-xs text-white/70">All certificates are verified and stored on the blockchain</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <div className="mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-semibold mb-1">Academic Rankings</h4>
                  <p className="text-xs text-white/70">See where you stand with our dynamic ranking system</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                <div className="mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-semibold mb-1">Automated Recognition</h4>
                  <p className="text-xs text-white/70">Our OCR technology automatically processes your certificates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}