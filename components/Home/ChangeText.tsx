"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { Save, Check, X, Loader2, Edit3, Languages } from "lucide-react";

interface DynamicTextProps {
  id: string;
  columnEn: any;
  columnAr: any;
  inputTitle: string;
}

type SaveState = "idle" | "saving" | "success" | "error";

export const DynamicText = ({
  id,
  columnEn,
  columnAr,
  inputTitle,
}: DynamicTextProps) => {
  const [englishText, setEnglishText] = useState("");
  const [arabicText, setArabicText] = useState("");
  const [englishValue, setEnglishValue] = useState<string>("");
  const [arabicValue, setArabicValue] = useState<string>("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("home_content")
          .select(`${columnEn}, ${columnAr}`)
          .eq("id", id)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (data) {
          const enText = data[columnEn] || "";
          const arText = data[columnAr] || "";

          setEnglishText(enText);
          setArabicText(arText);
          setEnglishValue(enText);
          setArabicValue(arText);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      }
    };

    fetchData();
  }, [id, columnEn, columnAr]);

  const handleSave = async () => {
    if (!englishValue.trim() && !arabicValue.trim()) {
      setError("At least one field must have a value");
      return;
    }

    setSaveState("saving");
    setError("");

    try {
      const supabase = createClient();

      // Check if the row exists
      const { data } = await supabase
        .from("home_content")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      const updateData = {
        [columnEn]: englishValue.trim(),
        [columnAr]: arabicValue.trim(),
      };

      // If row doesn't exist, create it
      if (!data) {
        const { error } = await supabase
          .from("home_content")
          .insert([{ id, ...updateData }]);

        if (error) throw error;
      } else {
        // If row exists, update both columns
        const { error } = await supabase
          .from("home_content")
          .update(updateData)
          .eq("id", id);

        if (error) throw error;
      }

      setEnglishText(englishValue.trim());
      setArabicText(arabicValue.trim());
      setSaveState("success");
      setIsEditing(false);

      // Reset success state after 2 seconds
      setTimeout(() => setSaveState("idle"), 2000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveState("error");
      setError("Failed to save. Please try again.");

      // Reset error state after 3 seconds
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  const handleCancel = () => {
    setEnglishValue(englishText);
    setArabicValue(arabicText);
    setIsEditing(false);
    setError("");
    setSaveState("idle");
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEnglishValue(englishText);
    setArabicValue(arabicText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const getSaveButtonContent = () => {
    switch (saveState) {
      case "saving":
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        );
      case "success":
        return (
          <>
            <Check className="w-4 h-4" />
            Saved!
          </>
        );
      case "error":
        return (
          <>
            <X className="w-4 h-4" />
            Failed
          </>
        );
      default:
        return (
          <>
            <Save className="w-4 h-4" />
            Save
          </>
        );
    }
  };

  const hasChanges =
    englishValue.trim() !== englishText || arabicValue.trim() !== arabicText;

  return (
    <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-200 hover:border-border/80 hover:bg-card/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground/90">
            {inputTitle}
          </Label>
        </div>
        {!isEditing && (englishText || arabicText) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <Edit3 className="w-3 h-3" />
          </Button>
        )}
      </div>

      {!isEditing && (englishText || arabicText) ? (
        <div className="space-y-3">
          <div
            className="p-3 rounded-md bg-muted/30 text-sm cursor-pointer transition-colors hover:bg-muted/50"
            onClick={handleEdit}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                English
              </span>
            </div>
            <div className="text-foreground/80" dir="ltr">
              {englishText || (
                <span className="text-muted-foreground italic">
                  No English text
                </span>
              )}
            </div>
          </div>

          <div
            className="p-3 rounded-md bg-muted/30 text-sm cursor-pointer transition-colors hover:bg-muted/50"
            onClick={handleEdit}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                العربية
              </span>
            </div>
            <div className="text-foreground/80 text-right" dir="rtl">
              {arabicText || (
                <span className="text-muted-foreground italic">
                  لا يوجد نص عربي
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="english-input"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                English
              </Label>
              <div className="relative">
                <Input
                  id="english-input"
                  type="text"
                  value={englishValue}
                  onChange={(e) => setEnglishValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter English text..."
                  className="transition-all text-left duration-200 focus:ring-2 focus:ring-primary/20"
                  disabled={saveState === "saving"}
                  autoFocus={isEditing}
                />
                {englishValue && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div
                      className={`w-2 h-2 text-left rounded-full transition-colors ${
                        englishValue.trim() !== englishText
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="arabic-input"
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                العربية
              </Label>
              <div className="relative">
                <Input
                  id="arabic-input"
                  type="text"
                  value={arabicValue}
                  onChange={(e) => setArabicValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="أدخل النص العربي..."
                  className="text-right transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  dir="rtl"
                  disabled={saveState === "saving"}
                />
                {arabicValue && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <div
                      className={`w-2 h-2 rounded-full transition-colors ${
                        arabicValue.trim() !== arabicText
                          ? "bg-orange-500"
                          : "bg-green-500"
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={
                saveState === "saving" ||
                (!englishValue.trim() && !arabicValue.trim()) ||
                !hasChanges
              }
              className="flex items-center gap-2 transition-all duration-200"
              variant={saveState === "success" ? "default" : "default"}
            >
              {getSaveButtonContent()}
            </Button>

            {isEditing && (
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={saveState === "saving"}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            )}

            {hasChanges && (
              <span className="text-xs text-muted-foreground">
                Press Ctrl+Enter to save, Esc to cancel
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
