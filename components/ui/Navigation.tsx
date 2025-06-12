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
    <nav className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-semibold text-foreground hidden sm:block">
                Sunsama
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "nav-item relative",
                    item.active
                      ? "text-primary bg-primary/10 border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {item.active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-transparent hover:border-border"
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
    </nav>
  );
} 