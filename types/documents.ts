/**
 * Document-related types for the documents section
 */

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isStarred?: boolean;
}

export interface DocumentsStorageData {
  documents: Document[];
  settings: {
    defaultFontSize: number;
    autoSave: boolean;
    lastOpenDocument?: string;
  };
}

export interface DocumentEditorProps {
  document: Document | null;
  onSave: (document: Document) => void;
  onClose: () => void;
  onDelete?: (documentId: string) => void;
  onStar?: () => void;
}

export interface DocumentListProps {
  documents: Document[];
  selectedDocumentId?: string;
  onSelectDocument: (document: Document) => void;
  onCreateDocument: () => void;
  onDeleteDocument: (documentId: string) => void;
  onStarDocument: (documentId: string) => void;
} 