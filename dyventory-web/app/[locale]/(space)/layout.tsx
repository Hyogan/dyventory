import { SessionProvider } from "@/providers/SessionProvider";
import { SidebarProvider } from "@/providers/SidebarProvider";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/nav/Sidebar";
import { Header } from "@/components/nav/Header";
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
        <div className="flex h-screen overflow-hidden bg-surface-bg">
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SessionProvider>
  );
}
