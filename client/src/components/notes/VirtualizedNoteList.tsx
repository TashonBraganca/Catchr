import React, { useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// VIRTUALIZED NOTE LIST - APPLE NOTES PERFORMANCE
// Handles 10,000+ notes with smooth scrolling

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  lastModified: string;
  isPinned: boolean;
}

interface VirtualizedNoteListProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect: (noteId: string) => void;
  className?: string;
  height?: number;
}

interface NoteItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    notes: Note[];
    selectedNoteId?: string;
    onNoteSelect: (noteId: string) => void;
  };
}

const NoteItemComponent: React.FC<NoteItemProps> = ({ index, style, data }) => {
  const { notes, selectedNoteId, onNoteSelect } = data;
  const note = notes[index];

  const handleClick = useCallback(() => {
    onNoteSelect(note.id);
  }, [note.id, onNoteSelect]);

  const isSelected = selectedNoteId === note.id;

  return (
    <div style={style}>
      <motion.button
        className={cn(
          "w-full p-4 border-b border-[#f2f2f7] text-left hover:bg-[#f8f9fa] transition-colors",
          "flex flex-col space-y-2 focus:outline-none focus:ring-2 focus:ring-[#007aff]/20",
          isSelected && "bg-[#007aff]/10 border-l-4 border-l-[#007aff]"
        )}
        onClick={handleClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        aria-label={`Select note: ${note.title}`}
      >
        {/* Note Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {note.isPinned && (
              <span className="text-[#f59e0b] text-sm" aria-label="Pinned note">
                📌
              </span>
            )}
            <h3 className="font-medium text-[#1d1d1f] text-sm line-clamp-1 flex-1">
              {note.title || 'Untitled Note'}
            </h3>
          </div>
          <span className="text-xs text-[#8e8e93] whitespace-nowrap ml-2">
            {formatRelativeTime(note.lastModified)}
          </span>
        </div>

        {/* Note Content Preview */}
        <p className="text-sm text-[#8e8e93] line-clamp-2 text-left">
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
      </motion.button>
    </div>
  );
};

// Performance optimization - memoize NoteItem to prevent unnecessary re-renders
const NoteItem = React.memo(NoteItemComponent);

const VirtualizedNoteList: React.FC<VirtualizedNoteListProps> = ({
  notes,
  selectedNoteId,
  onNoteSelect,
  className,
  height = 600,
}) => {
  // Optimize data for virtualization
  const itemData = useMemo(() => ({
    notes,
    selectedNoteId,
    onNoteSelect,
  }), [notes, selectedNoteId, onNoteSelect]);

  // Item height for consistent rendering
  const ITEM_HEIGHT = 120; // Approximate height of each note item

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
            Create your first note using the voice capture button
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex-1", className)}>
      <List
        height={height}
        itemCount={notes.length}
        itemSize={ITEM_HEIGHT}
        itemData={itemData}
        width="100%"
        className="scrollbar-thin scrollbar-thumb-[#8e8e93]/20 scrollbar-track-transparent"
        style={{
          background: 'white',
        }}
      >
        {NoteItem}
      </List>
    </div>
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

export default VirtualizedNoteList;
export type { Note, VirtualizedNoteListProps };