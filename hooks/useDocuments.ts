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
  const [isLoading, setIsLoading] = useState(true);

  // Load documents from localStorage on mount
  useEffect(() => {
    console.log('Loading documents from storage...');
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        console.log('Found stored documents data:', stored.length, 'characters');
        const data: DocumentsStorageData = JSON.parse(stored);
        console.log('Parsed documents:', data.documents?.length || 0, 'documents found');
        setDocuments(data.documents || []);
        setSettings({ ...defaultSettings, ...data.settings });
        
        // Auto-select last opened document (only if not trashed)
        if (data.settings.lastOpenDocument) {
          const lastDoc = data.documents.find(doc => 
            doc.id === data.settings.lastOpenDocument && !doc.isTrashed
          );
          if (lastDoc) {
            setSelectedDocument(lastDoc);
            console.log('Auto-selected last document:', lastDoc.title);
          }
        }
      } else {
        console.log('No stored documents found - starting fresh');
      }
    } catch (error) {
      console.error('Failed to load documents from storage:', error);
    } finally {
      setIsLoading(false);
      console.log('Documents loading complete');
    }
  }, []);

  // Automatic save effect - save documents to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        const dataToSave: DocumentsStorageData = {
          documents: documents,
          settings: settings
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        console.log('Documents auto-saved:', documents.length, 'documents');
      } catch (error) {
        console.error('Failed to auto-save documents to storage:', error);
      }
    }
  }, [documents, settings, isLoading]);

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
    // Generate a very robust unique ID to prevent any collisions
    const timestamp = Date.now();
    const random1 = Math.random().toString(36).substr(2, 9);
    const random2 = Math.random().toString(36).substr(2, 9);
    const counter = documents.length + 1;
    const performanceNow = Math.round(performance.now() * 1000);
    
    const newId = `doc_${timestamp}_${performanceNow}_${counter}_${random1}_${random2}`;
    
    // Double-check for ID uniqueness (should never happen with this generation method)
    const existingIds = documents.map(doc => doc.id);
    if (existingIds.includes(newId)) {
      console.error('Document ID collision detected! This should not happen.');
      // Add an extra random suffix if somehow there's a collision
      const newId2 = `${newId}_${Math.random().toString(36).substr(2, 5)}`;
      console.log('Using fallback ID:', newId2);
    }
    
    const newDocument: Document = {
      id: newId,
      title: 'Untitled Document',
      content: '', // Start with empty content, let canvas editor handle initialization
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      isStarred: false,
      isTrashed: false
    };

    console.log('Creating new document:', newId, 'Current documents count:', documents.length);
    
    const updatedDocuments = [newDocument, ...documents];
    setDocuments(updatedDocuments);
    setSelectedDocument(newDocument);
    
    const newSettings = { ...settings, lastOpenDocument: newDocument.id };
    setSettings(newSettings);
    
    // Save immediately to prevent any timing issues
    saveToStorage(updatedDocuments, newSettings);
    
    console.log('Document created successfully:', newId, 'New documents count:', updatedDocuments.length);
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
    isLoading,
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