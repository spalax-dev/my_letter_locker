import { LetterLockerPreviewer } from "../automaton/letterLockerAutomaton";
import { HomeView } from "../views/home/home.view";
import { ReadCardView } from "../views/readcart/readcart.view";
import { ReaderView } from "../views/reader/reader.view";
import type { Route } from "./routing";

const routes: Route[] = [
  // ruta de inicio por defecto (escritor)
  { path: "/", view: () => new HomeView(new LetterLockerPreviewer) },
  // ruta de inicio para el lector
  { path: "/read", view: () => new ReaderView(new LetterLockerPreviewer) },
  // ruta para la lectura de una carta
  { path: "/read/card", view: () => new ReadCardView(new LetterLockerPreviewer) },
];

export default routes;