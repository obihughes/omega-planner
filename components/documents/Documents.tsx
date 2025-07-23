'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types';
import DocumentEditor from './DocumentEditor';
import { useDocuments } from '@/hooks/useDocuments';
import { Plus, X, Star, Search, FileText, Save, Move, Trash2, Type, RotateCcw, Archive as ArchiveIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function Documents() {
  const {
    documents,
    trashedDocuments,
    selectedDocument,
    createDocument,
    updateDocument,
    deleteDocument,
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
  const [openDocuments, setOpenDocuments] = useState<string[]>([]);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Auto-open new documents when created
  useEffect(() => {
    if (selectedDocument && !openDocuments.includes(selectedDocument.id)) {
      setOpenDocuments(prev => [...prev, selectedDocument.id]);
    }
  }, [selectedDocument, openDocuments]);

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    // Starred documents first
    if (a.isStarred && !b.isStarred) return -1;
    if (!a.isStarred && b.isStarred) return 1;
    // Then by last updated
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleSelectDocument = (document: Document) => {
    selectDocument(document.id);
    // Add to open documents if not already open
    if (!openDocuments.includes(document.id)) {
      setOpenDocuments(prev => [...prev, document.id]);
    }
  };

  const handleCreateDocument = () => {
    createDocument();
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
    
    const document = documents.find(doc => doc.id === documentId);
    if (document) {
      // Check if document has unsaved changes or important content
      const hasContent = document.content && document.content.trim().length > 0;
      
      if (hasContent) {
        // Show options for documents with content
        const choice = window.confirm(
          `"${document.title || 'Untitled'}" contains content.\n\n` +
          `Click OK to archive it (you can restore from Archive view later)\n` +
          `Click Cancel to just close the tab (document will remain in your list)`
        );
        
        if (choice) {
          // User chose to archive
          trashDocument(documentId);
          
          // Provide feedback that document was archived
          const notification = window.document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50';
          notification.innerHTML = `
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              "${document.title || 'Document'}" archived successfully. Find it in Archive view.
            </div>
          `;
          window.document.body.appendChild(notification);
          
          // Remove notification after 3 seconds
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 3000);
        }
        // If user chose cancel, just close the tab (don't archive)
      } else {
        // For empty documents, just remove them completely
        deleteDocument(documentId);
      }
      
      // Remove from open documents regardless of choice
      setOpenDocuments(prev => prev.filter(id => id !== documentId));
      
      if (selectedDocument?.id === documentId) {
        // Find next document to open from remaining open documents
        const remainingOpen = openDocuments.filter(id => id !== documentId);
        const openDocs = documents.filter(doc => remainingOpen.includes(doc.id));
        
        if (openDocs.length > 0) {
          selectDocument(openDocs[0].id);
        } else {
          clearSelection();
        }
      }
    } else {
      // If document not found, just close the tab
      setOpenDocuments(prev => prev.filter(id => id !== documentId));
      
      if (selectedDocument?.id === documentId) {
        const remainingOpen = openDocuments.filter(id => id !== documentId);
        const openDocs = documents.filter(doc => remainingOpen.includes(doc.id));
        
        if (openDocs.length > 0) {
          selectDocument(openDocs[0].id);
        } else {
          clearSelection();
        }
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

  return (
    <div className="h-full flex flex-col bg-card rounded-lg shadow-sm border overflow-hidden min-w-0">
      {/* Unified Header with Tabs and Controls */}
      <div className="border-b bg-muted/10">
        {/* Search Bar (when visible) */}
        {showSearch && (
          <div className="px-4 py-2 border-b bg-muted/20">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded bg-background focus:ring-1 focus:ring-primary focus:border-transparent outline-none"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Tabs and Controls Row */}
        <div className="flex items-center justify-between min-h-[48px] min-w-0">
          {/* Document Tabs */}
          <div className="flex items-center overflow-x-auto flex-1 scrollbar-none">
            {openDocuments.length === 0 ? (
              <div className="flex items-center px-4 py-2 text-muted-foreground">
                <FileText className="w-4 h-4 mr-2 opacity-50" />
                <span className="text-sm">No open documents</span>
              </div>
            ) : (
              openDocuments.map((docId) => {
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
                  <div className="flex items-center gap-1.5 flex-1 min-w-0" onDoubleClick={() => handleTitleDoubleClick(document)}>
                    {document.isStarred && (
                      <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                    {editingDocumentId === document.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={handleTitleChange}
                        onBlur={handleTitleBlur}
                        onKeyDown={handleTitleKeyDown}
                        className="text-sm bg-transparent outline-none focus:ring-0 border-0 p-0"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm truncate">
                        {getTruncatedTitle(document.title || 'Untitled')}
                      </span>
                    )}
                  </div>
                  
                  {/* Archive button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-4 w-4 p-0 flex-shrink-0 transition-opacity hover:bg-orange-100 dark:hover:bg-orange-900/20",
                      selectedDocument?.id === document.id ? "opacity-70 hover:opacity-100" : "opacity-0 group-hover:opacity-70"
                    )}
                    onClick={(e) => handleCloseDocument(document.id, e)}
                    title="Archive document"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                );
              })
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 px-2 py-2 border-l border-border/50 flex-shrink-0">
            {/* Text editing tools - only when document is selected */}
            {selectedDocument && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingText(!isAddingText)}
                  className={cn(
                    "h-7 px-2 text-xs",
                    isAddingText ? "bg-green-100 text-green-700" : ""
                  )}
                  title={isAddingText ? "Cancel adding text" : "Add new text block"}
                >
                  <Type className="w-3.5 h-3.5 mr-1" />
                  Text
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleDragMode}
                  className={cn(
                    "h-7 px-2 text-xs",
                    dragMode ? "bg-blue-100 text-blue-700" : ""
                  )}
                  title={dragMode ? "Exit drag mode" : "Enter drag mode"}
                >
                  <Move className="w-3.5 h-3.5 mr-1" />
                  Move
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => starDocument(selectedDocument.id)}
                  className="h-7 w-7 p-0"
                  title="Star document"
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
                    if (window.confirm('Move this document to archive? You can restore it later.')) {
                      trashDocument(selectedDocument.id);
                    }
                  }}
                  className="h-7 w-7 p-0"
                  title="Archive document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            
            {/* Global tools */}
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant={showSearch ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="h-7 w-7 p-0"
              title="Search documents"
            >
              <Search className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={handleCreateDocument}
              size="sm"
              className="h-7 w-7 p-0"
              title="Create new document"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={() => setShowArchiveModal(true)}
              size="sm"
              className="h-7 w-7 p-0"
              title="View archive"
            >
              <ArchiveIcon className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

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
              <h3 className="text-lg font-medium mb-2">Ready to write?</h3>
              <p className="text-sm text-muted-foreground/70 mb-6">
                Create your first document to get started
              </p>
              <Button onClick={handleCreateDocument} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </div>
          </div>
        )}
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
                          onClick={() => restoreDocument(doc.id)}
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