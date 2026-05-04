import { SessionProvider } from "@/providers/SessionProvider";
import { SidebarProvider } from "@/providers/SidebarProvider";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/nav/Sidebar";
import { Header } from "@/components/nav/Header";
import { NavigationProgress } from "@/components/shared/NavigationProgress";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s — Dyventory",
    default: "Dashboard — Dyventory",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch the authenticated user server-side.
  // getCurrentUser() redirects to /login if the token is missing or invalid.
  // React cache() ensures this is called only once per request even if
  // multiple child Server Components also call getCurrentUser().
  const user = await getCurrentUser();

  return (
    <SessionProvider user={user}>
      <SidebarProvider>
        {/* Changed bg-surface-bg to be the foundation */}
        <div className="flex h-screen overflow-hidden bg-surface-bg text-fg">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Header />
            {/* Added max-width and centered container for better wide-screen look */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
              <NavigationProgress />
              <div className="max-w-[1600px] mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SessionProvider>
  );
}
