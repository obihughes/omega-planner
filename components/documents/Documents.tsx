'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types';
import { DocumentEditor } from './DocumentEditor';
import { useDocuments } from '@/hooks/useDocuments';
import { Plus, X, Star, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Documents() {
  const {
    documents,
    selectedDocument,
    createDocument,
    updateDocument,
    deleteDocument,
    selectDocument,
    starDocument,
    clearSelection
  } = useDocuments();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

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
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {document.isStarred && (
                      <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">
                      {getTruncatedTitle(document.title || 'Untitled')}
                    </span>
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
            <Button
              variant={showSearch ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="h-7 w-7 p-0"
            >
              <Search className="w-3.5 h-3.5" />
            </Button>
            <Button
              onClick={handleCreateDocument}
              size="sm"
              className="h-7 w-7 p-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        {selectedDocument ? (
          <DocumentEditor
            document={selectedDocument}
            onSave={handleSaveDocument}
            onClose={() => handleCloseDocument(selectedDocument.id)}
            onDelete={handleDeleteDocument}
            onStar={() => starDocument(selectedDocument.id)}
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