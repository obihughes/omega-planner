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
  const [isNavigating, setIsNavigating] = useState(false);

  // Load documents from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: DocumentsStorageData = JSON.parse(stored);
        setDocuments(data.documents || []);
        setSettings({ ...defaultSettings, ...data.settings });
        
        // Auto-select last opened document (only if not trashed)
        if (data.settings.lastOpenDocument) {
          const lastDoc = data.documents.find(doc => 
            doc.id === data.settings.lastOpenDocument && !doc.isTrashed
          );
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
    // Generate a more robust unique ID using timestamp + random string + counter
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const counter = documents.length + 1;
    
    const newDocument: Document = {
      id: `doc_${timestamp}_${counter}_${random}`,
      title: 'Untitled Document',
      content: '', // Start with empty content, let canvas editor handle initialization
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      isStarred: false,
      isTrashed: false
    };

    const updatedDocuments = [newDocument, ...documents];
    setDocuments(updatedDocuments);
    setSelectedDocument(newDocument);
    
    const newSettings = { ...settings, lastOpenDocument: newDocument.id };
    setSettings(newSettings);
    
    // Save immediately to prevent any timing issues
    saveToStorage(updatedDocuments, newSettings);
    
    // Force a small delay to ensure the save is complete before returning
    setTimeout(() => {
      console.log('Document created with ID:', newDocument.id);
    }, 50);
  };

  const updateDocument = (updatedDocument: Document) => {
    const updatedDocuments = documents.map(doc => 
      doc.id === updatedDocument.id 
        ? { ...updatedDocument, updatedAt: new Date().toISOString() }
        : doc
    );
    
    setDocuments(updatedDocuments);
    
    // Only update selectedDocument if it's the same document and not trashed
    if (selectedDocument?.id === updatedDocument.id && !updatedDocument.isTrashed) {
      setSelectedDocument(updatedDocument);
    }
    
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

  const trashDocument = (documentId: string) => {
    const updatedDocuments = documents.map(doc =>
      doc.id === documentId
        ? { ...doc, isTrashed: true, updatedAt: new Date().toISOString() }
        : doc
    );
    
    setDocuments(updatedDocuments);
    
    // If the trashed document was selected, clear selection
    if (selectedDocument?.id === documentId) {
      setSelectedDocument(null);
      const newSettings = { ...settings, lastOpenDocument: undefined };
      setSettings(newSettings);
      saveToStorage(updatedDocuments, newSettings);
    } else {
      saveToStorage(updatedDocuments);
    }
  };

  const restoreDocument = (documentId: string) => {
    const updatedDocuments = documents.map(doc =>
      doc.id === documentId
        ? { ...doc, isTrashed: false, updatedAt: new Date().toISOString() }
        : doc
    );
    
    setDocuments(updatedDocuments);
    saveToStorage(updatedDocuments);
  };

  const selectDocument = useCallback((documentId: string) => {
    // Prevent rapid navigation that causes glitches
    if (isNavigating) return;
    
    setIsNavigating(true);
    
    const document = documents.find(doc => doc.id === documentId && !doc.isTrashed);
    if (document) {
      setSelectedDocument(document);
      const newSettings = { ...settings, lastOpenDocument: documentId };
      setSettings(newSettings);
      saveToStorage(documents, newSettings);
    }
    
    // Reset navigation flag after a short delay
    setTimeout(() => setIsNavigating(false), 100);
  }, [documents, settings, isNavigating]);

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

  // Filter out trashed documents for the main view
  const activeDocuments = documents.filter(doc => !doc.isTrashed);
  const trashedDocuments = documents.filter(doc => doc.isTrashed);

  return {
    documents: activeDocuments,
    trashedDocuments,
    selectedDocument,
    settings,
    createDocument,
    updateDocument,
    deleteDocument,
    trashDocument,
    restoreDocument,
    selectDocument,
    starDocument,
    clearSelection
  };
} 