import type { View } from "../views/base.view";

export function checkViewConstructor(view: any): view is new () => View {
  return typeof view === 'function' && view.toString().startsWith('class');
}

export interface Route {
  path: string,
  view: (new () => View) | (() => View),
  data?: Record<string, any>
}