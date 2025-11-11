import { useRef, useState } from "react";
import { Upload, X, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  accept?: string;
  maxSizeMB?: number;
}

export const FileUpload = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  accept = "*",
  maxSizeMB = 10,
}: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: "Fichier trop volumineux",
        description: `Le fichier ne doit pas dépasser ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    onFileSelect(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-accent/50">
          <FileIcon className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFileRemove}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Joindre un fichier
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Taille maximale: {maxSizeMB}MB
      </p>
    </div>
  );
};
