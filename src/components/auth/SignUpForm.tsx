import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must agree to the terms and conditions",
      });
      return;
    }
    try {
      const [firstName, ...lastNameParts] = name.trim().split(" ");
      const lastName = lastNameParts.join(" ");
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/signup/`,
        {
          email,
          password,
          first_name: firstName || "",
          last_name: lastName || "",
        }
      );
      const { token, user, profile } = response.data;
      login(token, user, profile);
      navigate("/dashboard");
      toast({
        title: "Signup Successful",
        description: `Welcome, ${user.first_name || user.email}! Your account has been created.`,
      });
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "An error occurred during signup";
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMsg,
      });
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4 rounded-md shadow-sm">
        <div>
          <Label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
              autoComplete="new-password"
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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="terms"
          checked={termsAccepted}
          onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
        />
        <label
          htmlFor="terms"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          I agree to the terms and conditions
        </label>
      </div>

      <div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
          Create account
        </Button>
      </div>
    </form>
  );
}