'use client';

import React from 'react';
import { CheckCircle2, Clock, Minus, Circle, CheckSquare2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDueDate as formatDueDateUtil } from '@/utils/dateUtils';
import { ProjectTask } from '@/types/projects';

interface TaskWithProject extends ProjectTask {
  projectId: string;
  projectName: string;
  projectColor: string;
}

interface DraggableTaskCardProps {
  task: TaskWithProject;
  onStatusChange?: (taskId: string, status: ProjectTask['status']) => void;
}

export function DraggableTaskCard({ task, onStatusChange }: DraggableTaskCardProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStatusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
      
      // Trigger exciting animation when completing a task
      if (nextStatus === 'completed') {
        setIsAnimating(true);
        setShowConfetti(true);
        
        // Create confetti particles
        createConfettiParticles(e.currentTarget as HTMLElement);
        
        // Reset animation states
        setTimeout(() => {
          setIsAnimating(false);
          setShowConfetti(false);
        }, 1000);
      }
      
      onStatusChange(task.id, nextStatus);
    }
  };

  // Create confetti particles animation
  const createConfettiParticles = (button: HTMLElement) => {
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        left: ${centerX}px;
        top: ${centerY}px;
        transform-origin: center;
      `;

      document.body.appendChild(particle);

      const angle = (i / 12) * Math.PI * 2;
      const velocity = 100 + Math.random() * 100;
      const gravity = 500;
      const life = 800 + Math.random() * 400;

      let startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = elapsed / life;

        if (progress >= 1) {
          particle.remove();
          return;
        }

        const x = centerX + Math.cos(angle) * velocity * (elapsed / 1000);
        const y = centerY + Math.sin(angle) * velocity * (elapsed / 1000) + 0.5 * gravity * Math.pow(elapsed / 1000, 2);
        const opacity = 1 - progress;
        const scale = 1 - progress * 0.5;

        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.opacity = opacity.toString();
        particle.style.transform = `scale(${scale})`;

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    }
  };

  const getStatusIcon = () => {
    if (task.status === 'completed') {
      return (
        <div className="relative">
          <CheckSquare2 className={cn(
            "w-5 h-5 text-green-600 transition-all duration-300",
            isAnimating && "drop-shadow-lg"
          )} />
          {/* Success ring animation */}
          {isAnimating && (
            <div className="absolute inset-0 rounded border-2 border-green-400 animate-ping" />
          )}
        </div>
      );
    } else {
      return (
        <Square className={cn(
          "w-5 h-5 text-muted-foreground transition-all duration-200",
          "hover:text-green-500 hover:scale-105"
        )} />
      );
    }
  };

  // Use the centralized formatDueDate utility function
  const formatDueDate = formatDueDateUtil;

  const dueInfo = formatDueDate(task.dueDate);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "bg-card rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all duration-200 group border-l-4 relative overflow-hidden",
        "hover:bg-accent/30",
        task.status === 'completed' 
          ? "opacity-60 bg-muted/30" 
          : "hover:bg-accent/20",
        task.priority === 'urgent' && "border-l-red-500",
        task.priority === 'high' && "border-l-orange-500", 
        task.priority === 'medium' && "border-l-blue-500",
        task.priority === 'low' && "border-l-gray-400",
        !task.priority && "border-l-gray-200",
        isAnimating && "animate-pulse"
      )}
    >
      {/* Celebration background effect */}
      {showConfetti && (
        <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-blue-100/50 animate-fade-in-out pointer-events-none" />
      )}
      
      <div className="flex items-center gap-3">
        {/* Animated Square Checkbox */}
        <button
          onClick={handleStatusToggle}
          className={cn(
            "flex-shrink-0 transition-all duration-300 relative",
            "hover:scale-110 active:scale-95",
            isAnimating && "animate-bounce"
          )}
          style={{
            transform: isAnimating ? 'scale(1.2)' : undefined,
            transition: 'transform 0.3s ease-in-out'
          }}
        >
          {getStatusIcon()}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Title with project indicator inline */}
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: task.projectColor }}
            />
            <h4 className={cn(
              "font-medium text-sm text-foreground line-clamp-1 flex-1",
              task.status === 'completed' && "line-through text-muted-foreground"
            )}>
              {task.title}
            </h4>
          </div>

          {/* Due date - only show if exists */}
          {dueInfo && (
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                {dueInfo.text}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 