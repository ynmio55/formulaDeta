"use client";

import { useTranslation } from "@/i18n/config";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Flag,
  Users,
  BarChart2,
  Map,
  Timer,
  Car,
  CloudLightning,
  Radio,
  Trophy,
  TerminalSquare
} from "lucide-react";
import clsx from "clsx";

const navGroups = [
  {
    title: "Main",
    items: [
      { key: "nav.overview", href: "/", icon: LayoutDashboard },
      { key: "nav.season", href: "/season", icon: Calendar },
      { key: "nav.championship", href: "/championship", icon: Trophy },
    ]
  }
];

export default function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, isReady } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isReady) return null;

  const currentKey = searchParams.get("key") || "";
  const keySuffix = currentKey ? `?key=${currentKey}` : "";

  return (
    <div className="w-20 shrink-0 hidden md:block">
      <nav 
        className={clsx(
          "fixed top-0 left-0 h-screen bg-[var(--color-surface-1)] border-r border-[var(--color-border-subtle)] flex flex-col transition-[width] duration-300 ease-in-out z-50 shadow-2xl",
          isExpanded ? "w-64" : "w-20"
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-[var(--color-border-subtle)] shrink-0">
          <div className="w-10 h-10 shrink-0 bg-[var(--color-f1-red)] flex items-center justify-center f1-skew shadow-[0_0_15px_rgba(255,24,1,0.4)]">
            <span className="text-white font-bold italic text-lg leading-none f1-skew-reverse">F1</span>
          </div>
          <div className={clsx("ml-4 transition-opacity duration-300 whitespace-nowrap", isExpanded ? "opacity-100" : "opacity-0 w-0 hidden")}>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
              OpenF1 <span className="text-[var(--color-text-tertiary)] font-normal">Terminal</span>
            </h1>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 custom-scrollbar">
          <div className="flex flex-col gap-8">
            {navGroups.map((group) => (
              <div key={group.title} className="px-3">
                <div 
                  className={clsx(
                    "mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] transition-opacity duration-300 whitespace-nowrap",
                    isExpanded ? "opacity-100 px-2" : "opacity-0 h-0 hidden"
                  )}
                >
                  {group.title}
                </div>
                
                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    const targetHref = item.href;

                    return (
                      <Link
                        key={item.key}
                        href={targetHref}
                        title={!isExpanded ? t(item.key) : undefined}
                        className={clsx(
                          "flex items-center rounded-lg transition-all duration-200 relative group/item",
                          isExpanded ? "px-3 py-2.5" : "p-3 mx-auto justify-center w-12",
                          isActive
                            ? "bg-[var(--color-surface-3)] text-white shadow-inner"
                            : "text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-surface-2)]"
                        )}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-1/2 bg-[var(--color-f1-red)] rounded-r-full shadow-[0_0_8px_var(--color-f1-red)]"></div>
                        )}
                        
                        <Icon className={clsx("shrink-0", isExpanded ? "w-4 h-4" : "w-5 h-5", isActive ? "text-[var(--color-f1-red)]" : "text-[var(--color-text-tertiary)] group-hover/item:text-[var(--color-text-secondary)]")} />
                        
                        <span className={clsx(
                          "ml-3 text-sm font-medium whitespace-nowrap transition-opacity duration-300",
                          isExpanded ? "opacity-100 block" : "opacity-0 w-0 hidden"
                        )}>
                          {t(item.key)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={clsx(
          "p-6 border-t border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest leading-relaxed transition-opacity duration-300 whitespace-nowrap bg-[var(--color-surface-1)]",
          isExpanded ? "opacity-100" : "opacity-0 h-0 hidden py-0 border-transparent"
        )}>
          <p>Data by OpenF1</p>
          <p>V 1.0.4-BETA</p>
        </div>
      </nav>
      
      {/* Mobile nav placeholder - full width on small screens */}
      <div className="md:hidden w-full h-16 bg-[var(--color-surface-1)] border-b border-[var(--color-border-subtle)] fixed top-0 z-50 flex items-center justify-between px-4">
        <div className="w-8 h-8 shrink-0 bg-[var(--color-f1-red)] flex items-center justify-center f1-skew shadow-[0_0_15px_rgba(255,24,1,0.4)]">
          <span className="text-white font-bold italic leading-none f1-skew-reverse">F1</span>
        </div>
        <div className="text-xs text-[var(--color-text-tertiary)] font-bold tracking-widest uppercase">Mobile View Limited</div>
      </div>
    </div>
  );
}
