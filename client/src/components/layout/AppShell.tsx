import React, { useState, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import VirtualizedNoteList, { Note } from '@/components/notes/VirtualizedNoteList';
import {
  ProgressiveToolbar,
  ProgressiveSearch,
  ProgressiveActions,
  ContentFocusMode
} from '@/components/ui/ProgressiveDisclosure';

// Lazy load voice capture component for better performance
const SimpleVoiceCapture = React.lazy(() => import('@/components/capture/SimpleVoiceCapture'));

// APPLE NOTES + TODOIST INSPIRED APP SHELL
// Three-panel layout: Sidebar (320px->64px) | Note List (300px) | Editor (flexible)

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

const AppShellComponent: React.FC<AppShellProps> = ({ children, className }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [showVoiceCapture, setShowVoiceCapture] = useState(false);
  const [mobileView, setMobileView] = useState<'sidebar' | 'list' | 'editor'>('list');

  // Progressive disclosure state
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [selectedText, setSelectedText] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  // Editor reference for progressive features
  const editorRef = useRef<HTMLTextAreaElement>(null);

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
    // TODO: Apply formatting to selected text in editor
  };

  const handleSearch = (query: string, filters: string[]) => {
    console.log(`Search: "${query}" with filters:`, filters);
    // TODO: Filter notes based on query and filters
  };

  const handleSidebarAction = (action: string) => {
    console.log(`Sidebar action: ${action}`);
    // TODO: Handle sidebar actions (new folder, import, settings)
  };

  const handleListAction = (action: string) => {
    console.log(`Note list action: ${action}`);
    // TODO: Handle list actions (sort, filter, export)
  };

  const handleTextSelection = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    setSelectedText(!!hasSelection);
    setShowToolbar(!!hasSelection);
  };

  // Mock notes data for virtualization demo
  const mockNotes: Note[] = Array.from({ length: 1000 }, (_, i) => ({
    id: `note-${i + 1}`,
    title: `Note ${i + 1}`,
    content: `This is the content of note ${i + 1}. It contains some sample text to demonstrate the virtualized list performance with thousands of notes.`,
    tags: [`tag${(i % 5) + 1}`, `category${(i % 3) + 1}`],
    lastModified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    isPinned: i < 3, // Pin first 3 notes
  }));

  return (
    <div className={cn(
      "h-screen w-full bg-[#fbfbfd] flex overflow-hidden",
      "text-[#1d1d1f] font-system",
      className
    )}>
      {/* Apple Notes Style Three-Panel Layout */}
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
            boxShadow: "4px 0 20px rgba(0, 0, 0, 0.05)"
          }}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#e5e5e7]">
              {!sidebarCollapsed && (
                <h1 className="text-lg font-semibold text-[#1d1d1f]">Notes</h1>
              )}
              <motion.button
                data-testid="sidebar-toggle"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={cn(
                  "w-8 h-8 rounded-lg hover:bg-[#f2f2f7] transition-all duration-200",
                  "flex items-center justify-center text-[#8e8e93] focus-ring",
                  "hover:text-[#007aff] hover:scale-105"
                )}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "rgba(0, 122, 255, 0.1)"
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
                    "hover:bg-[#f2f2f7] transition-all duration-200 text-left focus-ring",
                    selectedProject === collection.id && "bg-[#007aff] text-white shadow-md"
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
                      <span className="flex-1 text-sm font-medium">{collection.name}</span>
                      <motion.span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          selectedProject === collection.id
                            ? "bg-white/20 text-white"
                            : "bg-[#8e8e93]/20 text-[#8e8e93]"
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
                  <h3 className="text-sm font-medium text-[#8e8e93] uppercase tracking-wide">Projects</h3>
                  <button className="w-6 h-6 rounded-full bg-[#007aff] text-white flex items-center justify-center text-xs">
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
                        "hover:bg-[#f2f2f7] transition-colors text-left",
                        selectedProject === project.id && "bg-[#007aff] text-white"
                      )}
                      onClick={() => setSelectedProject(project.id)}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="flex-1 text-sm font-medium">{project.name}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        selectedProject === project.id
                          ? "bg-white/20 text-white"
                          : "bg-[#8e8e93]/20 text-[#8e8e93]"
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
            <div className="border-b border-[#e5e5e7]">
              <div className="h-14 flex items-center justify-between px-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1d1d1f]">
                    {selectedProject ?
                      selectedProject.charAt(0).toUpperCase() + selectedProject.slice(1) :
                      'All Notes'
                    }
                  </h2>
                  <p className="text-sm text-[#8e8e93]">42 notes</p>
                </div>

                {/* Progressive Actions for Note List */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredElement('note-list-header')}
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  <ProgressiveActions
                    isVisible={hoveredElement === 'note-list-header'}
                    context="list"
                    onAction={handleListAction}
                  />
                </div>
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

            {/* Virtualized Note List - Temporarily disabled for debugging */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-[#1d1d1f] mb-2">
                  Virtualized List Disabled
                </h3>
                <p className="text-sm text-[#8e8e93]">
                  {mockNotes.length} notes available - debugging mode
                </p>
              </div>
            </div>
            {/* <VirtualizedNoteList
              notes={mockNotes}
              selectedNoteId={selectedNote}
              onNoteSelect={setSelectedNote}
              height={typeof window !== 'undefined' ? window.innerHeight - (showAdvancedSearch ? 140 : 110) : 600}
            /> */}
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
                  className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-[#e5e5e7]"
                  animate={{
                    opacity: isWriting ? 0 : 1,
                    y: isWriting ? -20 : 0
                  }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                >
                  {/* Mobile Back Button */}
                  <motion.button
                    className="lg:hidden w-8 h-8 rounded-lg hover:bg-[#f2f2f7] transition-colors flex items-center justify-center text-[#007aff] mr-2"
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
                    className="text-lg font-semibold text-[#1d1d1f] bg-transparent border-none outline-none flex-1 focus-ring"
                    defaultValue="Note Title"
                    placeholder="Note title..."
                  />
                  <div className="flex items-center space-x-2">
                    <motion.button
                      className="w-8 h-8 rounded-lg hover:bg-[#f2f2f7] transition-colors flex items-center justify-center text-[#8e8e93] focus-ring"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      📌
                    </motion.button>
                    <motion.button
                      className="w-8 h-8 rounded-lg hover:bg-[#f2f2f7] transition-colors flex items-center justify-center text-[#8e8e93] focus-ring"
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
                      "w-full h-full resize-none border-none outline-none text-[#1d1d1f] leading-relaxed transition-all duration-300",
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
                    className="absolute bottom-4 right-4 px-3 py-1 bg-[#007aff] text-white text-xs rounded-full"
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
                  <div className="w-20 h-20 bg-[#f2f2f7] rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-lg font-medium text-[#1d1d1f] mb-2">Select a note</h3>
                  <p className="text-sm text-[#8e8e93]">Choose a note from the list to view or edit</p>
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
          "bg-[#007aff] text-white shadow-lg focus-ring",
          "flex items-center justify-center",
          "hover:bg-[#0056cc] transition-all duration-200",
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
          boxShadow: "0 8px 32px rgba(0, 122, 255, 0.4)"
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
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
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
                  className="absolute -top-2 -right-2 w-8 h-8 bg-[#8e8e93] text-white rounded-full flex items-center justify-center z-10 hover:bg-[#6d6d70] transition-all duration-200 focus-ring"
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
                  <div className="w-80 h-64 bg-white rounded-2xl border border-[#e5e5e7] shadow-2xl flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-6 h-6 border-2 border-[#007aff] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-[#8e8e93]">Loading voice capture...</p>
                    </div>
                  </div>
                }>
                  <SimpleVoiceCapture
                    onTranscriptComplete={(transcript, suggestedTitle, suggestedTags) => {
                      console.log('Voice note completed:', { transcript, suggestedTitle, suggestedTags });
                      // TODO: Create new note with this data
                      setShowVoiceCapture(false);
                    }}
                    onError={(error) => {
                      console.error('Voice capture error:', error);
                      // TODO: Show error toast
                    }}
                    className="shadow-2xl"
                  />
                </Suspense>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Performance optimization - memoize AppShell to prevent unnecessary re-renders
export const AppShell = React.memo(AppShellComponent);