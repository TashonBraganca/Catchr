import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

// SIMPLE NOTE LIST - APPLE NOTES STYLE
// Optimized scrollable list without virtualization
// Compatible with useNotes hook - SIMPLIFIED for performance

export interface NoteListItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lastModified: string;
  isPinned: boolean;
}

export type { NoteListItem as Note };

interface SimpleNoteListProps {
  notes: NoteListItem[];
  selectedNoteId?: string | null;
  onNoteSelect: (noteId: string) => void;
  onTogglePin?: (noteId: string) => void;
  className?: string;
}

const SimpleNoteList: React.FC<SimpleNoteListProps> = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  onTogglePin,
  className,
}) => {
  // Empty state
  if (notes.length === 0) {
    return (
      <div className={cn("flex-1 overflow-y-auto", className)}>
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-16 h-16 bg-[#f2f2f7] rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="text-lg font-medium text-[#1d1d1f] mb-2">No notes yet</h3>
          <p className="text-sm text-[#8e8e93]">
            Click "+ New" to create your first note or use voice capture
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1 overflow-y-auto bg-white", className)}>
      <div className="divide-y divide-[#f2f2f7]">
        {notes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            isSelected={selectedNoteId === note.id}
            onSelect={onNoteSelect}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>
    </div>
  );
};

// Individual note item component - SIMPLIFIED (no framer-motion for performance)
interface NoteItemProps {
  note: NoteListItem;
  isSelected: boolean;
  onSelect: (noteId: string) => void;
  onTogglePin?: (noteId: string) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, isSelected, onSelect, onTogglePin }) => {
  const handleClick = useCallback(() => {
    onSelect(note.id);
  }, [note.id, onSelect]);

  const handlePinClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent note selection when clicking pin
    if (onTogglePin) {
      onTogglePin(note.id);
    }
  }, [note.id, onTogglePin]);

  return (
    <button
      className={cn(
        "w-full p-4 text-left hover:bg-[#f8f9fa] transition-colors group",
        "flex flex-col space-y-2 focus:outline-none focus:ring-2 focus:ring-[#007aff]/20",
        isSelected && "bg-[#007aff]/10 border-l-4 border-l-[#007aff]"
      )}
      onClick={handleClick}
      aria-label={`Select note: ${note.title}`}
    >
      {/* Note Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <button
            onClick={handlePinClick}
            className={cn(
              "text-sm flex-shrink-0 hover:scale-110 transition-transform",
              note.isPinned ? "text-[#f59e0b]" : "text-[#8e8e93] opacity-0 group-hover:opacity-100"
            )}
            aria-label={note.isPinned ? "Unpin note" : "Pin note"}
            title={note.isPinned ? "Unpin note" : "Pin note"}
          >
            📌
          </button>
          <h3 className="font-medium text-[#1d1d1f] text-sm line-clamp-1 flex-1">
            {note.title || 'Untitled Note'}
          </h3>
        </div>
        <span className="text-xs text-[#8e8e93] whitespace-nowrap ml-2 flex-shrink-0">
          {formatRelativeTime(note.lastModified)}
        </span>
      </div>

      {/* Note Content Preview */}
      <p className="text-sm text-[#8e8e93] line-clamp-2">
        {note.content || 'No content'}
      </p>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1" aria-label="Note tags">
          {note.tags.slice(0, 3).map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="text-xs px-2 py-1 bg-[#007aff]/20 text-[#007aff] rounded-full"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-xs px-2 py-1 bg-[#8e8e93]/20 text-[#8e8e93] rounded-full">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
};

// Helper function for relative time formatting
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = (now.getTime() - date.getTime()) / 1000;

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

export default SimpleNoteList;
export type { SimpleNoteListProps };
