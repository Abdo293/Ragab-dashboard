"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Upload,
  Image as ImageIcon,
  FileImage,
  X,
  Check,
  Folder,
  Grid3X3,
  Trash2,
  MoreVertical,
  Eye,
  Play,
  FileVideo,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import CategoryManager from "./CategoryManager";
import { useLocale, useTranslations } from "next-intl";

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
}

export function UploadImages() {
  const supabase = createClient();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());

  const t = useTranslations("portfolio");
  const locale = useLocale();

  // تحميل الأقسام والوسائط
  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: false });

      setCategories(categoriesData || []);

      // Fetch media items
      await fetchMediaItems();
    };
    fetchData();
  }, []);

  // Cleanup function for preview URLs
  useEffect(() => {
    return () => {
      files.forEach(({ preview }) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [files]);

  // تحميل الوسائط
  const fetchMediaItems = async () => {
    setIsLoadingMedia(true);
    const { data, error } = await supabase
      .from("media")
      .select(
        `
        *,
        categories (
          id,
          name_ar,
          name_en
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error) {
      setMediaItems(data || []);
    }
    setIsLoadingMedia(false);
  };

  // حذف الصورة
  const handleDeleteImage = async (
    imageId: string,
    imageUrl: string,
    publicId: string,
    type: "image" | "video"
  ) => {
    setDeletingItems((prev) => new Set(prev).add(imageId));

    try {
      // 🧨 استدعي API داخلي يمسح الصورة من Cloudinary
      const cloudDeleteRes = await fetch("/api/delete-cloudinary-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: publicId, resource_type: type }),
      });

      if (!cloudDeleteRes.ok) throw new Error("Cloudinary deletion failed");

      // ✅ احذف من Supabase بعد تأكيد الحذف من Cloudinary
      const { error } = await supabase.from("media").delete().eq("id", imageId);
      if (error) throw error;

      setMediaItems((prev) => prev.filter((item) => item.id !== imageId));
      toast.success(t("deleteSuccess"));
    } catch (err) {
      console.error("حذف الصورة فشل:", err);
      toast.error("فشل في حذف الصورة من Cloudinary أو قاعدة البيانات");
    } finally {
      setDeletingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileSelection(droppedFiles);
  };

  const handleFileSelection = (selectedFiles: File[]) => {
    const validFiles: FileWithPreview[] = [];

    selectedFiles.forEach((file) => {
      // Check file type
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        toast.error(`${file.name}: ${t("selectValidFile")}`);
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: ${t("fileBig")}`);
        return;
      }

      // Check if file already exists
      const fileExists = files.some(
        (f) => f.file.name === file.name && f.file.size === file.size
      );
      if (fileExists) {
        toast.error(`${file.name}: ${t("fileExists")}`);
        return;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substr(2, 9),
      });
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      toast.success(
        `${t("added")} ${validFiles.length} ${
          validFiles.length === 1 ? t("successFile") : t("successFiles")
        }`
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      handleFileSelection(selectedFiles);
    }
    // Reset input value to allow selecting the same files again
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const removeAllFiles = () => {
    files.forEach(({ preview }) => {
      URL.revokeObjectURL(preview);
    });
    setFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async () => {
    if (files.length === 0 || !selectedCategory) {
      toast.error(t("pleaseSelectFile"));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadIndex(0);

    const totalFiles = files.length;
    const uploadedFiles: any[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const { file } = files[i];
        setCurrentUploadIndex(i + 1);

        // Update progress for current file
        const baseProgress = (i / totalFiles) * 100;
        setUploadProgress(baseProgress + 10);

        const {
          url: imageUrl,
          public_id,
          type,
        } = await uploadToCloudinary(file);
        const extractPublicId = (url: string): string => {
          const parts = url.split("/");
          const filename = parts[parts.length - 1]; // zwdxmjldqrqpanl3wyeh.png
          return filename.split(".")[0]; // zwdxmjldqrqpanl3wyeh
        };

        const publicId = extractPublicId(imageUrl);

        setUploadProgress(baseProgress + 50);

        const { data, error } = await supabase.from("media").insert({
          title: file.name.split(".")[0],
          type,
          file_url: imageUrl,
          public_id,
          category_id: selectedCategory,
        }).select(`
  *,
  categories (
     id,
     name_ar,
     name_en
  )
`);

        if (error) throw error;

        if (data && data[0]) {
          uploadedFiles.push(data[0]);
        }

        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      // Add uploaded files to the beginning of the list
      setMediaItems((prev) => [...uploadedFiles.reverse(), ...prev]);

      setTimeout(() => {
        toast.success(`${t("uploaded")} ${totalFiles} ${t("successFile")} 🎉`);
        resetForm();
      }, 500);
    } catch (err) {
      console.error(err);
      toast.error(`${t("wrongUpload")} ${currentUploadIndex}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setCurrentUploadIndex(0);
    }
  };

  const resetForm = () => {
    files.forEach(({ preview }) => {
      URL.revokeObjectURL(preview);
    });
    setFiles([]);
    setSelectedCategory("");
  };

  const selectedCategoryName = categories.find(
    (cat) => cat.id.toString() === selectedCategory
  )?.[locale === "ar" ? "name_ar" : "name_en"];

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Category Manager Section */}
      <div>
        <CategoryManager />
      </div>

      <Separator className="my-8" />

      {/* Upload Section Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-blue-500/10">
            <Upload className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">
          {t("uploadImgVideo")}
        </h2>
        <p className="text-muted-foreground text-lg">
          {t("uploadPhotosVideos")}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <Card className="order-2 lg:order-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              {t("uploadNewFiles")}
            </CardTitle>
            <CardDescription>{t("selectCategoryAndUpload")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">{t("theCategory")}</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectAppropriateCategory")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {locale === "ar" ? cat.name_ar : cat.name_en}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {categories.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("noCategoriesAvailable")}
                </AlertDescription>
              </Alert>
            )}

            {/* File Upload Area */}
            <div className="space-y-2">
              <Label>
                {t("files")} ({files.length} {t("selected")})
              </Label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                } ${
                  files.length > 0
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                    : ""
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {files.length === 0 ? (
                  <>
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">{t("dragTheFile")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("supportedFormats")}: JPG, PNG, GIF, WebP, MP4, MOV
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("maxLength")}
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploading}
                      multiple
                    />
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-green-700 dark:text-green-400">
                        {t("filesSelected", { count: files.length })}
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">
                          {formatFileSize(
                            files.reduce(
                              (total, { file }) => total + file.size,
                              0
                            )
                          )}{" "}
                          {t("total")}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.multiple = true;
                          input.accept = "image/*,video/*";
                          input.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files) {
                              handleFileSelection(Array.from(target.files));
                            }
                          };
                          input.click();
                        }}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 ml-1" />
                        {t("addMore")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeAllFiles}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4 ml-1" />
                        {t("removeAll")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    {t("uploading")} ({currentUploadIndex}/{files.length})
                  </span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={
                files.length === 0 ||
                !selectedCategory ||
                isUploading ||
                categories.length === 0
              }
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t("uploadingFile")} {currentUploadIndex} {t("from")}{" "}
                  {files.length}...
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 ml-2" />
                  {t("upload")} {files.length} {t("file")}
                </>
              )}
            </Button>

            {/* Upload Info */}
            {selectedCategory && files.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium">{t("uploadInformation")}:</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>{t("theCategory")}:</span>
                    <Badge variant="outline">{selectedCategoryName}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("numberOfFiles")}:</span>
                    <Badge variant="secondary">{files.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("totalSize")}:</span>
                    <span className="text-muted-foreground">
                      {formatFileSize(
                        files.reduce((total, { file }) => total + file.size, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="order-1 lg:order-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {t("previewFiles")}
            </CardTitle>
            <CardDescription>
              {t("previewOfSelected")} ({files.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {files.map(({ file, preview, id }) => (
                    <div
                      key={id}
                      className="group relative rounded-lg overflow-hidden border bg-card shadow-sm"
                    >
                      {/* File Preview */}
                      <div className="relative aspect-square">
                        {file.type.startsWith("video/") ? (
                          <div className="relative w-full h-full">
                            <video
                              src={preview}
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <div className="p-2 rounded-full bg-black/50">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        )}

                        {/* Remove button */}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFile(id)}
                          disabled={isUploading}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* File Info */}
                      <div className="p-2">
                        <div className="flex items-center gap-1 mb-1">
                          {file.type.startsWith("video/") ? (
                            <FileVideo className="h-3 w-3 text-blue-500" />
                          ) : (
                            <FileImage className="h-3 w-3 text-green-500" />
                          )}
                          <p
                            className="text-xs font-medium truncate flex-1"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="aspect-video w-full flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center space-y-2">
                  <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    {t("noFilesSelected")}
                  </p>
                </div>
              </div>
            )}

            {/* Display Uploaded Media */}
            <div className="pt-12">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Grid3X3 className="w-5 h-5" />
                {t("latestUpload")}
              </h3>

              {isLoadingMedia ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">
                      {t("loadingFiles")}
                    </span>
                  </div>
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 rounded-full bg-muted/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {t("noFilesUploaded")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-lg overflow-hidden border bg-card shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {/* Media */}
                      <div className="relative aspect-square">
                        {item.type === "video" ? (
                          <div className="relative w-full h-full">
                            <video
                              src={item.file_url}
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                              <div className="p-3 rounded-full bg-black/50 opacity-80">
                                <Play className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.file_url}
                            alt={item.title || "صورة"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}

                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(item.file_url, "_blank")
                                  }
                                  className="cursor-pointer"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t("viewFile")}
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e: any) => e.preventDefault()}
                                      className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      {t("deleteFile")}
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {t("deleteConfirm")}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t("deleteConfirmation")}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        {t("cancel")}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteImage(
                                            item.id,
                                            item.file_url,
                                            item.public_id,
                                            item.type
                                          )
                                        }
                                        className="bg-destructive hover:bg-destructive/90"
                                        disabled={deletingItems.has(item.id)}
                                      >
                                        {deletingItems.has(item.id) ? (
                                          <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            {t("deleting")}
                                          </div>
                                        ) : (
                                          <>
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            {"delete"}
                                          </>
                                        )}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Loading overlay for deletion */}
                        {deletingItems.has(item.id) && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="flex items-center gap-2 text-white">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span className="text-sm font-medium">
                                {t("deleting")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Media Info */}
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === "video" ? (
                            <FileVideo className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileImage className="h-4 w-4 text-green-500" />
                          )}
                          <h4 className="font-semibold text-sm truncate flex-1">
                            {item.title || t("noTitles")}
                          </h4>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {item.categories?.[
                              locale === "ar" ? "name_ar" : "name_en"
                            ] || t("noCategory")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString(
                              "ar-EG"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
