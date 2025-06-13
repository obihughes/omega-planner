'use client';

import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentsStorageData } from '@/types';

const STORAGE_KEY = 'omega-planner-documents';

const defaultSettings = {
  defaultFontSize: 16,
  autoSave: true,
  lastOpenDocument: undefined as string | undefined
};

const defaultStorageData: DocumentsStorageData = {
  documents: [],
  settings: defaultSettings
};

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [settings, setSettings] = useState(defaultSettings);

  // Load documents from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: DocumentsStorageData = JSON.parse(stored);
        setDocuments(data.documents || []);
        setSettings({ ...defaultSettings, ...data.settings });
        
        // Auto-select last opened document
        if (data.settings.lastOpenDocument) {
          const lastDoc = data.documents.find(doc => doc.id === data.settings.lastOpenDocument);
          if (lastDoc) {
            setSelectedDocument(lastDoc);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load documents from storage:', error);
    }
  }, []);

  // Save to localStorage whenever documents or settings change
  const saveToStorage = (newDocuments: Document[], newSettings = settings) => {
    try {
      const dataToSave: DocumentsStorageData = {
        documents: newDocuments,
        settings: newSettings
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save documents to storage:', error);
    }
  };

  const createDocument = () => {
    const newDocument: Document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Untitled Document',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      isStarred: false
    };

    const updatedDocuments = [newDocument, ...documents];
    setDocuments(updatedDocuments);
    setSelectedDocument(newDocument);
    
    const newSettings = { ...settings, lastOpenDocument: newDocument.id };
    setSettings(newSettings);
    saveToStorage(updatedDocuments, newSettings);
  };

  const updateDocument = (updatedDocument: Document) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === updatedDocument.id 
        ? { ...updatedDocument, updatedAt: new Date().toISOString() }
        : doc
    );
    
    setDocuments(updatedDocuments);
    setSelectedDocument(updatedDocument);
    saveToStorage(updatedDocuments);
  };

  const deleteDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    setDocuments(updatedDocuments);
    
    if (selectedDocument?.id === documentId) {
      setSelectedDocument(null);
    }
    
    const newSettings = { 
      ...settings, 
      lastOpenDocument: selectedDocument?.id === documentId ? undefined : settings.lastOpenDocument 
    };
    setSettings(newSettings);
    saveToStorage(updatedDocuments, newSettings);
  };

  const selectDocument = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (document) {
      setSelectedDocument(document);
      const newSettings = { ...settings, lastOpenDocument: documentId };
      setSettings(newSettings);
      saveToStorage(documents, newSettings);
    }
  };

  const starDocument = (documentId: string) => {
    const updatedDocuments = documents.map(doc =>
      doc.id === documentId
        ? { ...doc, isStarred: !doc.isStarred, updatedAt: new Date().toISOString() }
        : doc
    );
    
    setDocuments(updatedDocuments);
    if (selectedDocument?.id === documentId) {
      setSelectedDocument(updatedDocuments.find(doc => doc.id === documentId) || null);
    }
    saveToStorage(updatedDocuments);
  };

  const clearSelection = () => {
    setSelectedDocument(null);
    const newSettings = { ...settings, lastOpenDocument: undefined };
    setSettings(newSettings);
    saveToStorage(documents, newSettings);
  };

  return {
    documents,
    selectedDocument,
    settings,
    createDocument,
    updateDocument,
    deleteDocument,
    selectDocument,
    starDocument,
    clearSelection
  };
} 