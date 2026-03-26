import { Sidebar } from "@/components/shared/Sidebar";
import { Header } from "@/components/shared/Header";
import { SessionProvider } from "@/providers/SessionProvider";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <SessionProvider user={user}>
      <div className="flex h-screen overflow-hidden bg-(--surface-bg)">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
