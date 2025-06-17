  const renderTimeline = useCallback((period: TimelinePeriod) => {
    let startHour, endHour;
    switch (period) {
      case 'night': startHour = APP_TIMELINE_START_HOUR; endHour = APP_TIMELINE_SPLIT_HOUR_1; break;
      case 'morning': startHour = APP_TIMELINE_SPLIT_HOUR_1; endHour = APP_TIMELINE_SPLIT_HOUR_2; break;
      case 'afternoon': startHour = APP_TIMELINE_SPLIT_HOUR_2; endHour = APP_TIMELINE_SPLIT_HOUR_3; break;
      case 'evening': startHour = APP_TIMELINE_SPLIT_HOUR_3; endHour = APP_TIMELINE_END_HOUR; break; 
    }
    const timelineHours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
    return (
      <div className="flex h-8 border-b border-border sticky top-0 bg-card z-20">
        {timelineHours.map((hour) => (
          <div key={`timeline-hour-${hour}-${period}`} className="flex-none text-xs text-muted-foreground pt-1 pl-0.5 border-l border-border" style={{ width: `${APP_PIXELS_PER_HOUR}px` }}>
            {formatTime(hour)}
          </div>
        ))}
        <div key={`timeline-end-marker-${period}`} className="flex-none border-l border-border" style={{ width: `2px` }}></div>
      </div>
    );
  }, []); 

// ... existing code ...
    return (
      <div className={`relative w-full border border-border rounded-md ${isTargetCopyDay ? 'ring-2 ring-inset ring-blue-500' : ''}`}
        style={{ minWidth: `${APP_PIXELS_PER_HOUR * (endHour - startHour)}px`, height: `${TIMELINE_COLUMN_HEIGHT}px` }}
      >
        {renderTimeline(period)}
        <div className={`relative h-full bg-background ${isTargetCopyDay ? 'cursor-copy' : ''}`}
          data-testid={`timeline-area-${dayOffset}-${period}`}
          data-day-offset={dayOffset}
          data-section-period={period}
          onClick={(e) => handleTimelineClick(e, dayOffset, period)}
          onDoubleClick={(e) => handleTimelineDoubleClick(e, dayOffset, period)}
          onMouseEnter={() => {
            if (copyingTaskData) {
              setTargetCopyDayOffset(dayOffset);
            }
          }}
          onMouseLeave={() => {
            if (copyingTaskData) {
              setTargetCopyDayOffset(null);
            }
          }}
        >
          {currentTimeMarker}
          {Array.from({ length: endHour - startHour }, (_, i) => (
            <div key={`grid-${i}`} className="border-l border-border/20 absolute h-full" style={{ left: `${i * APP_PIXELS_PER_HOUR}px`, top: '0', bottom: '0' }} />
          ))}
          {tasksToRender.map((task) => {
              // The task object from tasksToRender is now always the correct one to display
              const displayTask = resizingTask?.task.id === task.id ? resizingTask.task : task;

              const isBeingDragged = draggingTask?.task.id === displayTask.id;
              const isBeingResized = resizingTask?.task.id === displayTask.id;
              const isBeingCopied = copyingTaskData?.id === displayTask.id;
              
              const taskStartRelativeToSection = Math.max(0, displayTask.startHour - startHour);
              const taskEndRelativeToSection = Math.min(endHour - startHour, (displayTask.startHour + displayTask.duration) - startHour);
              const renderLeft = taskStartRelativeToSection * APP_PIXELS_PER_HOUR;
              const renderWidth = (taskEndRelativeToSection - taskStartRelativeToSection) * APP_PIXELS_PER_HOUR;
              
              if (renderWidth <= 0 && !isBeingDragged) return null;
              
              const taskStyle: React.CSSProperties = {
                left: `${renderLeft}px`,
                width: `${renderWidth}px`,
                top: `${TASK_BASE_TOP}px`,
                height: `${TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING}px`,
                zIndex: isBeingDragged || isBeingResized ? 50 : 40,
                cursor: isBeingDragged ? 'grabbing' : (isBeingResized ? 'col-resize' : 'grab'),
                pointerEvents: isBeingDragged ? 'none' : 'auto',
              };

              return (
                <div key={displayTask.id}
                  className={`absolute ${isBeingDragged || isBeingResized ? 'opacity-90' : ''} ${isBeingCopied ? 'ring-2 ring-blue-500' : ''}`} 
                  style={taskStyle}
                >
                    <MemoizedTaskCard
                        task={displayTask}
                        height={TIMELINE_COLUMN_HEIGHT - TASK_BASE_TOP - TASK_BASE_BOTTOM_PADDING}
                        onStartEdit={(taskToEdit, options) => openEditModal(taskToEdit, options)} 
                        onCopy={startCopy} 
                        onViewNotes={openViewNotesModal}
                        onResizeStart={(edge, e) => handleResizeStart(displayTask, edge, e)}
                        onDragStart={handleDragStart}
                    />
                </div>
              );
          })}
        </div>
      </div>
    );
  }, [tasksByDate, draggingTask, resizingTask, copyingTaskData, currentTimeForMarker, handleDropCopy, openEditModal, startCopy, openViewNotesModal, renderTimeline, targetCopyDayOffset, handleDragStart]);
  
  const deleteTaskHandlerForModal = (taskId: string, isFromPool?: boolean) => {
    if (isFromPool) {
      if (handleDeletePoolTask) handleDeletePoolTask(taskId);
    } else {
      handleDeleteTask(taskId);
    }
  };

  return (
    <div className="min-h-screen p-2 bg-background text-foreground transition-colors">
      <div className="w-full mx-auto">
        {activeEditModalTask && (
          <EditTaskModal
            taskToEdit={activeEditModalTask}
            onSave={saveTaskFromModal}
            onClose={closeEditModal}
            onColorChange={handleTaskColorChange}
            onPinTask={handlePinTask}
            onMoveToPool={copyTaskToPool}
            pinnedTasks={pinnedTasks}
            onDelete={deleteTaskHandlerForModal}
            onCopyAndEnterPasteMode={handleCopyAndEnterPasteMode}
          />
        )}
        {viewingTaskNotes && (
          <ViewTaskNotesModal task={viewingTaskNotes} onClose={closeViewNotesModal} onEdit={openEditModal} />
        )}
        
        <div className="mb-4 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <Tabs defaultValue="pinned" className="flex h-28">
            <div className="flex flex-col w-32 border-r border-border bg-muted/20">
              <TabsList className="flex-col h-auto bg-transparent p-1">
                <TabsTrigger value="pool" className="w-full justify-start text-xs">
                  <CopyPlus className="mr-1 h-3 w-3" /> Pool
                </TabsTrigger>
                <TabsTrigger value="pinned" className="w-full justify-start text-xs">
                  <Pin className="mr-1 h-3 w-3" /> Pinned
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 p-1">
                {pinnedTasks.some(task => new Date(task.dueDate).getTime() < new Date().getTime()) && (
                   <Button
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground text-xs h-6 w-full"
                      onClick={clearOverduePinnedTasks}
                      title="Clear all overdue pinned tasks"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="flex-1">
              <TabsContent value="pool" className="h-full m-0 p-0">
                  <TaskPoolSidebar
                      poolTasks={poolTasks}
                      TASK_COLORS={TASK_COLORS}
                      activeTab="pool"
                      topDayOffset={topDayOffset}
                      isOpen={true}
                      setIsOpen={() => {}}
                      onActualAddPoolTask={handleActualAddPoolTask}
                      onAddTaskToTimeline={(task, dayOffset) => { startCopy(task); const targetDate = getCalendarDateForColumn(dayOffset); handleDropCopy(targetDate, task.startHour || 9); }}
                      onDeletePoolTask={handleDeletePoolTask}
                      onClearPool={clearPool}
                      openEditModal={(task, isFromPool) => openEditModal(task, { isFromPool: isFromPool })}
                  />
              </TabsContent>
              <TabsContent value="pinned" className="h-full m-0 p-0">
                  <PinnedTasksSidebar
                      pinnedTasks={pinnedTasks}
                      onUnpinTask={handleUnpinTask}
                      formatTimeRemaining={formatTimeRemaining}
                      openEditModal={openEditModal}
                      onClearOverduePinnedTasks={clearOverduePinnedTasks}
                      onSyncPinnedTasks={syncPinnedTasksWithTimeline}
                  />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="space-y-2" ref={timelineScrollRef}>
            <div className="bg-card p-3 rounded-lg shadow-sm border border-border overflow-auto">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={() => setTopDayOffset(topDayOffset - 7)} title="Previous week">«</Button>
                  <Button variant="ghost" size="icon" onClick={() => setTopDayOffset(topDayOffset - 1)} title="Previous day">‹</Button>
                  <span className="text-foreground font-medium text-center px-3 w-52">
                    {isClient ? getDateLabel(topDayOffset) : "Loading..."}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => setTopDayOffset(topDayOffset + 1)} title="Next day">›</Button>
                  <Button variant="ghost" size="icon" onClick={() => setTopDayOffset(topDayOffset + 7)} title="Next week">»</Button>
                  {isClient && getRelativeDayLabel(topDayOffset) && (
                    <span className="text-xs text-muted-foreground ml-2 px-1.5 py-0.5 bg-muted rounded-sm">
                      {getRelativeDayLabel(topDayOffset)}
                    </span>
                  )}
                </div>
                <Button onClick={() => openEditModal({ id: `temp-new-task-${Date.now()}`, name: "New Task", startHour: 9, duration: 1, baseDate: getCalendarDateForColumn(topDayOffset).toISOString(), color: TASK_COLORS[DEFAULT_TASK_COLOR_INDEX], notes: "", completed: false }, { isNew: true })}>
                    Add Task
                </Button>
              </div>
              <div className="">
                <div className="flex flex-col gap-1">
                    {renderColumn(topDayOffset, 'night')}
                    {renderColumn(topDayOffset, 'morning')}
                    {renderColumn(topDayOffset, 'afternoon')}
                    {renderColumn(topDayOffset, 'evening')}
                </div>
              </div>
            </div>

            <div className="bg-card p-3 rounded-lg shadow-sm border border-border overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => setBottomDayOffset(bottomDayOffset - 7)} title="Previous week">«</Button>
                    <Button variant="ghost" size="icon" onClick={() => setBottomDayOffset(bottomDayOffset - 1)} title="Previous day">‹</Button>
                    <span className="text-foreground font-medium text-center px-3 w-52">
                        {isClient ? getDateLabel(bottomDayOffset) : "Loading..."}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => setBottomDayOffset(bottomDayOffset + 1)} title="Next day">›</Button>
                    <Button variant="ghost" size="icon" onClick={() => setBottomDayOffset(bottomDayOffset + 7)} title="Next week">»</Button>
                    {isClient && getRelativeDayLabel(bottomDayOffset) && (
                        <span className="text-xs text-muted-foreground ml-2 px-1.5 py-0.5 bg-muted rounded-sm">
                        {getRelativeDayLabel(bottomDayOffset)}
                        </span>
                    )}
                </div>
                <Button onClick={() => cloneDayTasks(getCalendarDateForColumn(bottomDayOffset), getCalendarDateForColumn(topDayOffset))} title="Clone tasks to the other visible day">
                    Clone to {bottomDayOffset < topDayOffset ? 'Top' : 'Bottom'}
                </Button>
              </div>
              <div className="">
                <div className="flex flex-col gap-1">
                    {renderColumn(bottomDayOffset, 'night')}
                    {renderColumn(bottomDayOffset, 'morning')}
                    {renderColumn(bottomDayOffset, 'afternoon')}
                    {renderColumn(bottomDayOffset, 'evening')}
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
} 