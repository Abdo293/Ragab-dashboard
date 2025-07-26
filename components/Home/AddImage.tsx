"use client";

import { useEffect, useRef, useState } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { createClient } from "@/utils/supabase/client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  Upload,
  Trash2,
  ImageIcon,
  X,
} from "lucide-react";
import Image from "next/image";

interface DynamicImageUploadProps {
  id: string; // The database record ID (e.g., "hero-section")
  column: any; // The column name (e.g., "image", "logo")
  title?: string; // Display title
  description?: string; // Optional description
  imageHeight?: string; // CSS height class for image display
  className?: string; // Additional styling
}

export function DynamicImageUpload({
  id,
  column,
  title,
  description,
  imageHeight = "h-40",
  className = "max-w-lg mx-auto",
}: DynamicImageUploadProps) {
  const t = useTranslations("imageUpload");

  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Load current image from Supabase
  useEffect(() => {
    const fetchImage = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("home_content")
        .select(column)
        .eq("id", id)
        .single();

      if (data?.[column]) {
        setCurrentImage(data[column]);
      }
    };

    fetchImage();
  }, [id, column]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    processFile(selected);
  };

  const processFile = (selected: File | null) => {
    if (selected && selected.type.startsWith("image/")) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const extractPublicId = (url: string): string => {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    return filename.split(".")[0]; // zwdxmjldqrqpanl3wyeh
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const { url: imageUrl, public_id, type } = await uploadToCloudinary(file);
      const publicId = extractPublicId(imageUrl);
      const supabase = createClient();

      const columnToUpdate = {
        [column]: imageUrl,
        [`${column}_public_id`]: publicId,
      };

      const { data: existingRow } = await supabase
        .from("home_content")
        .select("id")
        .eq("id", id)
        .single();

      if (!existingRow) {
        const { error } = await supabase
          .from("home_content")
          .insert([{ id, ...columnToUpdate }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("home_content")
          .update(columnToUpdate)
          .eq("id", id);
        if (error) throw error;
      }

      setCurrentImage(imageUrl);
      setPreview(null);
      setFile(null);
      setSuccessMsg(t("success"));

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(t("error"));
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // احضر public_id أولاً
      const { data: row } = await supabase
        .from("home_content")
        .select(`${column}_public_id`)
        .eq("id", id)
        .single();

      const publicId = (row as any)?.[`${column}_public_id`];

      // احذف من Cloudinary عبر API
      if (publicId) {
        await fetch("/api/delete-cloudinary-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: publicId }),
        });
      }

      // ثم احذف من Supabase
      const updateData = {
        [column]: null,
        [`${column}_public_id`]: null,
      };

      const { error } = await supabase
        .from("home_content")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      setCurrentImage(null);
      toast.success(t("deleted"), {
        className: "bg-green-100 text-green-800 border border-green-400",
        icon: <CheckCircle className="text-green-600" />,
      });
    } catch (err) {
      console.error(err);
      toast.error(t("error"), {
        className: "bg-red-100 text-red-800 border border-red-400",
        icon: <AlertTriangle className="text-red-600" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelPreview = () => {
    setPreview(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success/Error Messages */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-800 dark:text-green-200">
              {successMsg}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-800 dark:text-red-200">
              {errorMsg}
            </span>
          </div>
        )}

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Current Image */}
        {currentImage && !preview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Current Image
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
                className="cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {t("delete")}
              </Button>
            </div>
            <Image
              src={currentImage}
              alt={`Current ${title}`}
              width={400}
              height={200}
              className={`w-full ${imageHeight} object-cover rounded-md border`}
            />
          </div>
        )}

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !preview && inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${
              isDragOver
                ? "border-primary bg-primary/5"
                : preview
                ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }
          `}
        >
          {preview ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready to upload
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelPreview();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Image
                src={preview}
                alt="Preview"
                width={400}
                height={200}
                className="w-full h-32 object-cover rounded-md"
              />

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {t("uploading")}...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {t("upload")}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-medium">
                  {isDragOver ? "Drop image here" : t("choose")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to browse
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
