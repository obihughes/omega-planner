'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types';
import DocumentEditor from './DocumentEditor';
import { useDocuments } from '@/hooks/useDocuments';
import { Plus, X, Star, Search, FileText, Save, Move, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [showTrash, setShowTrash] = useState(false);

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
    
    if (selectedDocument?.id === documentId) {
      // Find next document to open
      const currentIndex = sortedDocuments.findIndex(doc => doc.id === documentId);
      const nextDocument = sortedDocuments[currentIndex + 1] || sortedDocuments[currentIndex - 1];
      
      if (nextDocument) {
        selectDocument(nextDocument.id);
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

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-card rounded-lg shadow-sm border overflow-hidden">
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
        <div className="flex items-center justify-between min-h-[48px]">
          {/* Document Tabs */}
          <div className="flex items-center overflow-x-auto flex-1 scrollbar-none">
            {sortedDocuments.length === 0 ? (
              <div className="flex items-center px-4 py-2 text-muted-foreground">
                <FileText className="w-4 h-4 mr-2 opacity-50" />
                <span className="text-sm">No documents</span>
              </div>
            ) : (
              sortedDocuments.map((document) => (
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
                  
                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-4 w-4 p-0 flex-shrink-0 transition-opacity hover:bg-destructive/10",
                      selectedDocument?.id === document.id ? "opacity-70 hover:opacity-100" : "opacity-0 group-hover:opacity-70"
                    )}
                    onClick={(e) => handleCloseDocument(document.id, e)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 px-4 py-2 border-l border-border/50">
            {selectedDocument && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleManualSave}
                  disabled={!hasUnsavedChanges || isAutoSaving}
                  className="h-7 px-2 text-xs"
                  title="Save document"
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  {isAutoSaving ? 'Saving...' : 'Save'}
                </Button>
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
                    if (window.confirm('Move this document to trash? You can restore it later.')) {
                      trashDocument(selectedDocument.id);
                    }
                  }}
                  className="h-7 w-7 p-0"
                  title="Move to trash"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  title="Move document"
                >
                  <Move className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
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
              variant={showTrash ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowTrash(!showTrash)}
              className="h-7 px-2 text-xs"
              title={showTrash ? "Show active documents" : "Show trash"}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              {showTrash ? "Active" : "Trash"} ({showTrash ? documents.length : trashedDocuments.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        {showTrash ? (
          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold mb-4">Trash</h2>
              {trashedDocuments.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Trash is empty</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {trashedDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{document.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Moved to trash {new Date(document.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreDocument(document.id)}
                            className="h-7 px-2 text-xs"
                          >
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Permanently delete this document? This cannot be undone.')) {
                                deleteDocument(document.id);
                              }
                            }}
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : selectedDocument ? (
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
    </div>
  );
} 