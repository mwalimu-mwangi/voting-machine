import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, File, X } from "lucide-react";

export interface FileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileChange?: (file: File | null) => void;
  label?: string;
  buttonText?: string;
  accept?: string;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, onFileChange, label, buttonText = "Choose file", accept, ...props }, ref) => {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setSelectedFile(file);
      if (onFileChange) {
        onFileChange(file);
      }
    };

    const handleClearFile = () => {
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      if (onFileChange) {
        onFileChange(null);
      }
    };

    return (
      <div className={cn("space-y-2", className)}>
        {label && <Label htmlFor={props.id}>{label}</Label>}
        <div className="flex items-center gap-2">
          <input
            type="file"
            className="sr-only"
            ref={(e) => {
              // Handle both refs
              if (typeof ref === "function") {
                ref(e);
              } else if (ref) {
                ref.current = e;
              }
              inputRef.current = e;
            }}
            onChange={handleFileChange}
            accept={accept}
            {...props}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            {buttonText}
          </Button>
          {selectedFile && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/10 text-secondary">
              <File className="h-4 w-4" />
              <span className="text-sm truncate max-w-[200px]">
                {selectedFile.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClearFile}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

export { FileInput };
