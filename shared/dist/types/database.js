// Generated database types for Supabase
// This file is generated from the database schema and should be kept in sync
// Type guards and utility functions
export function isValidThoughtType(type) {
    return ['idea', 'reminder', 'project', 'note', 'brainstorm'].includes(type);
}
export function isValidNotificationType(type) {
    return ['reminder', 'daily_digest', 'weekly_review', 'ai_processing_complete', 'system_update'].includes(type);
}
export function isValidProcessingStatus(status) {
    return ['pending', 'processing', 'completed', 'failed'].includes(status);
}
export function isValidProcessingType(type) {
    return ['categorization', 'reminder_extraction', 'expansion_suggestions'].includes(type);
}
export function isValidActivityType(type) {
    return ['thought_created', 'thought_updated', 'thought_deleted', 'login', 'export', 'search'].includes(type);
}
// Helper functions for type conversion
export function thoughtRowToThought(row) {
    return {
        id: row.id,
        userId: row.user_id,
        content: row.content,
        transcribedText: row.transcribed_text || undefined,
        category: {
            main: row.category.main,
            subcategory: row.category.subcategory || undefined,
            color: row.category.color,
            icon: row.category.icon,
        },
        tags: row.tags,
        type: row.type,
        reminderDate: row.reminder_date ? new Date(row.reminder_date) : undefined,
        isProcessed: row.is_processed,
        processedByAi: row.processed_by_ai ? new Date(row.processed_by_ai) : undefined,
        aiConfidence: row.ai_confidence || undefined,
        aiSuggestions: row.ai_suggestions ? {
            alternativeCategories: row.ai_suggestions.alternativeCategories || [],
            extractedEntities: row.ai_suggestions.extractedEntities || [],
            relatedThoughts: row.ai_suggestions.relatedThoughts || [],
            expansionPrompts: row.ai_suggestions.expansionPrompts || [],
        } : undefined,
        createdAt: new Date(row.created_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
}
export function thoughtToThoughtInsert(thought) {
    return {
        user_id: thought.userId,
        content: thought.content,
        transcribed_text: thought.transcribedText || null,
        category: thought.category ? {
            main: thought.category.main,
            subcategory: thought.category.subcategory || null,
            color: thought.category.color || '#6B7280',
            icon: thought.category.icon || '📝',
        } : undefined,
        tags: thought.tags || [],
        type: thought.type || 'note',
        reminder_date: thought.reminderDate?.toISOString() || null,
        is_processed: thought.isProcessed || false,
        ai_confidence: thought.aiConfidence || null,
        ai_suggestions: thought.aiSuggestions ? {
            alternativeCategories: thought.aiSuggestions.alternativeCategories?.map(cat => ({
                main: cat.main,
                subcategory: cat.subcategory || undefined,
                color: cat.color || '#6B7280',
                icon: cat.icon || '📝'
            })) || [],
            extractedEntities: thought.aiSuggestions.extractedEntities || [],
            relatedThoughts: thought.aiSuggestions.relatedThoughts || [],
            expansionPrompts: thought.aiSuggestions.expansionPrompts || [],
        } : null,
    };
}
//# sourceMappingURL=database.js.map