'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Calendar, CalendarDays, FolderKanban, FileText, ChevronLeft, ChevronRight, 
  Clock, Archive, Trash2, CalendarCheck, CalendarRange, Folder, Files 
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/app/context/ViewModeContext';
import { useProjectsView } from '@/app/context/ProjectsViewContext';
import { useCalendarView } from '@/app/context/CalendarViewContext';
import { useDocumentsView } from '@/app/context/DocumentsViewContext';
import { useSidebar } from '@/app/context/SidebarContext';

export function Navigation() {
  const { isCollapsed, sidebarWidth, toggleSidebar, setSidebarWidth } = useSidebar();
  
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const { viewMode: plannerViewMode, setViewMode: setPlannerViewMode } = useViewMode();
  const { viewMode: projectsViewMode, setViewMode: setProjectsViewMode } = useProjectsView();
  const { viewMode: calendarViewMode, setViewMode: setCalendarViewMode } = useCalendarView();
  const { viewMode: documentsViewMode, setViewMode: setDocumentsViewMode } = useDocumentsView();
  
  const isResizing = useRef(false);
  const minWidth = 160;
  const maxWidth = 400;

  // Calculate collapsed width as a proportion of uncollapsed width
  const collapsedWidth = useMemo(() => {
    // Increased collapsed width for better usability - 50-60% of uncollapsed width
    const proportion = Math.max(100, Math.min(180, sidebarWidth * 0.55));
    return Math.floor(proportion);
  }, [sidebarWidth]);

  // Dynamic sizing based on sidebar width - applies to BOTH collapsed and uncollapsed
  const dynamicSizes = useMemo(() => {
    // Use the same reference width for both modes so content is similar sized
    const referenceWidth = sidebarWidth; // Always use uncollapsed width for sizing reference
    
    // Text sizing based on available width - more generous breakpoints for better collapsed view
    let mainTextSize, subTextSize, iconSize, subIconSize, logoSize, logoTextSize;
    
    if (referenceWidth <= 180) {
      mainTextSize = 'text-base';  // Increased from text-sm
      subTextSize = 'text-sm';     // Increased from text-xs
      iconSize = isCollapsed ? 'w-7 h-7' : 'w-5 h-5';        // Larger in collapsed view
      subIconSize = isCollapsed ? 'w-4 h-4' : 'w-4 h-4';     // Smaller than main in collapsed
      logoSize = 'w-8 h-8';        // Increased from w-7 h-7
      logoTextSize = 'text-lg';    // Increased from text-base
    } else if (referenceWidth <= 220) {
      mainTextSize = 'text-lg';    // Increased from text-base
      subTextSize = 'text-base';   // Increased from text-sm
      iconSize = isCollapsed ? 'w-8 h-8' : 'w-6 h-6';        // Larger in collapsed view
      subIconSize = isCollapsed ? 'w-5 h-5' : 'w-5 h-5';     // Smaller than main in collapsed
      logoSize = 'w-9 h-9';        // Increased from w-8 h-8
      logoTextSize = 'text-xl';    // Increased from text-lg
    } else if (referenceWidth <= 280) {
      mainTextSize = 'text-xl';    // Increased from text-lg
      subTextSize = 'text-lg';     // Increased from text-base
      iconSize = isCollapsed ? 'w-9 h-9' : 'w-6 h-6';        // Much larger in collapsed view
      subIconSize = isCollapsed ? 'w-5 h-5' : 'w-5 h-5';     // Smaller than main in collapsed
      logoSize = 'w-10 h-10';      // Increased from w-9 h-9
      logoTextSize = 'text-2xl';   // Increased from text-xl
    } else {
      mainTextSize = 'text-2xl';   // Increased from text-xl
      subTextSize = 'text-xl';     // Increased from text-lg
      iconSize = isCollapsed ? 'w-10 h-10' : 'w-7 h-7';      // Much larger in collapsed view
      subIconSize = isCollapsed ? 'w-6 h-6' : 'w-6 h-6';     // Smaller than main in collapsed
      logoSize = 'w-11 h-11';      // Increased from w-10 h-10
      logoTextSize = 'text-2xl';   // Increased from text-xl
    }

    return {
      mainTextSize,
      subTextSize,
      iconSize,
      subIconSize,
      logoSize,
      logoTextSize,
      // Increased padding in collapsed mode for better touch targets
      mainPadding: isCollapsed ? 'p-3' : (referenceWidth <= 220 ? 'p-2' : 'p-2.5'),
      subPadding: isCollapsed ? 'p-2' : (referenceWidth <= 220 ? 'p-1.5' : 'p-2')
    };
  }, [isCollapsed, sidebarWidth]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current) {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      setSidebarWidth(newWidth);
    }
  }, [setSidebarWidth, minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

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
        { key: 'yearly', label: 'Yearly', icon: CalendarDays, active: calendarViewMode === 'yearly' },
        { key: 'monthly', label: 'Monthly', icon: Calendar, active: calendarViewMode === 'monthly' }
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

  return (
    <>
      <nav 
        className="h-screen bg-card/98 backdrop-blur-md border-r border-border/40 fixed left-0 top-0 z-50 shadow-xl flex flex-col"
        style={{ width: isCollapsed ? collapsedWidth : sidebarWidth }}
      >
        {/* Logo/Brand Section */}
        <div className={cn("border-b border-border/40 relative", dynamicSizes.mainPadding)}>
          <div className="flex items-center justify-center">
            <div className={cn(
              "bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg rounded",
              dynamicSizes.logoSize
            )}>
              <span className={cn("font-bold text-primary-foreground", dynamicSizes.logoTextSize)}>Ω</span>
            </div>
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
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
        <div className="flex-1 py-1 overflow-y-auto">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const showSubViews = true;

              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "w-full flex items-center font-normal transition-all duration-200 group relative",
                      isCollapsed ? "justify-center" : "space-x-2",
                      dynamicSizes.mainPadding,
                      dynamicSizes.mainTextSize,
                      item.active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn(
                      "transition-all duration-200 flex-shrink-0",
                      dynamicSizes.iconSize,
                      item.active 
                        ? "text-foreground" 
                        : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {!isCollapsed && (
                      <span className="font-medium tracking-tight flex-1 truncate">{item.label}</span>
                    )}
                  </Link>
                  
                  {/* Sub-Views */}
                  {showSubViews && item.subViews && (
                    <div className={cn(
                      "space-y-0.5",
                      isCollapsed 
                        ? "border-l border-border/70 ml-6 pl-2" // Increased margin/padding for larger icons
                        : "relative pl-4 before:absolute before:left-4 before:top-0 before:h-full before:w-px before:bg-border/70"
                    )}>
                      {item.subViews.map((subView) => {
                        const SubIcon = subView.icon;
                        return (
                          <button 
                            key={subView.key}
                            onClick={() => {
                              router.push(item.href);
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
                              "flex items-center font-normal transition-all duration-200 w-full text-left",
                              isCollapsed 
                                ? "justify-center" 
                                : "space-x-2",
                              dynamicSizes.subPadding,
                              dynamicSizes.subTextSize,
                              subView.active 
                                ? 'text-foreground font-medium' 
                                : 'text-muted-foreground hover:text-foreground'
                            )}
                            title={isCollapsed ? subView.label : undefined}
                          >
                            <SubIcon className={cn("flex-shrink-0", dynamicSizes.subIconSize)} />
                            {!isCollapsed && (
                              <span className="tracking-tight flex-1 truncate">{subView.label}</span>
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
      </nav>
      
      {/* Resize Handle */}
      {!isCollapsed && (
        <div 
          onMouseDown={handleMouseDown}
          className="absolute top-0 h-full w-1 cursor-col-resize z-50 hover:bg-primary/20 transition-colors"
          style={{ left: sidebarWidth - 2 }}
        />
      )}
    </>
  );
} 