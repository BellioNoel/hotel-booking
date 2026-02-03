// src/lib/loaderController.ts
/**
 * Centralized global loader controller.
 * Allows non-React code (Firestore, utils, services)
 * to safely control the LoaderContext.
 *
 * Supports parallel async operations without flicker.
 */

let show: (() => void) | null = null;
let hide: (() => void) | null = null;

/**
 * Internal counter to support multiple simultaneous requests.
 * Loader only hides when all requests finish.
 */
let activeRequests = 0;

/**
 * Register loader handlers from LoaderProvider (React side).
 */
export function registerLoader(
  showFn: () => void,
  hideFn: () => void
) {
  show = showFn;
  hide = hideFn;
}

/**
 * Called when an async operation starts.
 */
export function startGlobalLoading() {
  activeRequests++;

  if (activeRequests === 1) {
    show?.();
  }
}

/**
 * Called when an async operation ends.
 */
export function stopGlobalLoading() {
  if (activeRequests > 0) {
    activeRequests--;
  }

  if (activeRequests === 0) {
    hide?.();
  }
}
