import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Leaderboard() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar isMobile={isMobile} />
      <div className={`${!isMobile ? "lg:pl-64" : ""} p-6 md:p-8`}>
        <div className="max-w-6xl mx-auto">
          <LeaderboardTable />
        </div>
      </div>
    </div>
  );
}