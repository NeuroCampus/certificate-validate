import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

interface Certificate {
  id: number;
  name: string;
  issuer: string;
  upload_date: string;
  status: string;
  domain: string;
}

export function RecentCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/certificates/`, {
          headers: { Authorization: `Token ${localStorage.getItem('authToken')}` }
        });
        setCertificates(response.data.certificates.slice(0, 5)); // Limit to 5 recent
      } catch (err) {
        setError('Failed to load-certificates');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Certificates</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="p-4 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
            >
              <div>
                <h4 className="font-medium">{cert.name}</h4>
                <div className="text-sm text-muted-foreground">{cert.issuer}</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="text-xs text-muted-foreground">
                  {new Date(cert.upload_date).toLocaleDateString()}
                </div>
                <StatusBadge status={cert.status} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") {
    return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Verified</Badge>;
  }
  if (status === "pending") {
    return <Badge variant="outline" className="bg-progress/10 text-progress border-progress/20">Pending</Badge>;
  }
  return <Badge variant="outline" className="bg-failed/10 text-failed border-failed/20">Failed</Badge>;
}