import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { UploadDropZone } from "@/components/certificates/UploadDropZone";
import { useIsMobile } from "@/hooks/use-mobile";

export default function UploadCertificate() {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar isMobile={isMobile} />
      <div className={`${!isMobile ? "lg:pl-64" : ""} p-6 md:p-8`}>
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Upload Certificate</h1>
            <p className="text-muted-foreground">
              Add your certification to be verified and added to the blockchain
            </p>
          </header>
          <UploadDropZone />
        </div>
      </div>
    </div>
  );
}