import { useState, useCallback, useRef } from 'react';

interface AIEnrichmentResult {
  category: string;
  folder: string;
  subFolder?: string;
  tags: string[];
  priority: 'urgent' | 'high' | 'medium' | 'low';
  actionItems: string[];
  reminders: string[];
  confidence: number;
  suggestedConnections: string[];
}

interface AIEnrichmentState {
  isProcessing: boolean;
  result: AIEnrichmentResult | null;
  error: string | null;
}

interface AIEnrichmentControls {
  categorize: (content: string) => Promise<AIEnrichmentResult | null>;
  clear: () => void;
}

export function useAIEnrichment(): AIEnrichmentState & AIEnrichmentControls {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AIEnrichmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const categorize = useCallback(async (content: string): Promise<AIEnrichmentResult | null> => {
    if (!content.trim()) return null;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          model: 'gpt-5-mini',
          includeAdvancedAnalysis: true
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const aiResult: AIEnrichmentResult = await response.json();

      setResult(aiResult);
      setIsProcessing(false);

      return aiResult;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't update state
        return null;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsProcessing(false);

      // Fallback to basic categorization
      const fallbackResult = generateFallbackCategorization(content);
      setResult(fallbackResult);

      return fallbackResult;
    }
  }, []);

  const clear = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setResult(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    isProcessing,
    result,
    error,
    categorize,
    clear
  };
}

// Fallback categorization when AI is unavailable
function generateFallbackCategorization(content: string): AIEnrichmentResult {
  const lowerContent = content.toLowerCase();

  // Simple keyword-based categorization
  let category = 'Notes';
  let folder = 'General';
  let priority: 'urgent' | 'high' | 'medium' | 'low' = 'medium';

  // Task detection
  if (lowerContent.includes('todo') || lowerContent.includes('task') ||
      lowerContent.includes('need to') || lowerContent.includes('remember to') ||
      lowerContent.includes('don\'t forget')) {
    category = 'Tasks';
    folder = 'General Tasks';
  }

  // Idea detection
  if (lowerContent.includes('idea') || lowerContent.includes('concept') ||
      lowerContent.includes('what if') || lowerContent.includes('maybe') ||
      lowerContent.includes('could')) {
    category = 'Ideas';
    folder = 'Creative Ideas';
  }

  // Reminder detection
  if (lowerContent.includes('remind') || lowerContent.includes('tomorrow') ||
      lowerContent.includes('next week') || lowerContent.includes('appointment') ||
      lowerContent.includes('meeting')) {
    category = 'Reminders';
    folder = 'General Reminders';
  }

  // Learning detection
  if (lowerContent.includes('learn') || lowerContent.includes('study') ||
      lowerContent.includes('tutorial') || lowerContent.includes('course') ||
      lowerContent.includes('research')) {
    category = 'Learning';
    folder = 'Study Notes';
  }

  // Priority detection
  if (lowerContent.includes('urgent') || lowerContent.includes('asap') ||
      lowerContent.includes('immediately') || lowerContent.includes('critical')) {
    priority = 'urgent';
  } else if (lowerContent.includes('important') || lowerContent.includes('high priority')) {
    priority = 'high';
  } else if (lowerContent.includes('low priority') || lowerContent.includes('maybe later')) {
    priority = 'low';
  }

  // Extract basic tags
  const tags: string[] = [];
  const words = content.split(/\s+/).map(w => w.toLowerCase().replace(/[^\w]/g, ''));

  // Common tag words
  const tagWords = ['work', 'personal', 'project', 'meeting', 'call', 'email', 'buy', 'read', 'write'];
  tagWords.forEach(word => {
    if (words.includes(word)) {
      tags.push(word);
    }
  });

  return {
    category,
    folder,
    tags: tags.slice(0, 3), // Limit to 3 tags
    priority,
    actionItems: [],
    reminders: [],
    confidence: 0.6, // Lower confidence for fallback
    suggestedConnections: []
  };
}