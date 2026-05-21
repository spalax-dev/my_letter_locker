import { LetterLockerPreviewer } from "../automaton/letterLockerAutomaton";
import { HomeView } from "../views/home/home.view";
import type { Route } from "./routing";

const routes: Route[] = [
  // ruta de inicio por defecto (escritor)
  { path: "/", view: () => new HomeView(new LetterLockerPreviewer) },
];

export default routes;