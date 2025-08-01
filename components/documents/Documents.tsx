'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types';
import DocumentEditor from './DocumentEditor';
import { useDocuments } from '@/hooks/useDocuments';
import { Plus, X, Star, Search, FileText, Save, Move, Trash2, Type, RotateCcw, Archive as ArchiveIcon, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function Documents() {
  const {
    documents,
    trashedDocuments,
    selectedDocument,
    isLoading,
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
  const [showArchiveModal, setShowArchiveModal] = useState(false);

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
    
    // Simple close behavior - just deselect the document, never delete/archive
    // The document remains in the documents list for future access
    
    if (selectedDocument?.id === documentId) {
      clearSelection();
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
        exportDate: new Date().toISOString(),
        version: '1.0'
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

          const confirmed = window.confirm(
            `Import ${importData.documents.length} documents?\n\n` +
            `This will merge with your existing documents.`
          );

          if (confirmed) {
            // Merge imported documents with existing ones
            importData.documents.forEach((doc: Document) => {
              // Generate new ID to avoid conflicts
              const newDoc = {
                ...doc,
                id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: `${doc.title} (imported)`,
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
                ${importData.documents.length} documents imported successfully!
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

        {/* Current Document Display and Controls */}
        <div className="flex items-center justify-between min-h-[48px] min-w-0">
          {/* Current Document Info */}
          <div className="flex items-center flex-1 min-w-0">
            {selectedDocument ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="flex items-center gap-1.5 flex-1 min-w-0" onDoubleClick={() => handleTitleDoubleClick(selectedDocument)}>
                  {selectedDocument.isStarred && (
                    <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                  )}
                  {editingDocumentId === selectedDocument.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={handleTitleChange}
                      onBlur={handleTitleBlur}
                      onKeyDown={handleTitleKeyDown}
                      className="text-sm font-medium bg-transparent outline-none focus:ring-0 border-0 p-0"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-medium truncate">
                      {selectedDocument.title || 'Untitled'}
                    </span>
                  )}
                </div>
                
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0 hover:bg-accent"
                  onClick={(e) => handleCloseDocument(selectedDocument.id, e)}
                  title="Close document"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center px-4 py-2 text-muted-foreground">
                <FileText className="w-4 h-4 mr-2 opacity-50" />
                <span className="text-sm">No document selected</span>
              </div>
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
                    if (selectedDocument) {
                      const confirmed = window.confirm(
                        `Archive "${selectedDocument.title || 'Untitled'}"?\n\n` +
                        `You can restore it later from the Archive view.`
                      );
                      if (confirmed) {
                        trashDocument(selectedDocument.id);
                        
                        // Show success notification
                        const notification = document.createElement('div');
                        notification.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-300 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50';
                        notification.innerHTML = `
                          <div class="flex items-center gap-2">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                            "${selectedDocument.title || 'Document'}" archived. Find it in Archive view.
                          </div>
                        `;
                        document.body.appendChild(notification);
                        
                        setTimeout(() => {
                          if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                          }
                        }, 3000);
                      }
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
            
            {/* Backup/Restore tools */}
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              onClick={handleExportDocuments}
              size="sm"
              className="h-7 w-7 p-0"
              title="Export documents (backup)"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={handleImportDocuments}
              size="sm"
              className="h-7 w-7 p-0"
              title="Import documents"
            >
              <Upload className="w-3.5 h-3.5" />
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