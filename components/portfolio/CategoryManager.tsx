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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Folder,
  Hash,
  Languages,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

export default function CategoryManager() {
  const supabase = createClient();
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryAr, setNewCategoryAr] = useState("");
  const [newCategoryEn, setNewCategoryEn] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNameAr, setEditingNameAr] = useState("");
  const [editingNameEn, setEditingNameEn] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const t = useTranslations("portfolio");
  const locale = useLocale();

  // تحميل الأقسام
  const fetchCategories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setCategories(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // إضافة قسم جديد
  const addCategory = async () => {
    if (!newCategoryAr.trim() || !newCategoryEn.trim()) {
      toast.error("يرجى إدخال اسم القسم بالعربية والإنجليزية");
      return;
    }

    setIsAdding(true);
    const { error } = await supabase.from("categories").insert({
      name_ar: newCategoryAr.trim(),
      name_en: newCategoryEn.trim(),
    });

    if (error) {
      toast.error("خطأ أثناء الإضافة");
    } else {
      toast.success("تمت إضافة القسم بنجاح");
      setNewCategoryAr("");
      setNewCategoryEn("");
      fetchCategories();
    }
    setIsAdding(false);
  };

  const updateCategory = async (id: string) => {
    if (!editingNameAr.trim() || !editingNameEn.trim()) {
      toast.error("يرجى إدخال اسم القسم بالعربية والإنجليزية");
      return;
    }

    const { error } = await supabase
      .from("categories")
      .update({
        name_ar: editingNameAr.trim(),
        name_en: editingNameEn.trim(),
      })
      .eq("id", id);

    if (error) {
      toast.error("خطأ أثناء التعديل");
    } else {
      toast.success("تم التعديل بنجاح");
      setEditingId(null);
      setEditingNameAr("");
      setEditingNameEn("");
      fetchCategories();
    }
  };

  // إلغاء التعديل
  const cancelEdit = () => {
    setEditingId(null);
    setEditingNameAr("");
    setEditingNameEn("");
  };

  // حذف قسم
  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      if (error.code === "23503") {
        toast.error(t("deleteCategoryFailed"));
      } else {
        toast.error(t("deleteCategoryError"));
      }
    } else {
      toast.success("تم حذف القسم بنجاح");
      fetchCategories();
    }
  };

  // Handle Enter key for adding category
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAdding) {
      addCategory();
    }
  };

  // Handle Enter key for editing category
  const handleEditKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      updateCategory(id);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <Folder className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("departmentManagement")}
        </h1>
        <p className="text-muted-foreground text-lg">{t("crudCategories")}</p>
      </div>

      <Separator />

      {/* Add Category Section */}
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Plus className="h-5 w-5" />
            {t("addNewCategory")}
          </CardTitle>
          <CardDescription>{t("enterNewCategory")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Arabic Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span>اسم القسم بالعربية</span>
                <Badge variant="secondary" className="text-xs">
                  AR
                </Badge>
              </label>
              <Input
                value={newCategoryAr}
                onChange={(e) => setNewCategoryAr(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="أدخل اسم القسم بالعربية"
                className="text-lg"
                disabled={isAdding}
                dir="rtl"
              />
            </div>

            {/* English Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span>Category Name in English</span>
                <Badge variant="secondary" className="text-xs">
                  EN
                </Badge>
              </label>
              <Input
                value={newCategoryEn}
                onChange={(e) => setNewCategoryEn(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter category name in English"
                className="text-lg"
                disabled={isAdding}
                dir="ltr"
              />
            </div>

            {/* Add Button */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={addCategory}
                disabled={
                  !newCategoryAr.trim() || !newCategoryEn.trim() || isAdding
                }
                size="lg"
                className="min-w-[120px]"
              >
                {isAdding ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {t("adding")}
                  </div>
                ) : (
                  <>
                    <Plus className="h-4 w-4 ml-2" />
                    {t("add")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories List Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              {t("currentCategories")}
            </div>
            <Badge variant="secondary" className="text-sm">
              {categories.length} {categories.length === 1 ? "قسم" : "أقسام"}
            </Badge>
          </CardTitle>
          <CardDescription>{t("categoryList")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t("loading")}
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">{t("noCategories")}</p>
              <p>{t("startAdd")}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-0">
                {categories.map((cat, index) => (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between gap-4 p-6 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Languages className="h-4 w-4 text-primary" />
                        </div>
                        {editingId === cat.id ? (
                          <div className="flex-1 space-y-3">
                            {/* Arabic Edit Input */}
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground flex items-center gap-1">
                                <span>العربية</span>
                                <Badge
                                  variant="outline"
                                  className="text-xs h-4"
                                >
                                  AR
                                </Badge>
                              </label>
                              <Input
                                value={editingNameAr}
                                onChange={(e) =>
                                  setEditingNameAr(e.target.value)
                                }
                                onKeyPress={(e) =>
                                  handleEditKeyPress(e, cat.id)
                                }
                                className="text-sm"
                                dir="rtl"
                                placeholder="اسم القسم بالعربية"
                              />
                            </div>
                            {/* English Edit Input */}
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground flex items-center gap-1">
                                <span>English</span>
                                <Badge
                                  variant="outline"
                                  className="text-xs h-4"
                                >
                                  EN
                                </Badge>
                              </label>
                              <Input
                                value={editingNameEn}
                                onChange={(e) =>
                                  setEditingNameEn(e.target.value)
                                }
                                onKeyPress={(e) =>
                                  handleEditKeyPress(e, cat.id)
                                }
                                className="text-sm"
                                dir="ltr"
                                placeholder="Category name in English"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3
                                className="font-semibold text-lg truncate"
                                dir="rtl"
                              >
                                {cat.name_ar}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                AR
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <p
                                className="text-muted-foreground truncate"
                                dir="ltr"
                              >
                                {cat.name_en}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                EN
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {editingId === cat.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateCategory(cat.id)}
                              disabled={
                                !editingNameAr.trim() || !editingNameEn.trim()
                              }
                            >
                              <Save className="h-4 w-4 ml-1" />
                              {t("save")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4 ml-1" />
                              {t("cancel")}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(cat.id);
                                setEditingNameAr(cat.name_ar || "");
                                setEditingNameEn(cat.name_en || "");
                              }}
                            >
                              <Edit2 className="h-4 w-4 ml-1" />
                              {t("edit")}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4 ml-1" />
                                  {t("delete")}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("deleteConfirm")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("deleteCategoryConfirmation", {
                                      name:
                                        locale === "ar"
                                          ? cat.name_ar
                                          : cat.name_en,
                                    })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t("cancel")}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCategory(cat.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-white"
                                  >
                                    {t("delete")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                    {index < categories.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
