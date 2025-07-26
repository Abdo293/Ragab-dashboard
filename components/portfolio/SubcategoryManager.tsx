"use client";
import { useEffect, useState } from "react";
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
import { Plus, Building2, Tag, Trash2, Edit } from "lucide-react";
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
}

export default function BrandManager() {
  const supabase = createClient();
  const t = useTranslations("brand");

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddBrand = async () => {
    if (!selectedCategoryId || (!nameAr.trim() && !nameEn.trim())) {
      toast.error("Please select a category and enter at least one brand name");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("brand").insert([
        {
          name_ar: nameAr.trim(),
          name_en: nameEn.trim(),
          category_id: parseInt(selectedCategoryId),
        },
      ]);

      if (error) throw error;

      // Reset form
      setNameAr("");
      setNameEn("");

      // Refresh brands list
      const { data } = await supabase
        .from("brand")
        .select("*")
        .eq("category_id", parseInt(selectedCategoryId))
        .order("name_ar");
      if (data) setBrands(data);

      toast.success("Brand added successfully");
    } catch (error) {
      console.error("Error adding brand:", error);
      toast.error("Failed to add brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brandId: number) => {
    try {
      const { error } = await supabase.from("brand").delete().eq("id", brandId);
      if (error) throw error;

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
            <CardTitle className="flex items-center justify-between">
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
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{brand.name_en}</span>
                            {brand.name_ar && (
                              <span className="text-muted-foreground text-sm">
                                ({brand.name_ar})
                              </span>
                            )}
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
