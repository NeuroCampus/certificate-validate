import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import axios from "axios";

interface RankData {
  current_rank: number;
  total_students: number;
  next_rank_progress: number;
}

export function RankCard() {
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankData = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/leaderboard/`, {
          headers: { Authorization: `Token ${localStorage.getItem('authToken')}` }
        });
        // Mock total_students and next_rank_progress as backend doesn't provide them
        const authUser = localStorage.getItem('authUser');
        const userEmail = authUser ? JSON.parse(authUser).email : null;
        const userRank = response.data.leaderboard.find((entry: any) => entry.user__email === userEmail);
        setRankData({
          current_rank: userRank?.current_rank || 26,
          total_students: response.data.leaderboard.length,
          next_rank_progress: 78 // Placeholder, calculate based on weightage if available
        });
      } catch (err) {
        setError('Failed to load rank data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!rankData) return <div>No rank data available</div>;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Rank</span>
          <Trophy size={20} className="text-primary" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="text-5xl font-bold text-primary mb-2">{rankData.current_rank}</div>
        <div className="text-sm text-muted-foreground">
          Out of {rankData.total_students} Students
        </div>
        <div className="w-full mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-muted-foreground">Next Rank: {rankData.current_rank - 1}</span>
            <span className="text-xs font-medium">{rankData.next_rank_progress}%</span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: `${rankData.next_rank_progress}%` }}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}