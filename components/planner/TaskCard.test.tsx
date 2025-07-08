import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from './TaskCard';
import { Task } from '../../types/planner';
import '@testing-library/jest-dom';

// Mock the ReactDOM.createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

describe('TaskCard', () => {
  const mockTask: Task = {
    id: '1',
    name: 'Test Task',
    startHour: 9,
    duration: 1,
    dayOffset: 0,
    color: 'bg-blue-300 dark:bg-blue-700',
    baseDate: new Date().toISOString()
  };

  const mockProps = {
    task: mockTask,
    height: 100,
    onStartEdit: jest.fn(),
    onUpdateTask: jest.fn(),
    onDelete: jest.fn(),
    onCopy: jest.fn(),
    onColorChange: jest.fn(),
    editingTaskId: null,
    setEditingTaskId: jest.fn(),
    onMoveToInbox: jest.fn(),
    onPinTask: jest.fn(),
  };

  it('renders task name and times correctly', () => {
    render(<TaskCard {...mockProps} />);
    
    // Check task name is displayed
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    
    // Check time is displayed (9:00 - 10:00)
    expect(screen.getByText('9:00 - 10:00')).toBeInTheDocument();
    
    // Check duration is displayed
    expect(screen.getByText('1h')).toBeInTheDocument();
  });

  it('shows edit button and handles edit click', () => {
    render(<TaskCard {...mockProps} />);
    
    // Find the edit button
    const editButton = screen.getByTitle('Edit task (inline)');
    expect(editButton).toBeInTheDocument();
    
    // Click the edit button
    fireEvent.click(editButton);
    
    // Verify setEditingTaskId was called with the task id
    expect(mockProps.setEditingTaskId).toHaveBeenCalledWith('1');
  });

  it('shows copy button and handles copy click', () => {
    render(<TaskCard {...mockProps} />);
    
    // Find the copy button
    const copyButton = screen.getByTitle('Copy task to timeline');
    expect(copyButton).toBeInTheDocument();
    
    // Click the copy button
    fireEvent.click(copyButton);
    
    // Verify onCopy was called with the task
    expect(mockProps.onCopy).toHaveBeenCalledWith(mockTask);
  });

  it('renders pin button when onPinTask is provided', () => {
    render(<TaskCard {...mockProps} />);
    
    // Find the pin button
    const pinButton = screen.getByTitle('Pin task');
    expect(pinButton).toBeInTheDocument();
    
    // Click the pin button
    fireEvent.click(pinButton);
    
    // Verify onPinTask was called with the task
    expect(mockProps.onPinTask).toHaveBeenCalledWith(mockTask);
  });

  it('shows inline edit menu when editing', () => {
    render(<TaskCard {...mockProps} editingTaskId={mockTask.id} />);
    
    // The input field for editing should be in the document
    const nameInput = screen.getByLabelText('Task Name');
    expect(nameInput).toBeInTheDocument();
  });
}); 