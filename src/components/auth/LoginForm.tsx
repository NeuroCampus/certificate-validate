import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout } = useAuth();
  const { toast } = useToast();

  // Handle Google OAuth2 redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userData = params.get('user');
    const profileData = params.get('profile');

    if (token && userData && profileData) {
      try {
        const user = JSON.parse(userData);
        const profile = JSON.parse(profileData);
        login(token, user, profile);
        navigate("/dashboard", { replace: true });
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Google Login Failed",
          description: "Invalid Google authentication data",
        });
      }
    }
  }, [location, login, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/signin/`,
        { email, password }
      );
      const { token, user, profile } = response.data;
      login(token, user, profile);
      navigate("/dashboard");
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.first_name || user.email}!`,
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "An error occurred during login";
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMsg,
      });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_GOOGLE_AUTH_URL}`;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Sign in to CertifyChain
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Access your blockchain certificates and rankings
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4 rounded-md shadow-sm">
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="mt-1 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-primary hover:text-primary/80">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
            Sign in
          </Button>
        </div>
      </form>

      <div className="mt-4 space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
        >
          Sign in with Google
        </Button>
        {user && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            Logout
          </Button>
        )}
      </div>
    </div>
  );
}