# Text Canvas Feature

A minimalistic document editor integrated into the Sunsama productivity application, providing easy text document creation and management similar to Google Docs or Word, but with a clean, distraction-free interface. Features tab-based document switching and a collapsible formatting toolbar for maximum focus.

## Features

### Document Management
- **Create Documents**: Quick document creation with auto-generated unique IDs
- **Tab-based Navigation**: Clean tabs at the top for easy document switching
- **Easy Switching**: Click any tab to switch between documents instantly
- **Star Documents**: Mark important documents for quick access
- **Auto-save**: Documents save automatically after 2 seconds of inactivity
- **Manual Save**: Ctrl+S for instant saving
- **Close Documents**: X button on tabs to close documents

### Text Editor
- **Rich Text Editing**: Support for bold, italic, headers (H1, H2, H3), and lists
- **Collapsible Toolbar**: Formatting toolbar that can be expanded/collapsed for distraction-free writing
- **Minimalistic Interface**: Clean design focused on writing
- **Live Preview**: WYSIWYG editing with real-time formatting
- **Keyboard Shortcuts**: Standard shortcuts for formatting (Ctrl+B, Ctrl+I)
- **Fixed Text Direction**: Proper left-to-right text input and cursor positioning
- **Auto-focus**: Automatic focus management for seamless writing experience

### Organization
- **Search**: Toggleable full-text search across document titles and content
- **Smart Sorting**: Documents automatically sorted by starred status and last modified
- **Tab Management**: Visual indicators for starred documents in tabs
- **Clean Interface**: Minimal UI with toggle search to reduce clutter

### Data Persistence
- **Local Storage**: All documents saved to browser localStorage
- **Auto-recovery**: Last opened document automatically selected on app load
- **Export Ready**: Document structure ready for future export features

## Components

### Documents (Main Component)
- Orchestrates the entire documents section
- Manages state for document list and selected document
- Handles document operations (create, update, delete, star)

### DocumentList
- Displays all documents in a sidebar
- Provides search and filtering functionality
- Shows document metadata (title, preview, date, starred status)
- Handles document selection and quick actions

### DocumentEditor
- Rich text editor with formatting toolbar
- Auto-save functionality with visual feedback
- Title editing with automatic placeholder
- Keyboard shortcuts for common actions

## Usage

### Creating a Document
1. Click the "+" button in the documents sidebar
2. A new "Untitled Document" is created and opened
3. Start typing to edit the title and content
4. Document auto-saves after 2 seconds of inactivity

### Editing Documents
1. Select any document from the sidebar
2. Use the formatting toolbar for rich text features
3. Changes are automatically saved
4. Use Ctrl+S for manual save

### Organizing Documents
1. Click the star icon to mark important documents
2. Use the search bar to find specific documents
3. Filter by starred documents using the "Starred" button
4. Documents are automatically sorted by last modified date

## Technical Details

### Data Structure
```typescript
interface Document {
  id: string;
  title: string;
  content: string; // HTML content from rich text editor
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isStarred?: boolean;
}
```

### Storage
- Documents stored in localStorage under key 'sunsama-documents'
- Includes user settings like auto-save preferences
- Maintains last opened document for session continuity

### Rich Text Implementation
- Uses contentEditable div with execCommand for formatting
- Custom CSS classes for consistent styling
- HTML sanitization through React's dangerouslySetInnerHTML

## Future Enhancements

- Document tags and categories
- Export to PDF/Word/Markdown
- Document templates
- Collaborative editing
- Document versioning
- Full-text search indexing
- Document sharing and permissions