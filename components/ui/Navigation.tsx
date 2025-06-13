'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CalendarDays, FolderKanban, Sun, Moon, FileText } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  const navItems = [
    {
      href: '/',
      label: 'Daily Planner',
      icon: Calendar,
      active: pathname === '/'
    },
    {
      href: '/projects',
      label: 'Projects',
      icon: FolderKanban,
      active: pathname === '/projects'
    },
    {
      href: '/calendar',
      label: 'Calendar',
      icon: CalendarDays,
      active: pathname === '/calendar'
    },
    {
      href: '/documents',
      label: 'Text Canvas',
      icon: FileText,
      active: pathname === '/documents'
    }
  ];

  return (
    <nav className="border-b border-border/30 bg-card/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand - Fixed width to prevent shifts */}
          <div className="flex items-center space-x-4 w-24 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-xl font-bold text-primary-foreground">Ω</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground hidden sm:block whitespace-nowrap">
                v1.0
              </span>
            </div>
          </div>

          {/* Navigation Links - Fixed spacing */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2.5 rounded-xl flex items-center space-x-2 text-sm font-medium transition-all duration-200 relative flex-shrink-0",
                    // Fixed minimum width to prevent layout shifts
                    "min-w-[40px] sm:min-w-[120px]",
                    item.active
                      ? "text-primary-foreground bg-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle - Fixed width */}
          <div className="w-12 flex justify-end flex-shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200 border border-transparent hover:border-border/50 flex-shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 