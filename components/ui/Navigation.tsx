'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, CalendarDays, FolderKanban, Sun, Moon, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface NavigationProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export function Navigation({ isCollapsed: externalIsCollapsed, onToggleCollapse }: NavigationProps = {}) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();

  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  const setIsCollapsed = onToggleCollapse || setInternalIsCollapsed;

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

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <nav className={cn(
      "h-screen bg-card/98 backdrop-blur-md border-r border-border/40 fixed left-0 top-0 z-50 shadow-xl flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-48"
    )}>
      {/* Logo/Brand Section */}
      <div className="p-4 border-b border-border/40 relative">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-primary-foreground">Ω</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold text-foreground">Omega</span>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold text-foreground">Planner</span>
                <span className="text-xs text-muted-foreground/80 bg-muted/50 px-1.5 py-0.5 rounded">v1.0</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-primary-foreground">Ω</span>
            </div>
          </div>
        )}
        
        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:bg-secondary"
          aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "w-full rounded-lg flex items-center text-sm font-medium transition-all duration-200 group relative",
                  isCollapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5 space-x-3",
                  item.active
                    ? "text-primary-foreground bg-gradient-to-r from-primary to-primary/90 shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:shadow-sm"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  "w-5 h-5 transition-all duration-200",
                  item.active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground group-hover:scale-110"
                )} />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
                {item.active && (
                  <div className="absolute inset-0 rounded-lg ring-2 ring-primary/20 ring-inset" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="p-3 border-t border-border/40">
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full rounded-lg flex items-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:shadow-sm transition-all duration-200 group",
            isCollapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2.5 space-x-3"
          )}
          aria-label="Toggle theme"
          title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 group-hover:text-foreground group-hover:scale-110 transition-all duration-200" />
          ) : (
            <Moon className="w-5 h-5 group-hover:text-foreground group-hover:scale-110 transition-all duration-200" />
          )}
          {!isCollapsed && (
            <span className="font-medium">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
} 