import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Upload, 
  Trophy, 
  UserRound, 
  FileText, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  isMobile?: boolean;
}

export function DashboardSidebar({ isMobile = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(isMobile);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {isMobile && (
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleSidebar} 
          className="fixed top-4 left-4 z-50 lg:hidden"
        >
          <Menu size={20} />
        </Button>
      )}
      
      <div className={`
        fixed top-0 left-0 z-40 h-full bg-white border-r transition-all duration-300 shadow-sm
        ${collapsed ? "w-0 overflow-hidden" : "w-64"}
        ${isMobile ? "lg:hidden" : "hidden lg:block"}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="font-bold text-lg">CertifyChain</span>
            </div>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <X size={20} />
              </Button>
            )}
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <Link 
              to="/dashboard" 
              className={`flex items-center px-3 py-2 rounded-md hover:bg-gray-100 ${isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:text-primary'}`}
              onClick={() => isMobile && setCollapsed(true)}
            >
              <LayoutDashboard size={20} className="mr-3" />
              <span>Dashboard</span>
            </Link>
            <Link 
              to="/upload" 
              className={`flex items-center px-3 py-2 rounded-md hover:bg-gray-100 ${isActive('/upload') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:text-primary'}`}
              onClick={() => isMobile && setCollapsed(true)}
            >
              <Upload size={20} className="mr-3" />
              <span>Upload Certificate</span>
            </Link>
            <Link 
              to="/certificates" 
              className={`flex items-center px-3 py-2 rounded-md hover:bg-gray-100 ${isActive('/certificates') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:text-primary'}`}
              onClick={() => isMobile && setCollapsed(true)}
            >
              <FileText size={20} className="mr-3" />
              <span>My Certificates</span>
            </Link>
            <Link 
              to="/leaderboard" 
              className={`flex items-center px-3 py-2 rounded-md hover:bg-gray-100 ${isActive('/leaderboard') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:text-primary'}`}
              onClick={() => isMobile && setCollapsed(true)}
            >
              <Trophy size={20} className="mr-3" />
              <span>Leaderboard</span>
            </Link>
            <Link 
              to="/profile" 
              className={`flex items-center px-3 py-2 rounded-md hover:bg-gray-100 ${isActive('/profile') ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:text-primary'}`}
              onClick={() => isMobile && setCollapsed(true)}
            >
              <UserRound size={20} className="mr-3" />
              <span>My Profile</span>
            </Link>
          </nav>
          
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              className="flex w-full items-center justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut size={20} className="mr-3" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}