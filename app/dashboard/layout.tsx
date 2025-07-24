import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getLocale } from "next-intl/server";
import { AppSidebar } from "@/components/AppSidebar";
import { ModeToggle } from "@/components/themes/DarkmodeIcon";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <SidebarProvider>
      <AppSidebar dir={direction} />
      <div className="w-full">
        <main>
          <div className="border-b flex items-center justify-between py-3 px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ModeToggle />
            </div>
          </div>
          <div className="p-4">
            {children}
            <Toaster />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
