'use client';

import React from 'react';
import { Navigation } from '@/components/ui/Navigation';
import { Calendar, Plus, Clock, Users } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Calendar</h1>
          <p className="text-muted-foreground">
            Your personal calendar and scheduling hub
          </p>
        </div>

        {/* Coming Soon Content */}
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="bg-primary/10 rounded-full p-6 mb-6">
            <Calendar className="w-16 h-16 text-primary" />
          </div>
          
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            New Calendar Experience Coming Soon
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-2xl">
            We're building a powerful calendar experience that will help you manage your schedule, 
            appointments, and time more effectively. This space is now available for your new 
            calendar-focused features.
          </p>

          {/* Feature Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="bg-blue-100 rounded-full p-3 w-fit mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Time Management</h3>
              <p className="text-sm text-muted-foreground">
                Advanced scheduling and time blocking features
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Team Coordination</h3>
              <p className="text-sm text-muted-foreground">
                Collaborate and coordinate schedules with your team
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="bg-purple-100 rounded-full p-3 w-fit mx-auto mb-4">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Smart Integration</h3>
              <p className="text-sm text-muted-foreground">
                Seamlessly integrate with your existing tools and workflows
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 p-6 bg-muted rounded-lg max-w-2xl w-full">
            <h3 className="font-semibold mb-2">Projects Calendar Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The projects calendar has been moved to the Projects page for better organization. 
              You can now find project timelines, due dates, and task completions in the Calendar tab 
              under Projects.
            </p>
            <a 
              href="/projects"
              className="inline-flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>View Projects Calendar</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 