'use client';

import React, { useState } from 'react';
import { Topic } from '@/types/subjects';
import { useSubjectsManager } from '@/hooks/useSubjectsManager';
import { SubjectsList } from './SubjectsList';
import { TopicsPanel } from './TopicsPanel';
import { TopicForm, TopicFormValues } from './TopicForm';

export function SubjectsPage() {
  const {
    hydrated,
    subjects,
    selectedSubjectId,
    selectedSubject,
    selectedTopics,
    progressBySubject,
    selectSubject,
    addSubject,
    updateSubject,
    removeSubject,
    addTopic,
    updateTopic,
    removeTopic,
  } = useSubjectsManager();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  const openNew = () => {
    setEditingTopic(null);
    setFormOpen(true);
  };

  const openEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTopic(null);
  };

  const handleSave = (values: TopicFormValues) => {
    if (editingTopic) {
      updateTopic(editingTopic.id, values);
    } else if (selectedSubjectId) {
      addTopic(selectedSubjectId, values.title, values.status, values.notes);
    }
    closeForm();
  };

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center px-6 py-4 border-b border-border/50">
        <h1 className="text-xl font-medium">Subjects</h1>
      </header>

      {hydrated ? (
        <div className="flex-1 flex min-h-0">
          <SubjectsList
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            progressBySubject={progressBySubject}
            onSelect={selectSubject}
            onAdd={addSubject}
            onUpdate={updateSubject}
            onRemove={removeSubject}
          />
          <TopicsPanel
            key={selectedSubjectId ?? 'none'}
            subject={selectedSubject}
            topics={selectedTopics}
            onQuickAdd={(title) => selectedSubjectId && addTopic(selectedSubjectId, title)}
            onOpenNew={openNew}
            onOpenEdit={openEdit}
            onUpdate={updateTopic}
            onRemove={removeTopic}
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <TopicForm isOpen={formOpen} topic={editingTopic} onClose={closeForm} onSave={handleSave} />
    </div>
  );
}
