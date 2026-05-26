import type { View } from "../views/base.view";

/**
 * Helper function to check if a parameter references a View constructor
 */
export function checkViewConstructor(view: any): view is new () => View {
  return typeof view === 'function' && view.toString().startsWith('class');
}

/**
 * Describes the expected components of a route
 */
export type Route = {
  path: string,
  view: (new () => View) | (() => View),
  data?: Record<string, any>
}
