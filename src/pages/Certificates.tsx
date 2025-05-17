import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { CertificateTable } from "@/components/certificates/CertificateTable";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Certificates() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar isMobile={isMobile} />
      <div className={`${!isMobile ? "lg:pl-64" : ""} p-6 md:p-8`}>
        <div className="max-w-6xl mx-auto">
          <CertificateTable />
        </div>
      </div>
    </div>
  );
}