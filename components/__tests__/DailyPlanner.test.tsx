import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyPlanner from '../DailyPlanner';

describe('DailyPlanner', () => {
  it('renders task cards with proper height', () => {
    render(<DailyPlanner />);
    const taskCards = screen.getAllByRole('article');
    taskCards.forEach(card => {
      expect(card).toHaveStyle({ height: '70px' });
    });
  });

  it('shows all action buttons', () => {
    render(<DailyPlanner />);
    const taskCards = screen.getAllByRole('article');
    taskCards.forEach(card => {
      expect(screen.getByTitle('Edit Task Name')).toBeVisible();
      expect(screen.getByTitle('Delete Task')).toBeVisible();
      expect(screen.getByTitle(/Copy to/)).toBeVisible();
    });
  });

  it('allows editing task name', async () => {
    render(<DailyPlanner />);
    const editButton = screen.getByTitle('Edit Task Name');
    await userEvent.click(editButton);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'New Task Name');
    await userEvent.keyboard('{Enter}');
    
    expect(screen.getByText('New Task Name')).toBeInTheDocument();
  });

  it('allows deleting tasks', () => {
    render(<DailyPlanner />);
    const initialTaskCount = screen.getAllByRole('article').length;
    const deleteButton = screen.getByTitle('Delete Task');
    
    fireEvent.click(deleteButton);
    
    const finalTaskCount = screen.getAllByRole('article').length;
    expect(finalTaskCount).toBe(initialTaskCount - 1);
  });

  it('allows copying tasks', async () => {
    render(<DailyPlanner />);
    const initialTaskCount = screen.getAllByRole('article').length;
    const copyButton = screen.getByTitle(/Copy to/);
    
    await userEvent.click(copyButton);
    const timeline = screen.getByTestId('timeline');
    await userEvent.click(timeline);
    
    const finalTaskCount = screen.getAllByRole('article').length;
    expect(finalTaskCount).toBe(initialTaskCount + 1);
  });

  it('shows color picker when color button is clicked', () => {
    render(<DailyPlanner />);
    const colorButton = screen.getByTitle('Change Color');
    
    fireEvent.click(colorButton);
    
    const colorPicker = screen.getByRole('dialog');
    expect(colorPicker).toBeVisible();
  });
}); 