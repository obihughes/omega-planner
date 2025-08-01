'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types';
import DocumentEditor from './DocumentEditor';
import { useDocuments } from '@/hooks/useDocuments';
import { Plus, X, Star, Search, FileText, Save, Move, Trash2, Type, RotateCcw, Archive as ArchiveIcon, Download, Upload, Folder, FolderPlus, ChevronRight, ChevronDown, Check, PanelLeftClose, PanelLeftOpen, Filter, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function Documents() {
  const {
    documents,
    folders,
    trashedDocuments,
    selectedDocument,
    isLoading,
    createDocument,
    createFolder,
    updateDocument,
    updateFolder,
    deleteDocument,
    deleteFolder,
    trashDocument,
    restoreDocument,
    selectDocument,
    starDocument,
    clearSelection
  } = useDocuments();

  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [dragMode, setDragMode] = useState(false);
  const [isAddingText, setIsAddingText] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [openDocuments, setOpenDocuments] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [documentFilter, setDocumentFilter] = useState<'all' | 'starred' | 'recent'>('all');

  const filteredDocuments = documents.filter(doc => {
    // Apply search filter
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Apply document filter
    switch (documentFilter) {
      case 'starred':
        return doc.isStarred === true;
      case 'recent':
        // Show documents modified in the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(doc.updatedAt) > weekAgo;
      default:
        return true;
    }
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    // Starred documents first
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    // Then by last updated
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Organize documents and folders into tree structure
  const getDocumentsInFolder = (folderId?: string) => {
    return filteredDocuments.filter(doc => doc.folderId === folderId);
  };

  const getFoldersInFolder = (parentId?: string) => {
    return folders.filter(folder => folder.parentId === parentId);
  };

  const renderFolderTree = (parentId?: string, level = 0) => {
    const foldersAtLevel = getFoldersInFolder(parentId);
    const documentsAtLevel = getDocumentsInFolder(parentId);

    return (
      <>
        {/* Folders */}
        {foldersAtLevel.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          const hasChildren = getFoldersInFolder(folder.id).length > 0 || getDocumentsInFolder(folder.id).length > 0;

          return (
            <div key={folder.id}>
              <div
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                  selectedFolderId === folder.id && "bg-accent"
                )}
                style={{ paddingLeft: `${8 + level * 16}px` }}
                onClick={() => setSelectedFolderId(folder.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolderExpanded(folder.id);
                  }}
                  className="p-0 w-4 h-4 flex items-center justify-center"
                >
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )
                  ) : (
                    <div className="w-3 h-3" />
                  )}
                </button>
                <Folder className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium truncate">{folder.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete folder "${folder.name}"? Documents inside will be moved to the root.`)) {
                      deleteFolder(folder.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0 w-4 h-4 flex items-center justify-center hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {isExpanded && renderFolderTree(folder.id, level + 1)}
            </div>
          );
        })}

        {/* Documents */}
        {documentsAtLevel.map(document => (
          <div
            key={document.id}
            className={cn(
              "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-accent/50 transition-colors group",
              selectedDocument?.id === document.id && "bg-primary/10 border-l-2 border-l-primary"
            )}
            style={{ paddingLeft: `${24 + level * 16}px` }}
            onClick={() => handleSelectDocument(document)}
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            {document.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
            <span className="text-sm truncate flex-1">{document.title || 'Untitled'}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                trashDocument(document.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-0 w-4 h-4 flex items-center justify-center hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </>
    );
  };

  const handleSelectDocument = (document: Document) => {
    selectDocument(document.id);
    // Add to open documents if not already open
    if (!openDocuments.includes(document.id)) {
      setOpenDocuments(prev => [...prev, document.id]);
    }
  };

  const handleCreateDocument = () => {
    createDocument(selectedFolderId);
  };

  // Auto-open newly created documents
  useEffect(() => {
    if (selectedDocument && !openDocuments.includes(selectedDocument.id)) {
      setOpenDocuments(prev => [...prev, selectedDocument.id]);
    }
  }, [selectedDocument, openDocuments]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), selectedFolderId);
      setNewFolderName('');
      setCreatingFolder(false);
    }
  };

  const toggleFolderExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleSaveDocument = (document: Document) => {
    updateDocument(document);
    setHasUnsavedChanges(false);
  };

  const handleManualSave = () => {
    if (selectedDocument && hasUnsavedChanges) {
      setIsAutoSaving(true);
      updateDocument(selectedDocument);
      setHasUnsavedChanges(false);
      setTimeout(() => setIsAutoSaving(false), 1000);
    }
  };

  const handleCloseDocument = (documentId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Remove from open tabs but keep in sidebar
    const newOpenDocuments = openDocuments.filter(id => id !== documentId);
    setOpenDocuments(newOpenDocuments);
    
    // If this was the selected document, switch to another open tab or clear selection
    if (selectedDocument?.id === documentId) {
      if (newOpenDocuments.length > 0) {
        // Switch to the last opened document
        const nextDoc = documents.find(doc => doc.id === newOpenDocuments[newOpenDocuments.length - 1]);
        if (nextDoc) {
          selectDocument(nextDoc.id);
        } else {
          clearSelection();
        }
      } else {
        clearSelection();
      }
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    deleteDocument(documentId);
    handleCloseDocument(documentId);
  };

  const getTruncatedTitle = (title: string, maxLength: number = 25) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const handleTitleDoubleClick = (document: Document) => {
    setEditingDocumentId(document.id);
    setEditingTitle(document.title);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (editingDocumentId) {
      const document = documents.find(doc => doc.id === editingDocumentId);
      if (document && document.title !== editingTitle) {
        updateDocument({ ...document, title: editingTitle });
      }
    }
    setEditingDocumentId(null);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    }
  };

  const handleToggleDragMode = () => {
    setDragMode(!dragMode);
  };

  // Export documents as JSON
  const handleExportDocuments = () => {
    try {
      const exportData = {
        documents: [...documents, ...trashedDocuments],
        folders: folders,
        exportDate: new Date().toISOString(),
        version: '1.1'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `omega-planner-documents-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          Documents exported successfully!
        </div>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to export documents:', error);
      alert('Failed to export documents. Please try again.');
    }
  };

  // Import documents from JSON
  const handleImportDocuments = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importData = JSON.parse(e.target?.result as string);
          
          if (!importData.documents || !Array.isArray(importData.documents)) {
            throw new Error('Invalid document format');
          }

          const folderCount = importData.folders ? importData.folders.length : 0;
          const confirmed = window.confirm(
            `Import ${importData.documents.length} documents and ${folderCount} folders?\n\n` +
            `This will merge with your existing documents.`
          );

          if (confirmed) {
            // Import folders first (with new IDs)
            const folderIdMap = new Map<string, string>();
            
            if (importData.folders && Array.isArray(importData.folders)) {
              importData.folders.forEach((folder: any) => {
                const newFolderId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                folderIdMap.set(folder.id, newFolderId);
                
                const newFolder = {
                  ...folder,
                  id: newFolderId,
                  name: `${folder.name} (imported)`,
                  parentId: folder.parentId ? folderIdMap.get(folder.parentId) : undefined,
                  updatedAt: new Date().toISOString()
                };
                
                createFolder(newFolder.name, newFolder.parentId);
              });
            }

            // Then import documents with updated folder references
            importData.documents.forEach((doc: Document) => {
              // Generate new ID to avoid conflicts
              const newDoc = {
                ...doc,
                id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: `${doc.title} (imported)`,
                folderId: doc.folderId ? folderIdMap.get(doc.folderId) : undefined,
                updatedAt: new Date().toISOString()
              };
              
              // Add to documents using the existing function
              updateDocument(newDoc);
            });

            // Show success notification
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50';
            notification.innerHTML = `
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                ${importData.documents.length} documents and ${folderCount} folders imported successfully!
              </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 3000);
          }
        } catch (error) {
          console.error('Failed to import documents:', error);
          alert('Failed to import documents. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-card rounded-lg shadow-sm border overflow-hidden min-w-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-card rounded-lg shadow-sm border overflow-hidden">
      {/* Document Explorer Sidebar */}
      <div className={cn(
        "flex-shrink-0 border-r border-border/50 flex flex-col bg-muted/20 transition-all duration-200",
        sidebarCollapsed ? "w-12" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className="p-2 border-b border-border/50">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Documents</h2>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={() => setSidebarCollapsed(true)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    title="Collapse sidebar"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Filter Options */}
              <div className="flex items-center gap-1 mb-2">
                <Button
                  onClick={() => setDocumentFilter('all')}
                  size="sm"
                  variant={documentFilter === 'all' ? 'default' : 'ghost'}
                  className="h-6 px-2 text-xs flex-1"
                >
                  All
                </Button>
                <Button
                  onClick={() => setDocumentFilter('starred')}
                  size="sm"
                  variant={documentFilter === 'starred' ? 'default' : 'ghost'}
                  className="h-6 px-2 text-xs flex-1"
                >
                  <Star className="w-3 h-3 mr-1" />
                  Starred
                </Button>
                <Button
                  onClick={() => setDocumentFilter('recent')}
                  size="sm"
                  variant={documentFilter === 'recent' ? 'default' : 'ghost'}
                  className="h-6 px-2 text-xs flex-1"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Recent
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-xs bg-background/50 border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-primary/20"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setCreatingFolder(true)}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs flex-1"
                  title="Create folder"
                >
                  <FolderPlus className="w-3 h-3 mr-1" />
                  Folder
                </Button>
                <Button
                  onClick={handleCreateDocument}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs flex-1"
                  title="Create document"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Doc
                </Button>
              </div>

              {/* Folder Creation Input */}
              {creatingFolder && (
                <div className="mt-2 flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Folder name..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateFolder();
                      } else if (e.key === 'Escape') {
                        setCreatingFolder(false);
                        setNewFolderName('');
                      }
                    }}
                    className="flex-1 px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/20"
                    autoFocus
                  />
                  <Button
                    onClick={handleCreateFolder}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => {
                      setCreatingFolder(false);
                      setNewFolderName('');
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Collapsed Sidebar */
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => setSidebarCollapsed(false)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleCreateDocument}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                title="Create document"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Document Tree */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto p-2">
            {documents.length === 0 && folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No documents yet</p>
                <Button
                  onClick={handleCreateDocument}
                  size="sm"
                  variant="outline"
                  className="mt-2 h-6 text-xs"
                >
                  Create First Document
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {renderFolderTree()}
              </div>
            )}
          </div>
        )}

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setShowArchiveModal(true)}
                size="sm"
                variant="ghost"
                className="h-6 text-xs flex-1"
                title="View archive"
              >
                <ArchiveIcon className="w-3 h-3 mr-1" />
                Archive
              </Button>
              <Button
                onClick={handleExportDocuments}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                title="Export documents"
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                onClick={handleImportDocuments}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                title="Import documents"
              >
                <Upload className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Document Tabs */}
        {openDocuments.length > 0 && (
          <div className="flex items-center bg-muted/10 border-b border-border/50 overflow-x-auto">
            {openDocuments.map((docId) => {
              const document = documents.find(d => d.id === docId);
              if (!document) return null;
              
              return (
                <div
                  key={document.id}
                  onClick={() => handleSelectDocument(document)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 cursor-pointer transition-all min-w-fit max-w-xs border-r border-border/50 group hover:bg-background/50",
                    selectedDocument?.id === document.id
                      ? "bg-background border-b-2 border-b-primary shadow-sm"
                      : ""
                  )}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {document.isStarred && (
                      <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">
                      {document.title || 'Untitled'}
                    </span>
                  </div>
                  
                  {/* Close tab button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-4 w-4 p-0 flex-shrink-0 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20",
                      selectedDocument?.id === document.id ? "opacity-70 hover:opacity-100" : "opacity-0 group-hover:opacity-70"
                    )}
                    onClick={(e) => handleCloseDocument(document.id, e)}
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Document Header */}
        {selectedDocument && (
          <div className="flex items-center justify-between p-3 border-b border-border/50 bg-background/50">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              {selectedDocument.isStarred && (
                <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0" onDoubleClick={() => handleTitleDoubleClick(selectedDocument)}>
                {editingDocumentId === selectedDocument.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    className="text-sm font-medium bg-transparent outline-none focus:ring-0 border-0 p-0 w-full"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm font-medium truncate block">
                    {selectedDocument.title || 'Untitled'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Text editing tools */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingText(!isAddingText)}
                className={cn(
                  "h-6 px-2 text-xs",
                  isAddingText ? "bg-green-100 text-green-700" : ""
                )}
                title={isAddingText ? "Cancel adding text" : "Add new text block"}
              >
                <Type className="w-3 h-3 mr-1" />
                Text
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleDragMode}
                className={cn(
                  "h-6 px-2 text-xs",
                  dragMode ? "bg-blue-100 text-blue-700" : ""
                )}
                title={dragMode ? "Exit drag mode" : "Enter drag mode"}
              >
                <Move className="w-3 h-3 mr-1" />
                Move
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                onClick={() => starDocument(selectedDocument.id)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                title={selectedDocument.isStarred ? "Unstar document" : "Star document"}
              >
                {selectedDocument.isStarred ? (
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                ) : (
                  <Star className="w-3.5 h-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const confirmed = window.confirm(
                    `Archive "${selectedDocument.title || 'Untitled'}"?\n\n` +
                    `You can restore it later from the Archive view.`
                  );
                  if (confirmed) {
                    trashDocument(selectedDocument.id);
                  }
                }}
                className="h-6 w-6 p-0"
                title="Archive document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => handleCloseDocument(selectedDocument.id)}
                title="Close document"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden">
          {selectedDocument ? (
            <DocumentEditor
              document={selectedDocument}
              onSave={(doc) => {
                handleSaveDocument(doc);
                setHasUnsavedChanges(false);
              }}
              onClose={() => handleCloseDocument(selectedDocument.id)}
              onDelete={handleDeleteDocument}
              onStar={() => starDocument(selectedDocument.id)}
              onChange={() => setHasUnsavedChanges(true)}
              dragMode={dragMode}
              onDragModeChange={setDragMode}
              isAddingText={isAddingText}
              onIsAddingTextChange={setIsAddingText}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center max-w-sm">
                <div className="text-5xl mb-4">✍️</div>
                {openDocuments.length === 0 ? (
                  <>
                    <h3 className="text-lg font-medium mb-2">No documents open</h3>
                    <p className="text-sm text-muted-foreground/70 mb-6">
                      {documents.length > 0 
                        ? "Click on a document in the sidebar to open it"
                        : "Create your first document to get started"
                      }
                    </p>
                    <Button onClick={handleCreateDocument} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Document
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-2">Select a document</h3>
                    <p className="text-sm text-muted-foreground/70 mb-6">
                      Choose a document from the tabs above or create a new one
                    </p>
                    <Button onClick={handleCreateDocument} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Document
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Archive Modal */}
      <Dialog open={showArchiveModal} onOpenChange={setShowArchiveModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArchiveIcon className="w-5 h-5" />
              Archive ({trashedDocuments.length})
            </DialogTitle>
            <DialogDescription>
              Manage your archived documents. You can restore them to active documents or permanently delete them.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {trashedDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ArchiveIcon className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No archived documents</h3>
                <p className="text-sm text-center">
                  Documents you archive will appear here.<br />
                  You can restore them or delete them permanently.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {trashedDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium truncate">
                            {doc.title || 'Untitled Document'}
                          </h4>
                          {doc.isStarred && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {(() => {
                            if (!doc.content) return 'Empty document';
                            try {
                              const parsed = JSON.parse(doc.content);
                              if (Array.isArray(parsed)) {
                                const textContent = parsed.map((block: any) => block.content).join(' ').trim();
                                return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent || 'Empty document';
                              }
                            } catch {
                              const textContent = doc.content.trim();
                              return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent || 'Empty document';
                            }
                            return 'Empty document';
                          })()}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Created: {new Date(doc.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                          <span>Archived: {new Date(doc.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            try {
                              // Validate document before restoring
                              if (!doc.id || !doc.title) {
                                throw new Error('Invalid document data');
                              }

                              // Check if document with same ID already exists in active documents
                              const existingDoc = documents.find(d => d.id === doc.id);
                              if (existingDoc && !existingDoc.isTrashed) {
                                const confirmed = window.confirm(
                                  `A document with this title already exists: "${existingDoc.title}"\n\n` +
                                  `Do you want to restore anyway? This will create a duplicate.`
                                );
                                if (!confirmed) return;
                              }

                              restoreDocument(doc.id);
                              
                              // Show success notification
                              const notification = window.document.createElement('div');
                              notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50';
                              notification.innerHTML = `
                                <div class="flex items-center gap-2">
                                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                                  </svg>
                                  "${doc.title || 'Document'}" restored successfully.
                                </div>
                              `;
                              window.document.body.appendChild(notification);
                              
                              setTimeout(() => {
                                if (notification.parentNode) {
                                  notification.parentNode.removeChild(notification);
                                }
                              }, 3000);

                              // Auto-select the restored document
                              setTimeout(() => {
                                selectDocument(doc.id);
                              }, 100);

                            } catch (error) {
                              console.error('Failed to restore document:', error);
                              
                              // Show error notification
                              const errorNotification = window.document.createElement('div');
                              errorNotification.className = 'fixed top-4 right-4 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg shadow-lg z-50';
                              errorNotification.innerHTML = `
                                <div class="flex items-center gap-2">
                                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                  </svg>
                                  Failed to restore "${doc.title || 'Document'}". Please try again.
                                </div>
                              `;
                              window.document.body.appendChild(errorNotification);
                              
                              setTimeout(() => {
                                if (errorNotification.parentNode) {
                                  errorNotification.parentNode.removeChild(errorNotification);
                                }
                              }, 3000);
                            }
                          }}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocument(doc.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 