'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Calendar, CalendarDays, FolderKanban, Sun, Moon, FileText, ChevronLeft, ChevronRight, 
  Clock, Archive, Trash2, CalendarCheck, CalendarRange, Folder, Files 
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/app/context/ViewModeContext';
import { useProjectsView } from '@/app/context/ProjectsViewContext';
import { useCalendarView } from '@/app/context/CalendarViewContext';
import { useDocumentsView } from '@/app/context/DocumentsViewContext';

interface NavigationProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export function Navigation({ isCollapsed: externalIsCollapsed, onToggleCollapse }: NavigationProps = {}) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();
  const { viewMode: plannerViewMode, setViewMode: setPlannerViewMode } = useViewMode();
  const { viewMode: projectsViewMode, setViewMode: setProjectsViewMode } = useProjectsView();
  const { viewMode: calendarViewMode, setViewMode: setCalendarViewMode } = useCalendarView();
  const { viewMode: documentsViewMode, setViewMode: setDocumentsViewMode } = useDocumentsView();

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
      active: pathname === '/' || pathname === '/inbox',
      subViews: [
        { key: 'focus', label: 'Focus', icon: Clock, active: plannerViewMode === 'focus' },
        { key: 'daily', label: 'Daily', icon: CalendarCheck, active: plannerViewMode === 'daily' },
        { key: 'weekly', label: 'Weekly', icon: CalendarDays, active: plannerViewMode === 'weekly' },
        { key: 'monthly', label: 'Monthly', icon: CalendarRange, active: plannerViewMode === 'monthly' }
      ]
    },
    {
      href: '/projects',
      label: 'Projects',
      icon: FolderKanban,
      active: pathname === '/projects' || pathname.startsWith('/projects/'),
      subViews: [
        { key: 'active', label: 'Active', icon: Folder, active: projectsViewMode === 'active' },
        { key: 'archived', label: 'Archived', icon: Archive, active: projectsViewMode === 'archived' },
        { key: 'calendar', label: 'Calendar', icon: Calendar, active: projectsViewMode === 'calendar' }
      ]
    },
    {
      href: '/calendar',
      label: 'Calendar',
      icon: CalendarDays,
      active: pathname === '/calendar',
      subViews: [
        { key: 'monthly', label: 'Monthly', icon: Calendar, active: calendarViewMode === 'monthly' },
        { key: 'yearly', label: 'Yearly', icon: CalendarDays, active: calendarViewMode === 'yearly' }
      ]
    },
    {
      href: '/documents',
      label: 'Text Canvas',
      icon: FileText,
      active: pathname === '/documents',
      subViews: [
        { key: 'documents', label: 'Documents', icon: Files, active: documentsViewMode === 'documents' },
        { key: 'archive', label: 'Archive', icon: Trash2, active: documentsViewMode === 'archive' }
      ]
    }
  ];

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <nav className={cn(
      "h-screen bg-card/98 backdrop-blur-md border-r border-border/40 fixed left-0 top-0 z-50 shadow-xl flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-40"
    )}>
      {/* Logo/Brand Section */}
      <div className="p-4 border-b border-border/40 relative">
        {!isCollapsed ? (
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-primary-foreground">Ω</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-primary-foreground">Ω</span>
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
      <div className="flex-1 px-2 py-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "w-full flex items-center text-sm font-medium transition-all duration-200 group relative",
                    isCollapsed ? "p-3 justify-center" : "px-4 py-2 space-x-3",
                    item.active
                      ? "text-primary-foreground bg-primary/90"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={cn(
                    "transition-all duration-200",
                    isCollapsed ? "w-6 h-6" : "w-5 h-5",
                    item.active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
                
                {/* Sub-Views */}
                {(!isCollapsed || item.active) && item.subViews && (
                  <div className={cn(
                    "mt-1", 
                    isCollapsed ? "space-y-1 border-l border-border ml-4 pl-3" : "pl-5 space-y-1 border-l border-border ml-4"
                  )}>
                    {item.subViews.map((subView) => {
                      const SubIcon = subView.icon;
                      return (
                        <button 
                          key={subView.key}
                          onClick={() => {
                            if (item.href === '/') {
                              setPlannerViewMode(subView.key as any);
                            } else if (item.href === '/projects') {
                              setProjectsViewMode(subView.key as any);
                            } else if (item.href === '/calendar') {
                              setCalendarViewMode(subView.key as any);
                            } else if (item.href === '/documents') {
                              setDocumentsViewMode(subView.key as any);
                            }
                          }} 
                          className={cn(
                            "flex items-center font-medium transition-all duration-200",
                            isCollapsed 
                              ? "w-full pl-2 pr-2 py-2 justify-start" 
                              : "w-full px-3 py-1.5 text-xs",
                            subView.active 
                              ? 'text-foreground font-semibold' 
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                          title={isCollapsed ? subView.label : undefined}
                        >
                          {isCollapsed ? (
                            <SubIcon className="w-5 h-5" />
                          ) : (
                            <>
                              <SubIcon className="w-4 h-4 mr-2" />
                              {subView.label}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="p-2 border-t border-border/40">
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200 group",
            isCollapsed ? "p-3 justify-center" : "px-4 py-2 space-x-3"
          )}
          aria-label="Toggle theme"
          title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
        >
          {theme === 'dark' ? (
            <Sun className={cn("group-hover:text-foreground transition-all duration-200", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
          ) : (
            <Moon className={cn("group-hover:text-foreground transition-all duration-200", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
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