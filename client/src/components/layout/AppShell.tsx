import React, { useState, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import SimpleNoteList from '@/components/notes/SimpleNoteList';
import { useNotes, Note } from '@/hooks/useNotes';
import { useAuth } from '@/contexts/AuthContext';
import {
  ProgressiveToolbar,
  ProgressiveSearch,
  ProgressiveActions,
  ContentFocusMode
} from '@/components/ui/ProgressiveDisclosure';
import { toast, Toaster } from 'sonner';

// Lazy load voice capture component for better performance
const SimpleVoiceCapture = React.lazy(() => import('@/components/capture/SimpleVoiceCapture'));

// DARK THEME + ORANGE GLASS PANELS
// Three-panel layout: Sidebar (320px->64px) | Note List (300px) | Editor (flexible)

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

const AppShellComponent: React.FC<AppShellProps> = ({ children, className }) => {
  // CRITICAL FIX: Use real Supabase data instead of mock data
  const { user, signOut } = useAuth();
  const { notes, loading, error, createNote, updateNote, deleteNote, togglePin } = useNotes();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [showVoiceCapture, setShowVoiceCapture] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [mobileView, setMobileView] = useState<'sidebar' | 'list' | 'editor'>('list');

  // Progressive disclosure state
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [selectedText, setSelectedText] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  // Editor reference for progressive features
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const newNoteContentRef = useRef<HTMLTextAreaElement>(null);

  // Responsive behavior - auto-collapse sidebar on mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    handleResize(); // Check on initial load
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Progressive disclosure handlers
  const handleToolbarAction = (action: string) => {
    console.log(`Editor toolbar action: ${action}`);

    if (!editorRef.current) return;

    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (!selectedText) return;

    let formattedText = '';

    switch (action) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      default:
        formattedText = selectedText;
    }

    // Replace selected text with formatted version
    textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);

    // Restore selection
    textarea.focus();
    textarea.setSelectionRange(start, start + formattedText.length);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<string[]>([]);

  const handleSearch = (query: string, filters: string[]) => {
    console.log(`Search: "${query}" with filters:`, filters);
    setSearchQuery(query.toLowerCase());
    setSearchFilters(filters);
  };

  // Filter notes based on search query and filters
  const filteredNotes = notes.filter(note => {
    // Filter by search query
    if (searchQuery) {
      const matchesContent = note.content.toLowerCase().includes(searchQuery);
      const matchesTitle = note.title?.toLowerCase().includes(searchQuery);
      const matchesTags = note.tags?.some(tag => tag.toLowerCase().includes(searchQuery));

      if (!matchesContent && !matchesTitle && !matchesTags) {
        return false;
      }
    }

    // Filter by tags
    if (searchFilters.length > 0) {
      const noteTags = note.tags || [];
      const hasMatchingTag = searchFilters.some(filter =>
        noteTags.some(tag => tag.toLowerCase() === filter.toLowerCase())
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  });

  const [sortBy, setSortBy] = useState<'date' | 'title' | 'modified'>('modified');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSidebarAction = (action: string) => {
    console.log(`Sidebar action: ${action}`);

    switch (action) {
      case 'new-folder':
        const folderName = prompt('Enter folder name:');
        if (folderName) {
          console.log('Creating new folder:', folderName);
          // TODO: Implement folder creation in backend
          toast.info(`Folder "${folderName}" created!`, {
            description: 'Backend integration pending'
          });
        }
        break;
      case 'import':
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.md,.txt';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
              const content = e.target?.result as string;
              // Create note from imported file
              const importedNote = await createNote({
                content: content,
                title: file.name.replace(/\.[^/.]+$/, ''),
                tags: ['imported'],
                category: { main: 'note' }
              });
              if (importedNote) {
                toast.success(`Imported "${file.name}" successfully!`);
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
        break;
      case 'settings':
        console.log('Opening settings...');
        toast.info('Settings panel coming soon!');
        break;
      default:
        console.log('Unknown sidebar action:', action);
    }
  };

  const handleListAction = (action: string) => {
    console.log(`Note list action: ${action}`);

    switch (action) {
      case 'sort-date':
        setSortBy('date');
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        break;
      case 'sort-title':
        setSortBy('title');
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        break;
      case 'sort-modified':
        setSortBy('modified');
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        break;
      case 'filter-pinned':
        setSearchFilters(prev =>
          prev.includes('pinned') ? prev.filter(f => f !== 'pinned') : [...prev, 'pinned']
        );
        break;
      case 'export-json':
        const jsonData = JSON.stringify(filteredNotes, null, 2);
        const jsonBlob = new Blob([jsonData], { type: 'application/json' });
        const jsonUrl = URL.createObjectURL(jsonBlob);
        const jsonLink = document.createElement('a');
        jsonLink.href = jsonUrl;
        jsonLink.download = `notes-${new Date().toISOString().split('T')[0]}.json`;
        jsonLink.click();
        URL.revokeObjectURL(jsonUrl);
        toast.success(`Exported ${filteredNotes.length} notes to JSON!`);
        break;
      case 'export-markdown':
        const mdContent = filteredNotes.map(note =>
          `# ${note.title || 'Untitled'}\n\n${note.content}\n\n---\n`
        ).join('\n');
        const mdBlob = new Blob([mdContent], { type: 'text/markdown' });
        const mdUrl = URL.createObjectURL(mdBlob);
        const mdLink = document.createElement('a');
        mdLink.href = mdUrl;
        mdLink.download = `notes-${new Date().toISOString().split('T')[0]}.md`;
        mdLink.click();
        URL.revokeObjectURL(mdUrl);
        toast.success(`Exported ${filteredNotes.length} notes to Markdown!`);
        break;
      default:
        console.log('Unknown list action:', action);
    }
  };

  const handleTextSelection = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    setSelectedText(!!hasSelection);
    setShowToolbar(!!hasSelection);
  };

  /**
   * CRITICAL FIX: Create new note manually
   * Addresses user feedback: "there is not button or option to create a new note"
   */
  const handleCreateNewNote = async () => {
    const content = newNoteContentRef.current?.value || '';
    console.log('📝 [AppShell] Manual note creation:', { contentLength: content.length });

    if (!content.trim()) {
      console.warn('⚠️ [AppShell] Empty content, not creating note');
      toast.error('Please enter some content for your note');
      return;
    }

    console.log('💾 [AppShell] Creating manual note...');

    const note = await createNote({
      content: content.trim(),
      tags: [],
      category: { main: 'note' }
    });

    if (note) {
      console.log('✅ [AppShell] Manual note created successfully:', note.id);
      toast.success('Note created successfully!', {
        description: note.title || 'Your note has been saved'
      });
      setShowNewNoteModal(false);
      if (newNoteContentRef.current) {
        newNoteContentRef.current.value = '';
      }
    } else {
      console.error('❌ [AppShell] Failed to create manual note');
      toast.error('Failed to save note', {
        description: 'Please check your connection and try again'
      });
    }
  };

  /**
   * CRITICAL FIX: Save voice notes to database
   * Addresses user feedback: "neither does this work, since it just opens up
   * and nothing happens later on... even the waveform is bad, fix that too,
   * it doesnt even record or save anything"
   */
  const handleVoiceNoteComplete = async (
    transcript: string,
    suggestedTitle?: string,
    suggestedTags?: string[]
  ) => {
    console.log('🎯 [AppShell] Voice note completion:', { transcript, suggestedTitle, suggestedTags });

    if (!transcript || transcript.trim().length === 0) {
      console.error('❌ [AppShell] Empty transcript received - cannot create note');
      toast.error('No speech detected', {
        description: 'Please try again and speak clearly'
      });
      return;
    }

    console.log('💾 [AppShell] Creating note from voice transcript...');

    // Save to database with AI-generated metadata
    const note = await createNote({
      content: transcript,
      title: suggestedTitle,
      tags: suggestedTags || [],
      category: { main: 'voice-note' }
    });

    if (note) {
      console.log('✅ [AppShell] Voice note created successfully:', note.id);
      toast.success('Voice note created!', {
        description: suggestedTitle || 'Your voice note has been saved'
      });
      setShowVoiceCapture(false);
    } else {
      console.error('❌ [AppShell] Failed to create note from voice');
      toast.error('Failed to save voice note', {
        description: 'Please try again'
      });
    }
  };

  // Sort filtered notes
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
        break;
      case 'date':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'modified':
      default:
        comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Transform notes for SimpleNoteList component
  const transformedNotes = sortedNotes.map(note => ({
    id: note.id,
    title: note.title || 'Untitled Note',
    content: note.content,
    tags: note.tags || [],
    lastModified: note.updated_at,
    isPinned: note.is_pinned
  }));

  return (
    <div className={cn(
      "h-screen w-full bg-black flex overflow-hidden",
      "text-white font-system",
      className
    )}>
      {/* DARK THEME + ORANGE GLASS Three-Panel Layout */}
      <div className="flex w-full h-full relative">

        {/* Left Sidebar - Projects & Smart Collections */}
        <motion.div
          data-testid="sidebar"
          role="navigation"
          aria-label="Project navigation"
          className={cn(
            "h-full flex-shrink-0 relative",
            "liquid-glass liquid-glass--sidebar liquid-glass--animate-entrance",
            "focus-ring",
            // Mobile: overlay behavior
            "md:relative md:translate-x-0",
            sidebarCollapsed ? "absolute -translate-x-full md:translate-x-0 z-40" : "absolute translate-x-0 z-40 md:relative"
          )}
          animate={{
            width: sidebarCollapsed ? "64px" : "320px"
          }}
          transition={{
            duration: 0.15, // Faster for 3-second rule (Reddit optimization)
            ease: [0.4, 0, 0.2, 1], // Apple's ease curve
            type: "tween"
          }}
          whileHover={{
            boxShadow: "4px 0 20px rgba(245, 158, 11, 0.1)"
          }}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
              {!sidebarCollapsed && (
                <h1 className="text-lg font-semibold text-white">Notes</h1>
              )}
              <motion.button
                data-testid="sidebar-toggle"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={cn(
                  "w-8 h-8 rounded-lg hover:bg-white/5 transition-all duration-200",
                  "flex items-center justify-center text-white/70 focus-ring",
                  "hover:text-orange-500 hover:scale-105"
                )}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(245, 158, 11, 0.1)"
                }}
                whileTap={{
                  scale: 0.95,
                  rotate: 15
                }}
                transition={{ duration: 0.15 }}
              >
                <motion.svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  animate={{
                    rotate: sidebarCollapsed ? 180 : 0
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </motion.svg>
              </motion.button>
            </div>

            {/* Smart Collections */}
            <div
              className="p-2 relative"
              onMouseEnter={() => setHoveredElement('collections')}
              onMouseLeave={() => setHoveredElement(null)}
            >
              {/* Progressive Actions for Collections */}
              <ProgressiveActions
                isVisible={hoveredElement === 'collections' && !sidebarCollapsed}
                context="sidebar"
                onAction={handleSidebarAction}
                className="absolute top-2 right-2 z-10"
              />

              {[
                { id: 'inbox', name: 'Inbox', icon: '📥', count: 12 },
                { id: 'today', name: 'Today', icon: '📅', count: 5 },
                { id: 'completed', name: 'Completed', icon: '✅', count: 23 }
              ].map((collection, index) => (
                <motion.button
                  key={collection.id}
                  data-testid="project-item"
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg",
                    "hover:bg-white/10 transition-all duration-200 text-left focus-ring",
                    selectedProject === collection.id && "bg-orange-500/20 text-orange-500 shadow-md"
                  )}
                  onClick={() => setSelectedProject(collection.id)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.1,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                  whileHover={{
                    scale: 1.02,
                    x: 4
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.span
                    className="text-lg"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {collection.icon}
                  </motion.span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium text-white">{collection.name}</span>
                      <motion.span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          selectedProject === collection.id
                            ? "bg-orange-500/30 text-orange-300"
                            : "bg-white/10 text-white/60"
                        )}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.15 }}
                      >
                        {collection.count}
                      </motion.span>
                    </>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Projects Section */}
            {!sidebarCollapsed && (
              <div className="flex-1 p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <h3 className="text-sm font-medium text-white/60 uppercase tracking-wide">Projects</h3>
                  <button
                    onClick={() => setShowNewNoteModal(true)}
                    className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs hover:bg-orange-600 transition-colors"
                    title="Create new note"
                    aria-label="Create new note"
                  >
                    +
                  </button>
                </div>

                {/* Project List */}
                <div className="space-y-1">
                  {[
                    { id: 'work', name: 'Work', color: '#ff3b30', count: 8 },
                    { id: 'personal', name: 'Personal', color: '#34c759', count: 15 },
                    { id: 'ideas', name: 'Ideas', color: '#af52de', count: 6 }
                  ].map((project) => (
                    <button
                      key={project.id}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2 rounded-lg",
                        "hover:bg-white/10 transition-colors text-left",
                        selectedProject === project.id && "bg-orange-500/20 text-orange-500"
                      )}
                      onClick={() => setSelectedProject(project.id)}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="flex-1 text-sm font-medium text-white">{project.name}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        selectedProject === project.id
                          ? "bg-orange-500/30 text-orange-300"
                          : "bg-white/10 text-white/60"
                      )}>
                        {project.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Middle Panel - Note List */}
        <motion.div
          data-testid="note-list"
          className={cn(
            "h-full flex-shrink-0",
            "liquid-glass liquid-glass--note-list liquid-glass--animate-entrance",
            // Responsive widths
            "w-full sm:w-[280px] md:w-[300px] lg:w-[320px]",
            // Mobile: hide when editor is open
            selectedNote ? "hidden lg:block" : "block"
          )}
          layout
        >
          <div className="h-full flex flex-col">
            {/* Note List Header */}
            <div className="border-b border-white/10">
              <div className="h-14 flex items-center justify-between px-4">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">
                    {selectedProject ?
                      selectedProject.charAt(0).toUpperCase() + selectedProject.slice(1) :
                      'All Notes'
                    }
                  </h2>
                  <p className="text-sm text-white/60">{notes.length} {notes.length === 1 ? 'note' : 'notes'}</p>
                </div>

                {/* NEW NOTE BUTTON - CRITICAL FIX */}
                <button
                  onClick={() => setShowNewNoteModal(true)}
                  className="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-1"
                  title="Create new note"
                  aria-label="Create new note"
                >
                  <span>+</span>
                  <span>New</span>
                </button>
              </div>

              {/* Progressive Search */}
              <div className="px-4 pb-3">
                <ProgressiveSearch
                  isExpanded={showAdvancedSearch}
                  onExpand={setShowAdvancedSearch}
                  onSearch={handleSearch}
                />
              </div>
            </div>

            {/* Simple Note List - Now with real Supabase data! */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-white/60">Loading notes...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <p className="text-sm text-red-500 mb-2">⚠️ {error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-orange-500 hover:underline"
                  >
                    Reload page
                  </button>
                </div>
              </div>
            ) : (
              <SimpleNoteList
                notes={transformedNotes}
                selectedNoteId={selectedNote}
                onNoteSelect={setSelectedNote}
                onTogglePin={togglePin}
              />
            )}
          </div>
        </motion.div>

        {/* Right Panel - Note Editor */}
        <div
          data-testid="note-editor"
          className={cn(
            "flex-1 h-full",
            "liquid-glass liquid-glass--editor liquid-glass--animate-entrance",
            // Mobile: full width when note selected, hidden otherwise
            selectedNote ? "block w-full" : "hidden lg:block"
          )}
        >
          <div className="h-full flex flex-col">
            {selectedNote ? (
              <>
                {/* Editor Header - hides when writing */}
                <motion.div
                  className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-white/10"
                  animate={{
                    opacity: isWriting ? 0 : 1,
                    y: isWriting ? -20 : 0
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  {/* Mobile Back Button */}
                  <motion.button
                    className="lg:hidden w-8 h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center text-orange-500 mr-2"
                    onClick={() => setSelectedNote(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Back to note list"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </motion.button>

                  <input
                    type="text"
                    className="text-lg font-semibold text-white bg-transparent border-none outline-none flex-1 focus-ring placeholder:text-white/40"
                    defaultValue="Note Title"
                    placeholder="Note title..."
                  />
                  <div className="flex items-center space-x-2">
                    <motion.button
                      className={cn(
                        "w-8 h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center focus-ring",
                        transformedNotes.find(n => n.id === selectedNote)?.isPinned
                          ? "text-orange-500"
                          : "text-white/60"
                      )}
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => selectedNote && togglePin(selectedNote)}
                      title={transformedNotes.find(n => n.id === selectedNote)?.isPinned ? "Unpin note" : "Pin note"}
                      aria-label={transformedNotes.find(n => n.id === selectedNote)?.isPinned ? "Unpin note" : "Pin note"}
                    >
                      📌
                    </motion.button>
                    <motion.button
                      className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center text-white/60 focus-ring"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ⋯
                    </motion.button>
                  </div>
                </motion.div>

                {/* Editor Content with Progressive Disclosure */}
                <ContentFocusMode
                  isActive={isWriting}
                  onToggle={setIsWriting}
                  className="flex-1 p-6 relative"
                >
                  {/* Progressive Toolbar - appears on text selection */}
                  <ProgressiveToolbar
                    isVisible={showToolbar && selectedText}
                    position="floating"
                    onAction={handleToolbarAction}
                  />

                  <textarea
                    ref={editorRef}
                    className={cn(
                      "w-full h-full resize-none border-none outline-none text-white leading-relaxed transition-all duration-300 bg-transparent placeholder:text-white/40",
                      isWriting ? "text-lg leading-loose" : "text-base"
                    )}
                    placeholder="Start writing... Select text to see formatting options appear."
                    defaultValue="This is the note content area where users can write their thoughts..."
                    onFocus={() => setIsWriting(true)}
                    onBlur={() => {
                      setIsWriting(false);
                      setShowToolbar(false);
                      setSelectedText(false);
                    }}
                    onMouseUp={handleTextSelection}
                    onKeyUp={handleTextSelection}
                  />

                  {/* Writing mode indicator */}
                  <motion.div
                    className="absolute bottom-4 right-4 px-3 py-1 bg-orange-500 text-white text-xs rounded-full"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: isWriting ? 1 : 0,
                      scale: isWriting ? 1 : 0.8
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    Content Focus Mode
                  </motion.div>
                </ContentFocusMode>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Select a note</h3>
                  <p className="text-sm text-white/60">Choose a note from the list to view or edit</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Todoist-Style Quick Capture FAB */}
      <motion.button
        data-testid="quick-capture-fab"
        aria-label="Open voice capture"
        className={cn(
          "fixed w-14 h-14 rounded-full",
          "bg-orange-500 text-white shadow-lg focus-ring",
          "flex items-center justify-center",
          "hover:bg-orange-600 transition-all duration-200",
          "z-50",
          // Responsive positioning - mobile safe area
          "bottom-6 right-6 md:bottom-8 md:right-8",
          // Touch-friendly on mobile
          "active:scale-95 sm:active:scale-100"
        )}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.5
        }}
        whileHover={{
          scale: 1.1,
          boxShadow: "0 8px 32px rgba(245, 158, 11, 0.4)"
        }}
        whileTap={{
          scale: 0.9,
          rotate: 15
        }}
        onClick={() => setShowVoiceCapture(true)}
      >
        <motion.svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          whileHover={{
            scale: 1.1,
            rotate: 10
          }}
          transition={{ duration: 0.2 }}
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </motion.svg>
      </motion.button>

      {/* Voice Capture Modal */}
      <AnimatePresence mode="wait">
        {showVoiceCapture && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => setShowVoiceCapture(false)}
            />

            {/* Modal */}
            <motion.div
              data-testid="voice-capture-modal"
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 400,
                mass: 0.8
              }}
            >
              <div className="relative">
                {/* Close Button */}
                <motion.button
                  data-testid="modal-close"
                  aria-label="Close voice capture modal"
                  className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 text-white rounded-full flex items-center justify-center z-10 hover:bg-red-500 transition-all duration-200 focus-ring"
                  onClick={() => setShowVoiceCapture(false)}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  whileHover={{
                    scale: 1.1,
                    backgroundColor: "#ff3b30",
                    rotate: 90
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                >
                  <motion.svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </motion.svg>
                </motion.button>

                <Suspense fallback={
                  <div className="w-80 h-64 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-white/60">Loading voice capture...</p>
                    </div>
                  </div>
                }>
                  <SimpleVoiceCapture
                    onTranscriptComplete={handleVoiceNoteComplete}
                    onError={(error) => {
                      console.error('Voice capture error:', error);
                      toast.error('Voice capture error', {
                        description: error
                      });
                    }}
                    className="shadow-2xl"
                  />
                </Suspense>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* NEW NOTE MODAL - Dark theme */}
      <AnimatePresence>
        {showNewNoteModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowNewNoteModal(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl w-full max-w-lg p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">New Note</h3>
                  <button
                    onClick={() => setShowNewNoteModal(false)}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center text-white/60"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <textarea
                  ref={newNoteContentRef}
                  className="w-full h-48 p-3 border border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/5 text-white placeholder:text-white/40"
                  placeholder="Start writing your note..."
                  autoFocus
                />

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setShowNewNoteModal(false)}
                    className="px-4 py-2 text-white/60 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNewNote}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    Create Note
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notifications - Dark theme */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(20px)',
          },
          className: 'font-system',
          duration: 3000,
        }}
        richColors
      />
    </div>
  );
};

// Performance optimization - memoize AppShell to prevent unnecessary re-renders
export const AppShell = React.memo(AppShellComponent);
