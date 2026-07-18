"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { ServiceWorkerRegister } from "@/components/service-worker";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/reservations", label: "Reservaciones", icon: ClipboardList },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const NavLinks = () => (
    <nav className="flex-1 space-y-1 px-3">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sky-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <ServiceWorkerRegister />
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <Brand />
        <NavLinks />
        <UserFooter user={user} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white dark:bg-slate-900">
            <Brand onClose={() => setOpen(false)} />
            <NavLinks />
            <UserFooter user={user} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={toggle}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );

  function Brand({ onClose }: { onClose?: () => void } = {}) {
    return (
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
        <span className="text-2xl">🏊</span>
        <span className="text-base font-bold text-slate-900 dark:text-white">
          Alberca
        </span>
        {onClose && (
          <button
            className="ml-auto rounded-lg p-1 text-slate-400 lg:hidden"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }
}

function UserFooter({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  return (
    <div className="border-t border-slate-200 p-3 dark:border-slate-800">
      <div className="mb-2 px-2">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
          {user.name || "Administrador"}
        </p>
        <p className="truncate text-xs text-slate-400">{user.email}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <LogOut className="h-4 w-4" /> Cerrar sesión
      </button>
    </div>
  );
}
