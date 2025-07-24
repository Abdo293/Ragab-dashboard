"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Home, LogOut, ChartBar, Briefcase } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function AppSidebar({
  dir = "ltr",
  ...props
}: React.ComponentProps<typeof Sidebar> & { dir?: "ltr" | "rtl" }) {
  const t = useTranslations("sidebar");
  const { state } = useSidebar();
  const isExpanded = state === "expanded";
  const pathname = usePathname();

  const items = [
    { title: t("home"), url: "/dashboard", icon: Home },
    { title: t("portfolio"), url: "/dashboard/portfolio", icon: Briefcase },
  ];

  const supabase = createClient();

  const [logoImage, setLogoImage] = useState<string | null>(null);
  const cellId = "hero-section";

  useEffect(() => {
    const fetchImage = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("home_content")
        .select("logo")
        .eq("id", cellId)
        .single();

      if (data?.logo) {
        setLogoImage(data.logo);
      }
      console.log("data is: ", data);
    };

    fetchImage();
  }, [cellId]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  const MenuLink = React.forwardRef<
    HTMLAnchorElement,
    React.ComponentPropsWithoutRef<typeof Link>
  >(({ href, children, ...props }, ref) => (
    <Link href={href} ref={ref} {...props}>
      {children}
    </Link>
  ));
  MenuLink.displayName = "MenuLink";

  return (
    <TooltipProvider>
      <Sidebar
        dir={dir}
        collapsible="icon"
        side={dir === "rtl" ? "right" : "left"}
        {...props}
      >
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src={logoImage || "/default-logo.png"}
              alt="Company Logo"
              width={40}
              height={40}
            />
            {isExpanded && <span className="font-semibold">A.Ragab</span>}
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className={isExpanded ? "" : "sr-only"}>
              Application
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.url}
                        >
                          <MenuLink
                            href={item.url}
                            className="flex items-center w-full"
                          >
                            <item.icon className={isExpanded ? "mr-2" : ""} />
                            {isExpanded && <span>{item.title}</span>}
                          </MenuLink>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {!isExpanded && (
                        <TooltipContent side={dir === "rtl" ? "left" : "right"}>
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild onClick={signOut}>
                <MenuLink href="/login" className="flex items-center w-full">
                  <LogOut className={isExpanded ? "mr-2" : ""} />
                  {isExpanded && <span>{t("logout")}</span>}
                </MenuLink>
              </SidebarMenuButton>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side={dir === "rtl" ? "left" : "right"}>
                {t("logout")}
              </TooltipContent>
            )}
          </Tooltip>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  );
}
