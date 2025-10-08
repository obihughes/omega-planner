'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Calendar, CalendarDays, FolderKanban, FileText, ChevronLeft, ChevronRight, 
  Clock, Archive, Trash2, CalendarCheck, CalendarRange, Folder, Files, ClipboardList, Settings
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/app/context/ViewModeContext';
import { useProjectsView } from '@/app/context/ProjectsViewContext';
import { useCalendarView } from '@/app/context/CalendarViewContext';
import { useSidebar } from '@/app/context/SidebarContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SHOW_MEALS_IN_NAV } from '@/lib/constants';

export function Navigation() {
  const { isCollapsed, sidebarWidth, toggleSidebar, setSidebarWidth } = useSidebar();
  
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const { viewMode: plannerViewMode, setViewMode: setPlannerViewMode } = useViewMode();
  const { viewMode: projectsViewMode, setViewMode: setProjectsViewMode } = useProjectsView();
  const { viewMode: calendarViewMode, setViewMode: setCalendarViewMode } = useCalendarView();
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
      active: pathname === '/' || pathname === '/inbox' || pathname === '/calendar',
      subViews: [
        { key: 'planner-daily', type: 'planner', mode: 'daily', label: 'Daily', icon: CalendarCheck, active: pathname === '/' && plannerViewMode === 'daily' },
        { key: 'planner-weekly', type: 'planner', mode: 'weekly', label: 'Week Overview', icon: CalendarDays, active: pathname === '/' && plannerViewMode === 'weekly' },
        // Monthly scheduling is accessed via a header button in Daily view
        { key: 'calendar-yearly', type: 'calendar', mode: 'yearly', label: 'Yearly Calendar', icon: CalendarDays, active: pathname === '/calendar' && calendarViewMode === 'yearly' }
      ]
    },
    {
      href: '/projects',
      label: 'Workspace',
      icon: FolderKanban,
      active: pathname === '/projects' || pathname.startsWith('/projects/'),
      subViews: [
        { key: 'workspace-today', label: 'Workspace Today', icon: CalendarCheck, active: pathname === '/projects/workspace' },
        { key: 'tasks', label: 'Tasks', icon: ClipboardList, active: pathname === '/projects/tasks' },
        { key: 'active', label: 'Projects', icon: Folder, active: pathname === '/projects' && projectsViewMode === 'active' },
        { key: 'calendar', label: 'Projects Calendar', icon: CalendarRange, active: pathname === '/projects' && projectsViewMode === 'calendar' },
        { key: 'timeline', label: 'Projects Timeline', icon: CalendarRange, active: pathname === '/projects/timeline' },
        { key: 'weekly', label: 'Weekly Projects', icon: CalendarDays, active: pathname === '/projects/tasks/weekly' }
      ]
    },
    {
      href: '/goals/weekly',
      label: 'Weekly Goals',
      icon: ClipboardList,
      active: pathname === '/goals/weekly',
      subViews: []
    },
    {
      href: '/documents',
      label: 'Text Canvas',
      icon: FileText,
      active: pathname === '/documents',
      subViews: [
        { key: 'documents', label: 'Documents', icon: Files, active: true }
      ]
    },
    // Focus merged into Workspace Today (/projects/workspace)
    {
      href: '/meals',
      label: 'Meals',
      icon: ClipboardList,
      active: pathname === '/meals',
      subViews: []
    },
    {
      href: '/habits',
      label: 'Habits',
      icon: ClipboardList,
      active: pathname === '/habits',
      subViews: []
    }
  ];

  const filteredNavItems = navItems.filter((item) => item.href !== '/meals' || SHOW_MEALS_IN_NAV);

  return (
    <>
      <nav 
        className="h-screen bg-card/98 backdrop-blur-md border-r border-border/40 fixed left-0 top-0 z-50 shadow-xl flex flex-col"
        style={{ width: isCollapsed ? collapsedWidth : sidebarWidth }}
      >
        {/* Settings Section */}
        <div className={cn("border-b border-border/40 relative", dynamicSizes.mainPadding)}>
          <div className="flex items-center justify-center">
            <button
              onClick={() => setShowSettingsModal(true)}
              className={cn(
                "bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg rounded hover:shadow-xl transition-all duration-200 hover:from-primary/90 hover:to-primary/70",
                dynamicSizes.logoSize
              )}
              title="Settings"
            >
              <Settings className={cn("text-primary-foreground", dynamicSizes.logoTextSize === 'text-lg' ? 'w-4 h-4' : dynamicSizes.logoTextSize === 'text-xl' ? 'w-5 h-5' : 'w-6 h-6')} />
            </button>
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
            {filteredNavItems.map((item) => {
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
                              if (item.href === '/') {
                                if ((subView as any).type === 'calendar') {
                                  if (pathname !== '/calendar') {
                                    router.push('/calendar');
                                  }
                                  setCalendarViewMode((subView as any).mode as any);
                                } else {
                                  // planner subview
                                  if (pathname !== '/') {
                                    router.push(item.href);
                                  }
                                  setPlannerViewMode((subView as any).mode as any);
                                }
                              } else if (item.href === '/projects') {
                                if (subView.key === 'workspace-today') {
                                  if (pathname !== '/projects/workspace') {
                                    router.push('/projects/workspace');
                                  }
                                } else if (subView.key === 'tasks') {
                                  router.push('/projects/tasks');
                                } else if (subView.key === 'timeline') {
                                  if (pathname !== '/projects/timeline') {
                                    router.push('/projects/timeline');
                                  }
                                } else if (subView.key === 'weekly') {
                                  if (pathname !== '/projects/tasks/weekly') {
                                    router.push('/projects/tasks/weekly');
                                  }
                                } else {
                                  // Only push route if we're not already on the projects page
                                  if (pathname !== '/projects') {
                                    router.push(item.href);
                                  }
                                  setProjectsViewMode(subView.key as any);
                                }
                              } else if (item.href === '/documents') {
                                // Only push route if we're not already on the documents page
                                if (pathname !== '/documents') {
                                  router.push(item.href);
                                }
                                // setDocumentsViewMode(subView.key as any); // Removed as per edit hint
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

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </DialogTitle>
            <DialogDescription>
              Configure your preferences and app settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Theme Settings */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        // Set light theme
                        if (theme !== 'light') toggleTheme();
                      }}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                        theme === 'light' 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <div className="w-8 h-8 rounded bg-white border border-gray-200 flex items-center justify-center">
                        <div className="w-4 h-4 rounded bg-gray-900"></div>
                      </div>
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        // Set dark theme
                        if (theme !== 'dark') toggleTheme();
                      }}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                        theme === 'dark' 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <div className="w-8 h-8 rounded bg-gray-900 border border-gray-700 flex items-center justify-center">
                        <div className="w-4 h-4 rounded bg-gray-100"></div>
                      </div>
                      <span className="text-sm font-medium">Dark</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        // Set system theme
                        if (theme !== 'system') toggleTheme();
                      }}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2",
                        theme === 'system' 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <div className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center bg-gradient-to-r from-white via-gray-200 to-gray-900">
                      </div>
                      <span className="text-sm font-medium">System</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Current: <span className="capitalize font-medium">{theme}</span> theme
                  </p>
                </div>
              </div>
            </div>

            {/* App Settings */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Application</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-save documents</p>
                    <p className="text-sm text-muted-foreground">Automatically save changes to documents</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enabled
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sidebar width</p>
                    <p className="text-sm text-muted-foreground">Current width: {sidebarWidth}px</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSidebarWidth(200)}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium">About</h3>
              <div className="text-sm text-muted-foreground">
                <p>Omega Planner - Advanced task planning and management</p>
                <p className="mt-1">Built with Next.js, React, and Tailwind CSS</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowSettingsModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 