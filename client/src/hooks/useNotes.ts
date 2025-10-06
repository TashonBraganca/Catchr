import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * NOTE INTERFACE
 * Matches Supabase 'thoughts' table schema
 */
export interface Note {
  id: string;
  user_id: string;
  content: string;
  title?: string;
  tags?: string[];
  category?: {
    main: string;
    sub?: string;
  };
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * USE NOTES HOOK
 *
 * Fetches and manages notes from Supabase 'thoughts' table
 * Replaces mock data with real database operations
 *
 * Features:
 * - Real-time note fetching with RLS (Row Level Security)
 * - Create, update, delete operations
 * - Optimistic UI updates
 * - Error handling
 *
 * Fixes user report: "there is not button or option to create a new note
 * fix that too and make sure it works well, and adds itself to the database"
 */
export const useNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * FETCH NOTES FROM SUPABASE
   * Only fetches notes for the current authenticated user (RLS enforced)
   */
  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('thoughts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform Supabase data to match Note interface
      const transformedNotes: Note[] = (data || []).map(thought => ({
        id: thought.id,
        user_id: thought.user_id,
        content: thought.content || '',
        title: thought.title || extractTitleFromContent(thought.content || ''),
        tags: thought.tags || [],
        category: thought.category || { main: 'note' },
        is_pinned: thought.is_pinned || false,
        created_at: thought.created_at,
        updated_at: thought.updated_at
      }));

      setNotes(transformedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * CREATE NEW NOTE
   * Saves to Supabase 'thoughts' table
   */
  const createNote = useCallback(async (noteData: {
    content: string;
    title?: string;
    tags?: string[];
    category?: { main: string; sub?: string };
  }): Promise<Note | null> => {
    if (!user) {
      setError('Must be logged in to create notes');
      return null;
    }

    try {
      // Note: is_pinned and title will be added via migration 004
      // For now, only use fields that exist in the schema
      const { data, error: createError } = await supabase
        .from('thoughts')
        .insert({
          user_id: user.id,
          content: noteData.content,
          // title: noteData.title || extractTitleFromContent(noteData.content), // TODO: Add after migration 004
          tags: noteData.tags || [],
          category: noteData.category || { main: 'note' },
          // is_pinned: false, // TODO: Add after migration 004
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Optimistic UI update
      const newNote: Note = {
        id: data.id,
        user_id: data.user_id,
        content: data.content,
        title: data.title || noteData.title || extractTitleFromContent(data.content), // Fallback to extract from content
        tags: data.tags || [],
        category: data.category || { main: 'note' },
        is_pinned: data.is_pinned !== undefined ? data.is_pinned : false, // Handle if column doesn't exist
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      console.error('Error creating note:', err);
      setError(err instanceof Error ? err.message : 'Failed to create note');
      return null;
    }
  }, [user]);

  /**
   * UPDATE NOTE
   */
  const updateNote = useCallback(async (
    noteId: string,
    updates: Partial<Pick<Note, 'content' | 'title' | 'tags' | 'category' | 'is_pinned'>>
  ): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in to update notes');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('thoughts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .eq('user_id', user.id); // RLS security

      if (updateError) {
        throw updateError;
      }

      // Optimistic UI update
      setNotes(prev =>
        prev.map(note =>
          note.id === noteId
            ? { ...note, ...updates, updated_at: new Date().toISOString() }
            : note
        )
      );

      return true;
    } catch (err) {
      console.error('Error updating note:', err);
      setError(err instanceof Error ? err.message : 'Failed to update note');
      return false;
    }
  }, [user]);

  /**
   * DELETE NOTE
   */
  const deleteNote = useCallback(async (noteId: string): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in to delete notes');
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('thoughts')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id); // RLS security

      if (deleteError) {
        throw deleteError;
      }

      // Optimistic UI update
      setNotes(prev => prev.filter(note => note.id !== noteId));
      return true;
    } catch (err) {
      console.error('Error deleting note:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      return false;
    }
  }, [user]);

  /**
   * TOGGLE PIN
   */
  const togglePin = useCallback(async (noteId: string): Promise<boolean> => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return false;

    return updateNote(noteId, { is_pinned: !note.is_pinned });
  }, [notes, updateNote]);

  // Fetch notes on mount and when user changes
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    refetch: fetchNotes
  };
};

/**
 * HELPER: Extract title from content
 * Takes first line or first 50 characters
 */
function extractTitleFromContent(content: string): string {
  if (!content) return 'Untitled Note';

  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length > 0) {
    return firstLine.length > 50
      ? firstLine.substring(0, 50) + '...'
      : firstLine;
  }

  return content.length > 50
    ? content.substring(0, 50) + '...'
    : content;
}
