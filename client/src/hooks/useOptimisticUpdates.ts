import { useState, useCallback } from 'react';

interface OptimisticState<T> {
  data: T | null;
  isOptimistic: boolean;
  error: string | null;
}

interface OptimisticControls<T> {
  optimisticUpdate: (data: T) => Promise<T>;
  rollback: () => void;
  clear: () => void;
}

export function useOptimisticUpdates<T>(): OptimisticState<T> & OptimisticControls<T> {
  const [state, setState] = useState<OptimisticState<T>>({
    data: null,
    isOptimistic: false,
    error: null
  });

  const [previousState, setPreviousState] = useState<T | null>(null);

  const optimisticUpdate = useCallback(async (data: T): Promise<T> => {
    // Store the previous state for potential rollback
    setPreviousState(state.data);

    // Apply optimistic update immediately
    setState({
      data,
      isOptimistic: true,
      error: null
    });

    // Return the data to indicate success
    return data;
  }, [state.data]);

  const rollback = useCallback(() => {
    setState({
      data: previousState,
      isOptimistic: false,
      error: 'Update failed - rolled back to previous state'
    });
  }, [previousState]);

  const clear = useCallback(() => {
    setState({
      data: null,
      isOptimistic: false,
      error: null
    });
    setPreviousState(null);
  }, []);

  return {
    data: state.data,
    isOptimistic: state.isOptimistic,
    error: state.error,
    optimisticUpdate,
    rollback,
    clear
  };
}