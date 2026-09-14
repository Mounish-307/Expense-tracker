import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import type { Profile } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | SpendSmart",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar profile={profile} />
      <main className="flex-1 min-w-0 lg:overflow-y-auto">
        {/* Mobile top padding */}
        <div className="lg:hidden h-14" />
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
