import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface ProfileData {
  name: string;
  email: string;
  department: string;
  joinDate: string;
  stats: {
    rank: number;
    totalWeightage: number;
    certificatesCount: number;
  };
  domains: { name: string; certificate_count: number; total_weightage: number }[];
  rankHistory: { month: string; rank: number }[];
}

export function ProfileDetails() {
  const [userData, setUserData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/profile/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        const { profile, domains, rank_history } = response.data;
        const name = `${profile.first_name} ${profile.last_name}`.trim();
        setUserData({
          name,
          email: profile.email,
          department: profile.department || "Unknown",
          joinDate: new Date(profile.join_date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          stats: {
            rank: profile.current_rank,
            totalWeightage: profile.total_weightage,
            certificatesCount: domains.reduce(
              (sum: number, d: any) => sum + d.certificate_count,
              0
            ),
          },
          domains: domains.map((d: any) => ({
            name: d.name,
            certificates: d.certificate_count,
            weightage: d.total_weightage,
          })),
          rankHistory: rank_history.map((r: any, i: number) => ({
            month: new Date(r.month).toLocaleDateString("en-US", { month: "short" }),
            rank: r.rank,
          })),
        });
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.response?.data?.error || "Failed to fetch profile",
        });
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token, toast]);

  if (loading) {
    return <div className="text-center py-6">Loading profile...</div>;
  }

  if (!userData) {
    return <div className="text-center py-6 text-red-500">Failed to load profile</div>;
  }

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary to-primary/70"></div>
        <CardContent className="relative pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end -mt-16 mb-4 sm:mb-8 gap-4">
            <Avatar className="w-32 h-32 border-4 border-white">
              <AvatarImage
                src={`https://ui-avatars.com/api/?name=${userData.name.replace(" ", "+")}&size=128`}
                alt={userData.name}
              />
              <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">{userData.name}</h2>
              <div className="text-muted-foreground">{userData.email}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-muted/50">
                  {userData.department}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1"
                >
                  <Trophy size={12} />
                  Rank {userData.stats.rank}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="domains">Domain Breakdown</TabsTrigger>
          <TabsTrigger value="progress">Rank Progression</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <Trophy className="w-8 h-8 text-primary mb-2" />
                  <div className="text-xl font-bold">{userData.stats.rank}</div>
                  <div className="text-sm text-muted-foreground">Current Rank</div>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <Award className="w-8 h-8 text-primary mb-2" />
                  <div className="text-xl font-bold">{userData.stats.totalWeightage}</div>
                  <div className="text-sm text-muted-foreground">Total Weightage</div>
                </div>
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <BookOpen className="w-8 h-8 text-primary mb-2" />
                  <div className="text-xl font-bold">{userData.stats.certificatesCount}</div>
                  <div className="text-sm text-muted-foreground">Total Certificates</div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">User Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium">{userData.department}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="font-medium">{userData.joinDate}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{userData.email}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Domain Weightage Distribution</h3>
              <div className="space-y-4">
                {userData.domains.map((domain, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">{domain.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {domain.certificates} certificates
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{domain.weightage}</div>
                        <div className="text-sm text-muted-foreground">
                          {((domain.weightage / userData.stats.totalWeightage) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${(domain.weightage / userData.stats.totalWeightage) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Rank Progression</h3>
              <div className="h-60">
                <div className="flex h-full items-end">
                  {userData.rankHistory.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end group">
                      <div className="relative w-full">
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-black text-white text-xs rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Rank {item.rank}
                        </div>
                        <div
                          className="w-full bg-primary/80 hover:bg-primary transition-colors"
                          style={{ height: `${(1 - (item.rank / 50)) * 120}px` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{item.month}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-sm text-center mt-4 text-muted-foreground">
                Your rank has improved from {userData.rankHistory[0]?.rank || "N/A"} to{" "}
                {userData.stats.rank} in the last {userData.rankHistory.length} months
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}