import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import SimpleVoiceCapture from '@/components/capture/SimpleVoiceCapture';

// APPLE NOTES + TODOIST INSPIRED APP SHELL
// Three-panel layout: Sidebar (320px->64px) | Note List (300px) | Editor (flexible)

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, className }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [showVoiceCapture, setShowVoiceCapture] = useState(false);

  return (
    <div className={cn(
      "h-screen w-full bg-[#fbfbfd] flex overflow-hidden",
      "text-[#1d1d1f] font-system",
      className
    )}>
      {/* Apple Notes Style Three-Panel Layout */}
      <div className="flex w-full h-full">

        {/* Left Sidebar - Projects & Smart Collections */}
        <motion.div
          data-testid="sidebar"
          role="navigation"
          aria-label="Project navigation"
          className={cn(
            "h-full border-r border-[#e5e5e7] bg-[#fbfbfd] flex-shrink-0",
            "transition-all duration-300 ease-out"
          )}
          animate={{
            width: sidebarCollapsed ? "64px" : "320px"
          }}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#e5e5e7]">
              {!sidebarCollapsed && (
                <h1 className="text-lg font-semibold text-[#1d1d1f]">Notes</h1>
              )}
              <button
                data-testid="sidebar-toggle"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={cn(
                  "w-8 h-8 rounded-lg hover:bg-[#f2f2f7] transition-colors",
                  "flex items-center justify-center text-[#8e8e93]"
                )}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
            </div>

            {/* Smart Collections */}
            <div className="p-2">
              {[
                { id: 'inbox', name: 'Inbox', icon: '📥', count: 12 },
                { id: 'today', name: 'Today', icon: '📅', count: 5 },
                { id: 'completed', name: 'Completed', icon: '✅', count: 23 }
              ].map((collection) => (
                <button
                  key={collection.id}
                  data-testid="project-item"
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2 rounded-lg",
                    "hover:bg-[#f2f2f7] transition-colors text-left",
                    selectedProject === collection.id && "bg-[#007aff] text-white"
                  )}
                  onClick={() => setSelectedProject(collection.id)}
                >
                  <span className="text-lg">{collection.icon}</span>
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{collection.name}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        selectedProject === collection.id
                          ? "bg-white/20 text-white"
                          : "bg-[#8e8e93]/20 text-[#8e8e93]"
                      )}>
                        {collection.count}
                      </span>
                    </>
                  )}
                </button>
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
          className="w-[300px] h-full border-r border-[#e5e5e7] bg-white flex-shrink-0"
          layout
        >
          <div className="h-full flex flex-col">
            {/* Note List Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[#e5e5e7]">
              <div>
                <h2 className="text-lg font-semibold text-[#1d1d1f]">
                  {selectedProject ?
                    selectedProject.charAt(0).toUpperCase() + selectedProject.slice(1) :
                    'All Notes'
                  }
                </h2>
                <p className="text-sm text-[#8e8e93]">42 notes</p>
              </div>
              <button className="w-8 h-8 rounded-lg hover:bg-[#f2f2f7] transition-colors flex items-center justify-center text-[#8e8e93]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </div>

            {/* Note List Items */}
            <div className="flex-1 overflow-y-auto">
              {[1, 2, 3, 4, 5].map((noteId) => (
                <button
                  key={noteId}
                  className={cn(
                    "w-full p-4 border-b border-[#f2f2f7] text-left hover:bg-[#f8f9fa] transition-colors",
                    selectedNote === noteId.toString() && "bg-[#007aff]/10 border-l-4 border-l-[#007aff]"
                  )}
                  onClick={() => setSelectedNote(noteId.toString())}
                >
                  <h3 className="font-medium text-[#1d1d1f] mb-1 line-clamp-1">
                    Note Title {noteId}
                  </h3>
                  <p className="text-sm text-[#8e8e93] line-clamp-2 mb-2">
                    This is a preview of the note content that shows the first couple of lines...
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 bg-[#007aff]/20 text-[#007aff] rounded-full">
                      work
                    </span>
                    <span className="text-xs text-[#8e8e93]">2 hours ago</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Note Editor */}
        <div data-testid="note-editor" className="flex-1 h-full bg-white">
          <div className="h-full flex flex-col">
            {selectedNote ? (
              <>
                {/* Editor Header */}
                <div className="h-14 flex items-center justify-between px-6 border-b border-[#e5e5e7]">
                  <input
                    type="text"
                    className="text-lg font-semibold text-[#1d1d1f] bg-transparent border-none outline-none flex-1"
                    defaultValue="Note Title"
                  />
                  <div className="flex items-center space-x-2">
                    <button className="w-8 h-8 rounded-lg hover:bg-[#f2f2f7] transition-colors flex items-center justify-center text-[#8e8e93]">
                      📌
                    </button>
                    <button className="w-8 h-8 rounded-lg hover:bg-[#f2f2f7] transition-colors flex items-center justify-center text-[#8e8e93]">
                      ⋯
                    </button>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 p-6">
                  <textarea
                    className="w-full h-full resize-none border-none outline-none text-[#1d1d1f] text-base leading-relaxed"
                    placeholder="Start writing..."
                    defaultValue="This is the note content area where users can write their thoughts..."
                  />
                </div>
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
          "fixed bottom-8 right-8 w-14 h-14 rounded-full",
          "bg-[#007aff] text-white shadow-lg",
          "flex items-center justify-center",
          "hover:bg-[#0056cc] transition-colors",
          "z-50"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowVoiceCapture(true)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </motion.button>

      {/* Voice Capture Modal */}
      <AnimatePresence>
        {showVoiceCapture && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVoiceCapture(false)}
            />

            {/* Modal */}
            <motion.div
              data-testid="voice-capture-modal"
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="relative">
                {/* Close Button */}
                <button
                  data-testid="modal-close"
                  aria-label="Close voice capture modal"
                  className="absolute -top-2 -right-2 w-8 h-8 bg-[#8e8e93] text-white rounded-full flex items-center justify-center z-10 hover:bg-[#6d6d70] transition-colors"
                  onClick={() => setShowVoiceCapture(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>

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
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};