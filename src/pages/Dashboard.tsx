import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentCertificates } from "@/components/dashboard/RecentCertificates";
import { RankCard } from "@/components/dashboard/RankCard";
import { ProgressRing } from "@/components/dashboard/ProgressChart";
import { FileText, Trophy, Award } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

interface DashboardData {
  stats: {
    total_weightage: number;
    total_certificates: number;
    current_rank: number;
  };
  recent_certificates: Array<{
    id: number;
    name: string;
    status: string;
    upload_date: string;
  }>;
  domain_progress: Array<{
    name: string;
    certificate_count: number;
    total_weightage: number;
  }>;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/`, {
          headers: { Authorization: `Token ${localStorage.getItem('authToken')}` }
        });
        setDashboardData(response.data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dashboardData) return <div>No data available</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar isMobile={isMobile} />
      
      <div className={`${!isMobile ? "lg:pl-64" : ""} p-4 md:p-6`}>
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.first_name || 'User'}
            </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Weightage"
              value={dashboardData.stats.total_weightage.toFixed(1)}
              icon={<Award size={18} />}
            />
            <StatCard
              title="Total Certificates"
              value={dashboardData.stats.total_certificates}
              icon={<FileText size={18} />}
            />
            <StatCard
              title="Current Rank"
              value={dashboardData.stats.current_rank}
              icon={<Trophy size={18} />}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <RecentCertificates />
            </div>
            <div>
              <RankCard />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {dashboardData.domain_progress
              .filter((domain) => domain.name !== 'General')
              .map((domain, index) => (
                <ProgressRing
                  key={index}
                  progress={(domain.total_weightage / 100) * 100} // Adjust based on max weightage
                  size={130}
                  strokeWidth={12}
                  label={domain.name}
                  value={`${Math.round((domain.total_weightage / 100) * 100)}%`}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}