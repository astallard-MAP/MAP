
"use client";

import { useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "./ui/button";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Progress } from "./ui/progress";
import { uploadFile } from "@/firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Upload, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type UrlOrUploadFieldProps = {
  form: any;
  fieldName: string;
  label: string;
  fileType: "image" | "video" | "document";
  uploadPath: string;
  compact?: boolean;
};

export function UrlOrUploadField({
  form,
  fieldName,
  label,
  fileType,
  uploadPath,
  compact = false,
}: UrlOrUploadFieldProps) {
  const [inputType, setInputType] = useState<"url" | "upload">("url");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploadProgress(0);
    try {
      const url = await uploadFile(file, uploadPath, setUploadProgress);
      form.setValue(fieldName, url, { shouldValidate: true, shouldDirty: true });
      toast({
        title: "Upload Successful",
        description: `${label || "Asset"} has been uploaded.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: `Could not upload ${label || "file"}.`,
      });
    } finally {
      setUploadProgress(null);
    }
  };

  const acceptString =
    fileType === "image"
      ? "image/png, image/jpeg, image/gif"
      : fileType === "video"
      ? "video/mp4, video/quicktime"
      : "application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className={cn(compact ? "space-y-1" : "space-y-2")}>
          {!compact && label && <FormLabel>{label}</FormLabel>}
          <RadioGroup
            value={inputType}
            onValueChange={(value: "url" | "upload") => setInputType(value)}
            className={cn("flex items-center space-x-4", compact ? "scale-75 origin-left" : "pb-2")}
          >
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <RadioGroupItem value="url" />
              </FormControl>
              <FormLabel className="font-normal text-xs">
                <LinkIcon className="inline-block mr-1 h-3 w-3" />
                URL
              </FormLabel>
            </FormItem>
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <RadioGroupItem value="upload" />
              </FormControl>
              <FormLabel className="font-normal text-xs">
                <Upload className="inline-block mr-1 h-3 w-3" />
                Upload
              </FormLabel>
            </FormItem>
          </RadioGroup>

          {inputType === "url" ? (
            <FormControl>
              <Input
                placeholder={compact ? "URL" : `https://example.com/${label?.toLowerCase().replace(" ", "-") || "file"}`}
                {...field}
                className={cn(compact ? "h-8 text-xs" : "h-10")}
              />
            </FormControl>
          ) : (
            <div className="space-y-2">
              <FormControl>
                <Input
                  type="file"
                  accept={acceptString}
                  onChange={(e) =>
                    e.target.files && handleFileUpload(e.target.files[0])
                  }
                  className={cn("cursor-pointer", compact ? "h-8 text-[10px]" : "h-10")}
                />
              </FormControl>
              {uploadProgress !== null && (
                <Progress value={uploadProgress} className="w-full" />
              )}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
