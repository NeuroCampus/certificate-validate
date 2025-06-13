import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface Certificate {
  id: number;
  name: string;
  issuer: string;
  category: string;
  domain: string;
  weightage: number;
  status: string;
  upload_date: string;
  certificate_file?: string;
}

export function CertificateTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/certificates/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        setCertificates(response.data.certificates); // Use API response directly
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.response?.data?.error || "Failed to fetch certificates",
        });
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchCertificates();
  }, [token, toast]);

  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCertificates = [...filteredCertificates].sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const handleViewCertificate = (certificate: Certificate) => {
    if (certificate.certificate_file) {
      window.open(certificate.certificate_file, "_blank");
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Certificate file not available",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Certificates</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search certificates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-[250px]"
          />
        </div>
      </div>
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" className="p-0 font-medium text-xs" onClick={() => requestSort("name")}>
                  Certificate Name <ArrowUpDown size={14} className="ml-1" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 font-medium text-xs" onClick={() => requestSort("category")}>
                  Category <ArrowUpDown size={14} className="ml-1" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 font-medium text-xs" onClick={() => requestSort("domain")}>
                  Domain <ArrowUpDown size={14} className="ml-1" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 font-medium text-xs" onClick={() => requestSort("weightage")}>
                  Weightage <ArrowUpDown size={14} className="ml-1" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="p-0 font-medium text-xs" onClick={() => requestSort("status")}>
                  Status <ArrowUpDown size={14} className="ml-1" />
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Loading certificates...
                </TableCell>
              </TableRow>
            ) : sortedCertificates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No certificates found.
                </TableCell>
              </TableRow>
            ) : (
              sortedCertificates.map((certificate) => (
                <TableRow key={certificate.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="font-medium">{certificate.name}</div>
                    <div className="text-xs text-muted-foreground">{certificate.issuer}</div>
                  </TableCell>
                  <TableCell>{certificate.category}</TableCell>
                  <TableCell>{certificate.domain}</TableCell>
                  <TableCell>{certificate.weightage}</TableCell>
                  <TableCell>
                    <StatusBadge status={certificate.status} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewCertificate(certificate)}
                      title="View Certificate"
                    >
                      <FileText size={16} className="text-primary" />
                    </Button>
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

function StatusBadge({ status }: { status: string }) {
  if (status === "Verified") {
    return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Verified</Badge>;
  }
  if (status === "Pending") {
    return <Badge variant="outline" className="bg-progress/10 text-progress border-progress/20">Pending</Badge>;
  }
  return <Badge variant="outline" className="bg-failed/10 text-failed border-failed/20">Failed</Badge>;
}