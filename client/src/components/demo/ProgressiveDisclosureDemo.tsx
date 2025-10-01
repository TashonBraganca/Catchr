/**
 * Progressive Disclosure Demo Component
 *
 * Demonstrates the Apple Notes-inspired progressive disclosure patterns
 * in a realistic editing environment. Shows how the interface adapts
 * to user context and behavior.
 */

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ProgressiveToolbar,
  ProgressiveSearch,
  ProgressiveActions,
  ContentFocusMode
} from '@/components/ui/ProgressiveDisclosure';

interface ProgressiveDisclosureDemoProps {
  className?: string;
}

export const ProgressiveDisclosureDemo: React.FC<ProgressiveDisclosureDemoProps> = ({
  className
}) => {
  // Progressive disclosure state
  const [isWriting, setIsWriting] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState(false);

  // Editor state
  const [editorContent, setEditorContent] = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Demo notes
  const demoNotes = [
    { id: '1', title: 'Meeting Notes', preview: 'Discussed project timeline and next steps...', date: '2 hours ago' },
    { id: '2', title: 'Weekend Plans', preview: 'Visit the farmer\'s market, go for a hike...', date: 'Yesterday' },
    { id: '3', title: 'Book Ideas', preview: 'Interesting concepts for the next chapter...', date: '3 days ago' }
  ];

  const handleToolbarAction = (action: string) => {
    console.log(`Toolbar action: ${action}`);
    // In a real app, this would apply formatting to selected text
  };

  const handleSearch = (query: string, filters: string[]) => {
    console.log(`Search: "${query}" with filters:`, filters);
    // In a real app, this would filter the notes list
  };

  const handleNoteAction = (action: string) => {
    console.log(`Note action: ${action}`);
    // In a real app, this would perform the selected action
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    setSelectedText(!!hasSelection);
    setShowToolbar(!!hasSelection);
  };

  return (
    <div className={cn('h-full flex bg-[#fbfbfd]', className)}>
      {/* Sidebar Demo */}
      <div className="w-64 h-full bg-white border-r border-[#e5e5e7] p-4">
        <div
          className="mb-4"
          onMouseEnter={() => setHoveredElement('sidebar')}
          onMouseLeave={() => setHoveredElement(null)}
        >
          <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">Smart Collections</h3>

          {/* Progressive Actions for Sidebar */}
          <div className="relative">
            <ProgressiveActions
              isVisible={hoveredElement === 'sidebar'}
              context="sidebar"
              onAction={handleNoteAction}
              className="absolute top-0 right-0"
            />
          </div>

          <div className="space-y-2">
            {['📥 Inbox (12)', '📅 Today (5)', '✅ Completed (23)'].map((item, index) => (
              <div
                key={index}
                className="p-2 rounded-lg hover:bg-[#f2f2f7] cursor-pointer transition-colors"
              >
                <span className="text-sm text-[#1d1d1f]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#e5e5e7] pt-4">
          <h4 className="text-sm font-medium text-[#8e8e93] mb-2">PROJECTS</h4>
          <div className="space-y-1">
            {[
              { name: 'Work', color: '#ff3b30', count: 8 },
              { name: 'Personal', color: '#34c759', count: 15 },
              { name: 'Ideas', color: '#af52de', count: 6 }
            ].map((project) => (
              <div key={project.name} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#f2f2f7] cursor-pointer">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="flex-1 text-sm">{project.name}</span>
                <span className="text-xs bg-[#8e8e93]/20 text-[#8e8e93] px-2 py-1 rounded-full">
                  {project.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note List Demo */}
      <div className="w-80 h-full bg-white border-r border-[#e5e5e7] flex flex-col">
        <div className="p-4 border-b border-[#e5e5e7]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#8e8e93]">All Notes</h2>
            <div
              onMouseEnter={() => setHoveredElement('list')}
              onMouseLeave={() => setHoveredElement(null)}
              className="relative"
            >
              <ProgressiveActions
                isVisible={hoveredElement === 'list'}
                context="list"
                onAction={handleNoteAction}
              />
            </div>
          </div>

          {/* Progressive Search */}
          <ProgressiveSearch
            isExpanded={showAdvancedSearch}
            onExpand={setShowAdvancedSearch}
            onSearch={handleSearch}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {demoNotes.map((note) => (
            <div
              key={note.id}
              className="p-4 border-b border-[#e5e5e7] hover:bg-[#f9f9f9] cursor-pointer group"
              onMouseEnter={() => setHoveredElement(`note-${note.id}`)}
              onMouseLeave={() => setHoveredElement(null)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-[#1d1d1f] text-sm">{note.title}</h3>
                <ProgressiveActions
                  isVisible={hoveredElement === `note-${note.id}`}
                  context="note"
                  onAction={handleNoteAction}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <p className="text-sm text-[#8e8e93] mb-2 line-clamp-2">{note.preview}</p>
              <span className="text-xs text-[#8e8e93]">{note.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Demo */}
      <div className="flex-1 h-full flex flex-col relative">
        {/* Header - hides when writing */}
        <motion.div
          className="h-14 flex items-center justify-between px-6 border-b border-[#e5e5e7] bg-white"
          animate={{
            opacity: isWriting ? 0 : 1,
            y: isWriting ? -20 : 0
          }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <div>
            <h3 className="text-lg font-medium text-[#1d1d1f]">Demo Note</h3>
            <p className="text-sm text-[#8e8e93]">Progressive disclosure in action</p>
          </div>

          {/* Static formatting tools (hidden during writing) */}
          <div className="flex items-center space-x-2">
            <button className="w-8 h-8 rounded hover:bg-[#f2f2f7] flex items-center justify-center text-[#8e8e93]">
              <strong>B</strong>
            </button>
            <button className="w-8 h-8 rounded hover:bg-[#f2f2f7] flex items-center justify-center text-[#8e8e93]">
              <em>I</em>
            </button>
            <button className="w-8 h-8 rounded hover:bg-[#f2f2f7] flex items-center justify-center text-[#8e8e93]">
              •
            </button>
            <div className="w-px h-6 bg-[#e5e5e7] mx-2" />
            <button className="w-10 h-10 rounded-lg bg-[#007aff] text-white flex items-center justify-center">
              🎤
            </button>
          </div>
        </motion.div>

        {/* Content-First Editor Area */}
        <ContentFocusMode
          isActive={isWriting}
          onToggle={setIsWriting}
          className="flex-1 p-6 overflow-y-auto"
        >
          <div className="max-w-2xl mx-auto relative">
            {/* Progressive Toolbar - appears on text selection */}
            <ProgressiveToolbar
              isVisible={showToolbar && selectedText}
              position="floating"
              onAction={handleToolbarAction}
            />

            <textarea
              ref={editorRef}
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              onFocus={() => setIsWriting(true)}
              onBlur={() => {
                setIsWriting(false);
                setShowToolbar(false);
                setSelectedText(false);
              }}
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              placeholder="Start writing... Notice how the interface adapts as you focus on content. Try selecting text to see the progressive toolbar appear."
              className={cn(
                'w-full h-full min-h-[500px] resize-none border-0 outline-none bg-transparent',
                'text-base leading-relaxed text-[#1d1d1f] placeholder-[#8e8e93]',
                'transition-all duration-300',
                isWriting && 'text-lg leading-loose' // Larger text when actively writing
              )}
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
          </div>
        </ContentFocusMode>

        {/* Demo Instructions */}
        <div className="absolute bottom-4 left-4 max-w-xs">
          <motion.div
            className="p-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-[#e5e5e7] text-xs"
            animate={{
              opacity: isWriting ? 0 : 1,
              y: isWriting ? 20 : 0
            }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="font-medium text-[#1d1d1f] mb-2">🎯 Try These Interactions:</h4>
            <ul className="space-y-1 text-[#8e8e93]">
              <li>• Hover over elements to reveal actions</li>
              <li>• Click in the editor to enter focus mode</li>
              <li>• Select text to see the progressive toolbar</li>
              <li>• Click search to see advanced options</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProgressiveDisclosureDemo;