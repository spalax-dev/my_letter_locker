import type { View } from "../views/base.view";

/**
 * funcion complementaria para comprobar si 
 * si un parametro hace referencia a un constructor de View
 * 
 * @param {any} view parametro a verificar
 * @return el parametro corresponde al constructor de una vistas
 */
export function checkViewConstructor(view: any): view is new () => View {
  return typeof view === 'function' && view.toString().startsWith('class');
}

/**
 * expresa los componentes de esperados en una ruta
 */
export type Route = {
  path: string,
  view: (new () => View) | (() => View),
  data?: Record<string, any>
}