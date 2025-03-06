"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Building2, Users, Upload, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

const Sidebar = ({ className, mobileOpen, setMobileOpen }: SidebarProps) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/units", icon: Building2, label: "Units" },
    { href: "/developers", icon: Users, label: "Developers" },
    { href: "/import", icon: Upload, label: "Import" },
  ];

  return (
    <div className={cn(
      "min-h-screen md:sticky fixed  top-0 left-0 overflow-y-auto border-r bg-background transition-transform duration-300 ease-in-out z-40",
      mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      className
    )}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2 px-4">
            <h2 className="text-lg font-semibold">Property Dashboard</h2>
            {setMobileOpen && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden" 
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="cursor-pointer">
                <Button 
                  variant={isActive(item.href) ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        mobileOpen &&
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        !event.defaultPrevented
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [mobileOpen]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('overflow-hidden', 'md:overflow-auto');
    } else {
      document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
    };
    
    return () => {
      document.body.classList.remove('overflow-hidden', 'md:overflow-auto');
    };
  }, [mobileOpen]);

  return (
    <div className="flex flex-row min-h-screen relative">
      {/* Backdrop overlay */}
      {mobileOpen && (
        <div 
          ref={overlayRef}
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div ref={sidebarRef} className="md:w-[30%] lg:w-[15%] w-full">
        <Sidebar 
          className="w-full shadow-sm" 
          mobileOpen={mobileOpen} 
          setMobileOpen={setMobileOpen}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col w-full md:w-[70%] lg:w-[85%]">
        <header className="h-14 flex items-center gap-4 border-b bg-muted px-6 sticky top-0 z-20 md:hidden w-full">
          <Button 
            variant="outline" 
            size="icon" 
            className="w-8 h-8"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold">Property Dashboard</h1>
        </header>
        <main className="flex-1 p-6 md:p-8 w-full">{children}</main>
      </div>
    </div>
  );
}
