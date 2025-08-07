import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image } from "lucide-react";
import { useLazyQuery } from "@apollo/client";
import { GET_UPLOAD_URL, Query, QueryGetUploadUrlArgs } from "@/graphql";
import { showError, showSuccess } from "@/hooks/useToastMessages.tsx";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  bucket: string;
  path?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export const ImageUpload = ({
  value,
  onChange,
  bucket,
  accept = "image/*",
  maxSize = 5,
  className = "",
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [getUploadUrl, { loading }] = useLazyQuery<
    Query,
    QueryGetUploadUrlArgs
  >(GET_UPLOAD_URL, { fetchPolicy: "network-only" });

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Invalid File Type", "Please select an image file");
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      showError("File Too Large", `File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);

    getUploadUrl({ variables: { fileType: file.type } })
      .then((res) => {
        fetch(res.data.getUploadUrl.url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        }).then(() => {
          const publicUrl = `https://memaproducts.s3.amazonaws.com/${res.data.getUploadUrl.key}`;

          onChange(publicUrl);

          showSuccess("Image uploaded successfully");
        });
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const handleRemove = async () => {
    if (value) {
      try {
        // Extract file path from URL
        const url = new URL(value);
        const filePath = url.pathname.split("/").pop();

        if (filePath) {
          await supabase.storage.from(bucket).remove([filePath]);
        }
      } catch (error) {
        console.error("Error removing file:", error);
      }
    }
    onChange(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className={`space-y-2 m-0 ${className}`}>
      <Label>Product Image</Label>

      {value ? (
        <div className="relative py-2 rounded-lg border">
          <img
            src={value}
            alt="Product"
            className="w-full h-24 object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-2 w-2" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-4 pb-2 text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-2">
            <Image className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                Drag and drop an image here, or click to select
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Choose Image"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      <p className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, WebP. Max size: {maxSize}MB
      </p>
    </div>
  );
};
