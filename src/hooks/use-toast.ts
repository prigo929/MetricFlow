"use client";

import * as React from "react";

// WHAT IS A TOAST?
// A toast is a temporary notification card that slides into view (usually in a corner) 
// to inform the user about the result of an action (e.g., "Company saved successfully!").

const TOAST_LIMIT = 5; // Maximum number of toasts displayed on screen simultaneously
const TOAST_REMOVE_DELAY = 6000; // How long (in milliseconds) a toast stays visible before disappearing

type ToastVariant = "default" | "success" | "destructive" | "info";

// Interface defining the properties a single Toast notification can have
export interface Toasting {
  id: string; // Unique identifier for tracking and targeting specific toasts
  title?: React.ReactNode; // Header text of the notification
  description?: React.ReactNode; // Descriptive body text
  variant?: ToastVariant; // Visual style variant (affects border/background color)
  open?: boolean; // Controls whether the toast is visible in the UI
  onOpenChange?: (open: boolean) => void; // Callback function called when toast open state transitions
}

let count = 0;
// Generates a simple incrementing unique ID string
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// Action Types that specify what modification we want to apply to our state
type Action =
  | { type: "ADD_TOAST"; toast: Toasting }
  | { type: "UPDATE_TOAST"; toast: Partial<Toasting> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: Toasting[];
}

// Keeps track of active timeouts so we can clear them when toasts are dismissed
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// Adds a toast to a deletion queue to remove it from the DOM after `TOAST_REMOVE_DELAY` seconds
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * REDUCER PATTERN:
 * A reducer is a function that takes the current `state` and an `action` describing what happened,
 * and returns the brand new `state` without modifying the original inputs (immutability).
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        // Insert new toast at the front, and cap the list length using slice()
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        // Map over current toasts and merge updates into the matching one
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Start fade-out / slide-out timing
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        // Set open to false to trigger exit animation on matching toast(s)
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      // Keep only toasts whose ID does not match the one being removed
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// GLOBAL OBSERVER (SUBSCRIBER) SYSTEM:
// We want to be able to trigger a toast from anywhere in the codebase (even inside normal functions
// like server actions or fetch handlers), but React state normally lives only inside components.
// We solve this by keeping a global array of React `setState` functions (`listeners`).
// When `dispatch` is called, we update the master `memoryState` and notify all listeners so they update.
const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
}

// Function to trigger a toast notification imperatively from anywhere
function toast({ ...props }: ToastOptions) {
  const id = genId();

  const update = (props: Partial<Toasting>) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

/**
 * React Hook: useToast
 * Consumed by components (like `src/components/ui/Toaster.tsx`) to listen to
 * active toasts and sync them to the UI state.
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    // When the component mounts, add its state-setter to our listeners list
    listeners.push(setState);

    // CLEANUP FUNCTION:
    // React runs this function when the component unmounts.
    // We remove the listener here to avoid memory leaks (trying to update state on an unmounted component).
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };

