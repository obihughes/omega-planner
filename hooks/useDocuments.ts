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

  // Validate document structure
  const validateDocument = (doc: any): doc is Document => {
    return (
      doc &&
      typeof doc.id === 'string' &&
      typeof doc.title === 'string' &&
      typeof doc.content === 'string' &&
      typeof doc.createdAt === 'string' &&
      typeof doc.updatedAt === 'string' &&
      (doc.isTrashed === undefined || typeof doc.isTrashed === 'boolean') &&
      (doc.isStarred === undefined || typeof doc.isStarred === 'boolean')
    );
  };

  // Validate and clean documents data
  const validateAndCleanDocuments = (documents: any[]): Document[] => {
    if (!Array.isArray(documents)) {
      console.warn('Documents is not an array, returning empty array');
      return [];
    }

    const validDocuments = documents.filter(validateDocument);
    const invalidCount = documents.length - validDocuments.length;
    
    if (invalidCount > 0) {
      console.warn(`Filtered out ${invalidCount} invalid documents`);
    }

    return validDocuments;
  };

  // Load documents from localStorage on mount with validation and recovery
  useEffect(() => {
    console.log('Loading documents from storage...');
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        console.log('Found stored documents data:', stored.length, 'characters');
        
        let data: DocumentsStorageData;
        try {
          data = JSON.parse(stored);
        } catch (parseError) {
          console.error('Failed to parse stored data, starting fresh:', parseError);
          setDocuments([]);
          setSettings(defaultSettings);
          setIsLoading(false);
          return;
        }

        // Validate and clean documents
        const validDocuments = validateAndCleanDocuments(data.documents || []);
        console.log('Validated documents:', validDocuments.length, 'of', (data.documents || []).length);
        
        setDocuments(validDocuments);
        
        // Validate and merge settings
        const mergedSettings = { ...defaultSettings, ...data.settings };
        setSettings(mergedSettings);
        
        // Auto-select last opened document (only if it exists and not trashed)
        if (mergedSettings.lastOpenDocument) {
          const lastDoc = validDocuments.find(doc => 
            doc.id === mergedSettings.lastOpenDocument && !doc.isTrashed
          );
          if (lastDoc) {
            setSelectedDocument(lastDoc);
            console.log('Auto-selected last document:', lastDoc.title);
          } else {
            // Clear invalid lastOpenDocument
            const cleanSettings = { ...mergedSettings, lastOpenDocument: undefined };
            setSettings(cleanSettings);
          }
        }

        // If we had to clean data, save the cleaned version
        if (validDocuments.length !== (data.documents || []).length || 
            mergedSettings.lastOpenDocument !== data.settings?.lastOpenDocument) {
          console.log('Saving cleaned data back to storage');
          const cleanedData: DocumentsStorageData = {
            documents: validDocuments,
            settings: mergedSettings
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
        }
      } else {
        console.log('No stored documents found - starting fresh');
      }
    } catch (error) {
      console.error('Failed to load documents from storage:', error);
      
      // Try to recover by clearing corrupted data
      try {
        console.log('Attempting to recover by clearing corrupted storage');
        localStorage.removeItem(STORAGE_KEY);
        setDocuments([]);
        setSettings(defaultSettings);
      } catch (recoveryError) {
        console.error('Failed to recover from storage error:', recoveryError);
      }
    } finally {
      setIsLoading(false);
      console.log('Documents loading complete');
    }
  }, []);

  // Debounced auto-save effect - save documents to localStorage with debouncing to prevent conflicts
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        try {
          const dataToSave: DocumentsStorageData = {
            documents: documents,
            settings: settings
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
          console.log('Documents auto-saved:', documents.length, 'documents');
        } catch (error) {
          console.error('Failed to auto-save documents to storage:', error);
          // Could implement retry logic here if needed
        }
      }, 500); // 500ms debounce to prevent rapid saves

      return () => clearTimeout(timeoutId);
    }
  }, [documents, settings, isLoading]);

  // Immediate save to localStorage - used for critical operations that need instant persistence
  const saveToStorage = (newDocuments: Document[], newSettings = settings) => {
    try {
      // Validate data before saving
      if (!Array.isArray(newDocuments)) {
        console.error('Invalid documents array provided to saveToStorage');
        return false;
      }

      const dataToSave: DocumentsStorageData = {
        documents: newDocuments,
        settings: newSettings
      };
      
      // Check localStorage quota
      const serialized = JSON.stringify(dataToSave);
      if (serialized.length > 5 * 1024 * 1024) { // 5MB limit
        console.warn('Document data approaching localStorage limit');
      }
      
      localStorage.setItem(STORAGE_KEY, serialized);
      console.log('Documents immediately saved:', newDocuments.length, 'documents');
      return true;
    } catch (error) {
      console.error('Failed to save documents to storage:', error);
      
      // Try to recover by clearing localStorage if it's full
      if (error instanceof DOMException && error.code === 22) {
        console.warn('localStorage full, attempting to clear corrupted data');
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultStorageData));
        } catch (retryError) {
          console.error('Failed to recover from localStorage error:', retryError);
        }
      }
      return false;
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
    
    // Rely on debounced auto-save for frequent updates
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
    }
    
    // Rely on debounced auto-save for trash operations
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
      // Rely on debounced auto-save for selection changes
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
    // Rely on debounced auto-save for star changes
  };

  const clearSelection = () => {
    setSelectedDocument(null);
    const newSettings = { ...settings, lastOpenDocument: undefined };
    setSettings(newSettings);
    // Rely on debounced auto-save for selection clearing
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