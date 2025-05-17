import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface LeaderboardEntry {
  user__email: string;
  cert_total_weightage: number;
  certificate_count: number;
  current_rank: number;
}

interface DisplayEntry {
  id: number;
  name: string;
  weightage: number;
  rank: number;
  department: string;
  trend: "up" | "down" | "same";
  avatar: string;
}

export function LeaderboardTable() {
  const [leaderboard, setLeaderboard] = useState<DisplayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/leaderboard/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        const data: LeaderboardEntry[] = response.data.leaderboard;
        setLeaderboard(
          data.map((entry, index) => {
            const email = entry.user__email;
            const name = email.split("@")[0].split(".").join(" ");
            const department =
              Math.random() > 0.66
                ? "Computer Science"
                : Math.random() > 0.5
                ? "Data Science"
                : "Information Technology";
            const trend =
              entry.certificate_count > 5
                ? "up"
                : entry.certificate_count < 3
                ? "down"
                : "same";
            return {
              id: index + 1,
              name,
              weightage: entry.cert_total_weightage,
              rank: entry.current_rank,
              department,
              trend,
              avatar: `https://ui-avatars.com/api/?name=${name.replace(" ", "+")}`,
            };
          })
        );
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.response?.data?.error || "Failed to fetch leaderboard",
        });
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchLeaderboard();
  }, [token, toast]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <p className="text-muted-foreground">Top performers based on certificate weightage</p>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Total Weightage</TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Loading leaderboard...
                </TableCell>
              </TableRow>
            ) : leaderboard.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No leaderboard data available.
                </TableCell>
              </TableRow>
            ) : (
              leaderboard.map((student) => (
                <TableRow key={student.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {student.rank <= 3 ? (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
                        {student.rank}
                      </div>
                    ) : (
                      student.rank
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={student.avatar} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50">
                      {student.department}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{student.weightage}</TableCell>
                  <TableCell>
                    {student.trend === "up" && (
                      <div className="flex items-center text-success">
                        <ArrowUp size={16} />
                        <span className="ml-1">Up</span>
                      </div>
                    )}
                    {student.trend === "down" && (
                      <div className="flex items-center text-failed">
                        <ArrowDown size={16} />
                        <span className="ml-1">Down</span>
                      </div>
                    )}
                    {student.trend === "same" && (
                      <div className="flex items-center text-muted-foreground">
                        <Minus size={16} />
                        <span className="ml-1">Same</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}