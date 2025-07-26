"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Building2, Tag, Trash2, Upload, Image, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface Category {
  id: number;
  name_ar: string;
  name_en: string;
}

interface Brand {
  id: number;
  name_ar: string;
  name_en: string;
  category_id: number;
  logo?: string | null;
}

export default function BrandManager() {
  const supabase = createClient();
  const t = useTranslations("brand");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedBrandId, setAddedBrandId] = useState<string | null>(null);

  const logo = useTranslations("logoImage");

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name_ar");
        if (error) throw error;
        if (data) setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) {
      setBrands([]);
      return;
    }

    const fetchBrands = async () => {
      try {
        const { data, error } = await supabase
          .from("brand")
          .select("*")
          .eq("category_id", parseInt(selectedCategoryId))
          .order("name_ar");
        if (error) throw error;
        if (data) setBrands(data);
      } catch (error) {
        console.error("Error fetching brands:", error);
        toast.error("Failed to load brands");
      }
    };
    fetchBrands();
  }, [selectedCategoryId]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadLogo = async (
    file: File,
    brandId: number
  ): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset"
      ); // Replace with your upload preset
      formData.append("folder", "brand-logos"); // Optional: organize in folders
      formData.append("public_id", `brand_${brandId}_${Date.now()}`); // Custom filename

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image to Cloudinary");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.secure_url; // Return the Cloudinary URL
    } catch (error) {
      console.error("Error uploading logo to Cloudinary:", error);
      throw error;
    }
  };

  const handleAddBrand = async () => {
    if (!selectedCategoryId || (!nameAr.trim() && !nameEn.trim())) {
      toast.error("Please select a category and enter at least one brand name");
      return;
    }

    setIsSubmitting(true);
    try {
      let logoUrl: string | null = null;

      // First, insert the brand
      const { data: insertedBrand, error } = await supabase
        .from("brand")
        .insert([
          {
            name_ar: nameAr.trim(),
            name_en: nameEn.trim(),
            category_id: parseInt(selectedCategoryId),
            logo: null, // We'll update this after uploading the logo
          },
        ])
        .select("*")
        .single();

      if (error || !insertedBrand) throw error;

      // If there's a selected file, upload it
      if (selectedFile) {
        try {
          logoUrl = await uploadLogo(selectedFile, insertedBrand.id);

          // Update the brand with the logo URL
          const { error: updateError } = await supabase
            .from("brand")
            .update({ logo: logoUrl })
            .eq("id", insertedBrand.id);

          if (updateError) throw updateError;
        } catch (logoError) {
          console.error("Error uploading logo:", logoError);
          toast.error("Brand added but logo upload failed");
        }
      }

      // Reset the form
      setNameAr("");
      setNameEn("");
      clearSelectedFile();

      // Update the brands list
      const { data: updatedBrands } = await supabase
        .from("brand")
        .select("*")
        .eq("category_id", parseInt(selectedCategoryId))
        .order("name_ar");

      if (updatedBrands) setBrands(updatedBrands);

      toast.success("Brand added successfully");
      setAddedBrandId(insertedBrand.id.toString());
    } catch (error) {
      console.error("Error adding brand:", error);
      toast.error("Failed to add brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brandId: number) => {
    try {
      // Get the brand to check if it has a logo
      const brandToDelete = brands.find((b) => b.id === brandId);

      // Delete the brand
      const { error } = await supabase.from("brand").delete().eq("id", brandId);
      if (error) throw error;

      // If the brand had a logo, try to delete it from Cloudinary
      if (brandToDelete?.logo) {
        try {
          // Extract public_id from Cloudinary URL
          const urlParts = brandToDelete.logo.split("/");
          const fileNameWithExt = urlParts[urlParts.length - 1];
          const publicId = `brand-logos/${fileNameWithExt.split(".")[0]}`; // Assuming folder structure

          // Note: Deleting from Cloudinary requires server-side implementation
          // You might want to create an API route for this
          console.log("Logo to delete from Cloudinary:", publicId);

          // Optional: Call your API route to delete from Cloudinary
          // await fetch('/api/delete-cloudinary-image', {
          //   method: 'DELETE',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ publicId })
          // });
        } catch (cloudinaryError) {
          console.error(
            "Error deleting logo from Cloudinary:",
            cloudinaryError
          );
          // Don't throw here, brand deletion was successful
        }
      }

      setBrands(brands.filter((b) => b.id !== brandId));
      toast.success("Brand deleted successfully");
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast.error("Failed to delete brand");
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat.id === parseInt(selectedCategoryId)
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">{t("manager")}</h1>
        </div>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Add Brand Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t("addNew")}
          </CardTitle>
          <CardDescription>{t("selectCategory")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {t("category")}
            </label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectCat")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cat.name_en}</span>
                      <span className="text-muted-foreground">
                        ({cat.name_ar})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Name Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("arName")}</label>
              <Input
                placeholder="اسم الشركة بالعربية"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                dir="rtl"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("enName")}</label>
              <Input
                placeholder="Brand Name in English"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Image className="h-4 w-4" />
              Brand Logo
            </label>
            <div className="space-y-3">
              {/* File Input */}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Select Logo
                </Button>
                {selectedFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSelectedFile}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className="h-12 w-12 object-contain rounded border bg-white"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedFile?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFile && (selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Button */}
          <Button
            onClick={handleAddBrand}
            disabled={
              !selectedCategoryId ||
              (!nameAr.trim() && !nameEn.trim()) ||
              isSubmitting
            }
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? t("adding") : t("addBrand")}
          </Button>
        </CardContent>
      </Card>

      {/* Brands List */}
      {selectedCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between mt-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t("brandIn")} {selectedCategory.name_en}
              </div>
              <Badge variant="secondary" className="ml-2">
                {brands.length} {brands.length === 1 ? "brand" : "brands"}
              </Badge>
            </CardTitle>
            <CardDescription>{t("manageBrand")}</CardDescription>
          </CardHeader>
          <CardContent>
            {brands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("noBrand")}</p>
                <p className="text-sm">{t("addAboveBrand")}</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] w-full">
                <div className="space-y-2">
                  {brands.map((brand, index) => (
                    <div key={brand.id}>
                      <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Logo */}
                          {brand.logo ? (
                            <img
                              src={brand.logo}
                              alt={`${brand.name_en} logo`}
                              className="h-10 w-10 object-contain rounded border bg-white flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}

                          {/* Brand Info */}
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {brand.name_en}
                              </span>
                              {brand.name_ar && (
                                <span className="text-muted-foreground text-sm truncate">
                                  ({brand.name_ar})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBrand(brand.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {index < brands.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
