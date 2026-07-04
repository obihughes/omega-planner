import { render, screen } from '@testing-library/react';
import DailyPlanner from './DailyPlanner';
import '@testing-library/jest-dom';

// Mock the useDailyPlanner hook
jest.mock('../../hooks/useDailyPlannerState', () => ({
  useDailyPlanner: () => ({
    tasks: [],
    poolTasks: [],
    pinnedTasks: [],
    activeSidebarTab: 'pinned',
    topDayOffset: 0,
    bottomDayOffset: -1,
    getDateLabel: (dayOffset: number) => `Day ${dayOffset}`,
    setTopDayOffset: jest.fn(),
    setBottomDayOffset: jest.fn(),
    setTasks: jest.fn(),
    setPoolTasks: jest.fn(),
    setPinnedTasks: jest.fn(),
    setActiveSidebarTab: jest.fn(),
    TIMELINE_START_HOUR: 4,
    TIMELINE_END_HOUR: 25,
    PIXELS_PER_HOUR: 140,
    MIN_TASK_DURATION: 0.25,
    TASK_COLORS: ['bg-blue-300 dark:bg-blue-700'],
    showClearPoolConfirmation: false,
    showCloneConfirmation: null,
    activeEditModalTask: null,
    colorPickerState: null,
    draggingTask: null,
    resizingTask: null,
    editingTaskId: null,
    contextMenu: null,
    copyingTaskData: null,
    targetCopyDayOffset: null,
    isTaskPoolOpen: true,
    openEditModal: jest.fn(),
    closeEditModal: jest.fn(),
    saveTaskFromModal: jest.fn(),
    handleTaskColorChange: jest.fn(),
    toggleColorPicker: jest.fn(),
    showClearPoolModal: jest.fn(),
    confirmClearPool: jest.fn(),
    cancelClearPool: jest.fn(),
    showCloneModal: jest.fn(),
    confirmCloneDay: jest.fn(),
    cancelCloneDay: jest.fn(),
    handleAddTask: jest.fn(),
    handleDeleteTask: jest.fn(),
    handleUpdateTask: jest.fn(),
    handleActualAddPoolTask: jest.fn(),
    copyTaskToPool: jest.fn(),
    moveTaskFromPool: jest.fn(),
    handleDeletePoolTask: jest.fn(),
    clearPool: jest.fn(),
    handlePinTask: jest.fn(),
    handleUnpinTask: jest.fn(),
    formatTimeRemaining: jest.fn(),
    startCopy: jest.fn(),
    cancelCopy: jest.fn(),
    handleDropCopy: jest.fn(),
    cloneDayTasks: jest.fn(),
    prepareCopyClassesFromSchedule: jest.fn(() => ({
      status: 'empty',
      targetDateKey: '2026-07-04',
      classesForDay: [],
      conflicts: [],
      tasksToAdd: [],
      allConvertedTasks: [],
    })),
    applyPreparedClassCopy: jest.fn(() => ({
      status: 'empty',
      addedCount: 0,
      skippedCount: 0,
      replacedCount: 0,
    })),
    setIsTaskPoolOpen: jest.fn(),
    hasConflict: jest.fn(),
    setDraggingTask: jest.fn(),
    setResizingTask: jest.fn(),
    setEditingTaskId: jest.fn(),
    setContextMenu: jest.fn(),
    setCopyingTaskData: jest.fn(),
    setTargetCopyDayOffset: jest.fn(),
  }),
}));

// Mock ReactDOM.createPortal to make the DailyPlanner component's portals render normally
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

describe('DailyPlanner', () => {
  it('renders the basic timeline structure', () => {
    render(<DailyPlanner />);
    
    // Check for basic elements in the rendered output
    const dayLabel = screen.getByText('Day 0');
    expect(dayLabel).toBeInTheDocument();
  });
}); 