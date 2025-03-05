import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Building2, Users, Upload, Menu } from "lucide-react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Sidebar = ({ className }: SidebarProps) => {
  return (
    <div className={cn("h-screen sticky top-0 left-0 overflow-y-auto border-r", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">
            Property Dashboard
          </h2>
          <div className="space-y-1">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/units">
              <Button variant="ghost" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Units
              </Button>
            </Link>
            <Link href="/developers">
              <Button variant="ghost" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Developers
              </Button>
            </Link>
            <Link href="/import">
              <Button variant="ghost" className="w-full justify-start">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar className="hidden md:block w-64 shadow-sm z-30" />
      <div className="flex-1 flex flex-col w-full md:w-[calc(100%-16rem)]">
        <header className="h-14 flex items-center gap-4 border-b bg-muted/40 px-6 sticky top-0 z-20 md:hidden">
          <Button variant="outline" size="icon" className="w-8 h-8">
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold">Property Dashboard</h1>
        </header>
        <main className="flex-1 p-6 md:p-8 w-full">{children}</main>
      </div>
    </div>
  );
}
