"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

export const LanguageSwitcher = () => {
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    const cookieLocale = document.cookie.match(/locale=([^;]*)/)?.[1] || "en";
    setCurrentLocale(cookieLocale);
  }, []);

  const handleChangeLanguage = (newLocale: string) => {
    document.cookie = `locale=${newLocale}; path=/`;
    setCurrentLocale(newLocale);

    const direction = newLocale === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", direction);

    router.refresh();
  };

  return (
    <div>
      <Select value={currentLocale} onValueChange={handleChangeLanguage}>
        <SelectTrigger className="select-lang border-none max-w-full">
          <SelectValue placeholder="Select a language" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="en">
              <div className="flex items-center gap-3 cursor-pointer">
                <span>English</span>
              </div>
            </SelectItem>
            <SelectItem value="ar">
              <div className="flex items-center gap-3 cursor-pointer">
                <span>عربى</span>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
