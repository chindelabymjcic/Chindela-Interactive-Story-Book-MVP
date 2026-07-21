import { useRef, useState } from "react";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2, X } from "lucide-react";
import { MediaConstraints, type MediaCategory } from "@contracts/constants";

interface MediaUploaderProps {
  category: MediaCategory;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export function MediaUploader({ category, value, onChange, label }: MediaUploaderProps) {
  const { upload, progress, isUploading, error } = useMediaUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setLocalError(null);
    try {
      const { url } = await upload(file, category);
      onChange(url);
    } catch {
      // error state is surfaced via the hook's `error`
    }
  };

  const accept = MediaConstraints[category].mimeTypes.join(",");

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        {isUploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </div>
        ) : value ? (
          <div className="flex items-center justify-between gap-2">
            <MediaPreview url={value} category={category} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              aria-label="Remove media"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-3 text-muted-foreground">
            <UploadCloud className="h-6 w-6" />
            <p className="text-xs">Drag &amp; drop or click to upload</p>
          </div>
        )}
      </div>
      {(error || localError) && <p className="text-xs text-destructive">{error ?? localError}</p>}
    </div>
  );
}

function MediaPreview({ url, category }: { url: string; category: MediaCategory }) {
  if (category === "image") return <img src={url} alt="" className="h-12 w-12 rounded object-cover mx-auto" />;
  if (category === "audio") return <audio src={url} controls className="h-8 max-w-[200px]" />;
  if (category === "video") return <video src={url} className="h-12 rounded mx-auto" muted />;
  return <p className="text-xs text-gray-600 truncate max-w-[200px] mx-auto">{decodeURIComponent(url.split("/").pop() ?? url)}</p>;
}
