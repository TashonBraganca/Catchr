/**
 * Progressive Disclosure UI Components
 *
 * Based on Reddit research insights:
 * - Apple Notes: "Formatting tools are hidden until the user clicks the button to reveal them"
 * - "Interface gets out of the way completely - focus is 100% on your writing"
 * - "Clean interface while keeping advanced features accessible"
 *
 * Implementation Patterns:
 * - Hide complexity by default
 * - Show tools on hover/focus
 * - Contextual revelation
 * - Smooth animations with Apple's ease curves
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Apple's standard ease curve for all progressive disclosure animations
const appleEase = [0.4, 0, 0.2, 1];

interface ProgressiveToolbarProps {
  isVisible: boolean;
  position?: 'top' | 'bottom' | 'floating';
  onAction?: (action: string) => void;
  className?: string;
}

export const ProgressiveToolbar: React.FC<ProgressiveToolbarProps> = ({
  isVisible,
  position = 'floating',
  onAction,
  className
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toolSections = {
    format: [
      { id: 'bold', icon: <strong>B</strong>, label: 'Bold' },
      { id: 'italic', icon: <em>I</em>, label: 'Italic' },
      { id: 'underline', icon: 'U', label: 'Underline' }
    ],
    structure: [
      { id: 'bullet', icon: '•', label: 'Bullet List' },
      { id: 'number', icon: '1.', label: 'Numbered List' },
      { id: 'header', icon: 'H', label: 'Header' }
    ],
    media: [
      { id: 'voice', icon: '🎤', label: 'Voice Input' },
      { id: 'image', icon: '📷', label: 'Add Image' },
      { id: 'link', icon: '🔗', label: 'Add Link' }
    ]
  };

  const positionClasses = {
    top: 'top-4 left-1/2 transform -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 transform -translate-x-1/2',
    floating: 'top-4 right-4'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'absolute z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-[#e5e5e7] p-3',
            'liquid-glass liquid-glass--rounded-lg',
            positionClasses[position],
            className
          )}
          initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? -10 : 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? -10 : 10 }}
          transition={{ duration: 0.2, ease: appleEase }}
        >
          <div className="flex items-center space-x-4">
            {Object.entries(toolSections).map(([sectionName, tools]) => (
              <div key={sectionName} className="flex items-center space-x-1">
                {tools.map((tool, index) => (
                  <motion.button
                    key={tool.id}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm',
                      'hover:bg-[#f2f2f7] transition-colors duration-150',
                      'text-[#8e8e93] hover:text-[#1d1d1f]',
                      'focus:ring-2 focus:ring-[#007aff]/20 focus:outline-none'
                    )}
                    onClick={() => onAction?.(tool.id)}
                    title={tool.label}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.15,
                      delay: index * 0.05,
                      ease: appleEase
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {tool.icon}
                  </motion.button>
                ))}
                {sectionName !== 'media' && (
                  <div className="w-px h-4 bg-[#e5e5e7] mx-1" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ProgressiveSearchProps {
  isExpanded: boolean;
  onExpand: (expanded: boolean) => void;
  onSearch: (query: string, filters: string[]) => void;
  className?: string;
}

export const ProgressiveSearch: React.FC<ProgressiveSearchProps> = ({
  isExpanded,
  onExpand,
  onSearch,
  className
}) => {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const searchFilters = [
    { id: 'text', label: 'Text', icon: '📝' },
    { id: 'tags', label: 'Tags', icon: '🏷️' },
    { id: 'date', label: 'Date', icon: '📅' },
    { id: 'voice', label: 'Voice Notes', icon: '🎤' }
  ];

  const toggleFilter = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    setActiveFilters(newFilters);
    onSearch(query, newFilters);
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value, activeFilters);
          }}
          onFocus={() => onExpand(true)}
          onBlur={() => setTimeout(() => onExpand(false), 200)}
          className={cn(
            'w-full px-3 py-2 text-sm bg-[#f2f2f7] border-0 rounded-lg',
            'placeholder-[#8e8e93] text-[#1d1d1f]',
            'focus:bg-white focus:ring-2 focus:ring-[#007aff]/20 focus:outline-none',
            'transition-all duration-150'
          )}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="w-4 h-4 text-[#8e8e93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Advanced Search Options */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-[#e5e5e7] z-10"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: appleEase }}
          >
            <div className="mb-2">
              <h4 className="text-xs font-medium text-[#8e8e93] uppercase tracking-wide mb-2">
                Search in:
              </h4>
              <div className="flex flex-wrap gap-1">
                {searchFilters.map((filter) => (
                  <motion.button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    className={cn(
                      'flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-colors',
                      activeFilters.includes(filter.id)
                        ? 'bg-[#007aff] text-white'
                        : 'bg-[#f2f2f7] text-[#8e8e93] hover:bg-[#007aff]/10 hover:text-[#007aff]'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {activeFilters.length > 0 && (
              <motion.div
                className="pt-2 border-t border-[#e5e5e7]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8e8e93]">
                    Searching in {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => {
                      setActiveFilters([]);
                      onSearch(query, []);
                    }}
                    className="text-xs text-[#007aff] hover:text-[#0056b3]"
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ProgressiveActionsProps {
  isVisible: boolean;
  context: 'note' | 'list' | 'sidebar';
  onAction: (action: string) => void;
  className?: string;
}

export const ProgressiveActions: React.FC<ProgressiveActionsProps> = ({
  isVisible,
  context,
  onAction,
  className
}) => {
  const actionSets = {
    note: [
      { id: 'share', icon: '↗️', label: 'Share' },
      { id: 'duplicate', icon: '📋', label: 'Duplicate' },
      { id: 'archive', icon: '📦', label: 'Archive' },
      { id: 'delete', icon: '🗑️', label: 'Delete' }
    ],
    list: [
      { id: 'sort', icon: '↕️', label: 'Sort' },
      { id: 'filter', icon: '🔍', label: 'Filter' },
      { id: 'export', icon: '📤', label: 'Export' }
    ],
    sidebar: [
      { id: 'new-folder', icon: '📁', label: 'New Folder' },
      { id: 'import', icon: '📥', label: 'Import' },
      { id: 'settings', icon: '⚙️', label: 'Settings' }
    ]
  };

  const actions = actionSets[context] || [];

  return (
    <AnimatePresence>
      {isVisible && actions.length > 0 && (
        <motion.div
          className={cn(
            'flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-[#e5e5e7]',
            className
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15, ease: appleEase }}
        >
          {actions.map((action, index) => (
            <motion.button
              key={action.id}
              onClick={() => onAction(action.id)}
              className="w-7 h-7 rounded-md hover:bg-[#f2f2f7] flex items-center justify-center text-[#8e8e93] hover:text-[#1d1d1f] transition-colors"
              title={action.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.15,
                delay: index * 0.03,
                ease: appleEase
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-sm">{action.icon}</span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ContentFocusModeProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const ContentFocusMode: React.FC<ContentFocusModeProps> = ({
  isActive,
  onToggle,
  children,
  className
}) => {
  return (
    <div
      className={cn(
        'relative transition-all duration-300 ease-out',
        isActive && 'transform scale-105',
        className
      )}
      onFocus={() => onToggle(true)}
      onBlur={() => onToggle(false)}
    >
      {/* Content-first overlay that hides UI elements */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: appleEase }}
          >
            {/* Subtle gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-white/50 rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {children}

      {/* Focus indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className="absolute -inset-2 rounded-xl border-2 border-[#007aff]/20 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: appleEase }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default {
  ProgressiveToolbar,
  ProgressiveSearch,
  ProgressiveActions,
  ContentFocusMode
};