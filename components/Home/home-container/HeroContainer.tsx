"use client";

import { useTranslations } from "next-intl";
import { DynamicImageUpload } from "../AddImage";
import { DynamicText } from "../ChangeText";

export function HeroContainer() {
  const hero = useTranslations("heroImage");
  const logo = useTranslations("logoImage");
  return (
    <div>
      <div className="flex items-center justify-center gap-3 max-lg:flex-col">
        <DynamicImageUpload
          id="hero-section"
          column="image"
          title={hero("title")}
          description={hero("description")}
          imageHeight="h-[150px]"
          className="w-[40%] max-lg:w-full"
        />
        <DynamicImageUpload
          id="hero-section"
          column="logo"
          title={logo("title")}
          description={logo("description")}
          imageHeight="h-[150px]"
          className="w-[40%] max-lg:w-full"
        />
      </div>
      {/* 
      <div className="mt-5">
        <DynamicText
          id="hero-section"
          columnEn="title_en"
          columnAr="title_ar"
          inputTitle="تغيير العنوان الرئيسي"
        />
        <div className="mt-3">
          <DynamicText
            id="hero-section"
            columnEn="description_en"
            columnAr="description_ar"
            inputTitle="تغيير الوصف"
          />
        </div>
      </div> */}
    </div>
  );
}
