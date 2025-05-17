import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export function UploadDropZone() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file format",
        description: "Please upload a PDF, JPG, or PNG file",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
    toast({
      title: "File selected",
      description: `${file.name} is ready for processing`,
    });
  };

  const processFile = async () => {
    if (!selectedFile || !token) return;

    setProcessing(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("certificate_file", selectedFile);

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/certificates/upload/`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(percent);
            }
          },
        }
      );

      setProcessing(false);
      setSelectedFile(null);
      setProgress(0);
      toast({
        title: "Certificate uploaded",
        description: response.data.message,
      });
    } catch (err: any) {
      setProcessing(false);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.response?.data?.error || "Failed to upload certificate",
      });
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <div
        className={`border-2 rounded-lg p-8 text-center ${
          dragActive ? "border-primary drag-active" : "border-dashed border-gray-300"
        } transition-all h-[300px] flex flex-col items-center justify-center`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <>
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Upload size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-1">Drag and drop your certificate</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Support for PDF, JPG, and PNG files up to 5MB
            </p>
            <label htmlFor="fileInput">
              <div className="inline-flex cursor-pointer">
                <Button variant="outline" className="relative">
                  <input
                    id="fileInput"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  Browse files
                </Button>
              </div>
            </label>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-primary/10 mb-1">
              <File size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-medium">{selectedFile.name}</h3>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {processing && (
              <>
                <div className="w-full max-w-xs mt-4">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Processing...</span>
                    <span>{progress}%</span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin mr-1" />
                  {progress < 50 ? "Uploading..." : "Verifying on blockchain..."}
                </div>
              </>
            )}
            {!processing && (
              <div className="flex space-x-3">
                <Button onClick={processFile} className="bg-primary">
                  Process Certificate
                </Button>
                <Button variant="outline" onClick={resetUpload}>
                  Change File
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <h4 className="font-medium mb-2">What happens after upload?</h4>
        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
          <li>Our OCR system extracts certificate information</li>
          <li>You'll be able to verify the extracted data</li>
          <li>Certificate is verified and added to the blockchain</li>
          <li>Your ranking will be updated based on certificate weightage</li>
        </ol>
      </div>
    </div>
  );
}