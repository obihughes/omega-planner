'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DocumentsViewMode = 'documents' | 'archive';

interface DocumentsViewContextType {
  viewMode: DocumentsViewMode;
  setViewMode: (mode: DocumentsViewMode) => void;
}

const DocumentsViewContext = createContext<DocumentsViewContextType | undefined>(undefined);

export function DocumentsViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<DocumentsViewMode>('documents');

  return (
    <DocumentsViewContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </DocumentsViewContext.Provider>
  );
}

export function useDocumentsView() {
  const context = useContext(DocumentsViewContext);
  if (context === undefined) {
    throw new Error('useDocumentsView must be used within a DocumentsViewProvider');
  }
  return context;
} 