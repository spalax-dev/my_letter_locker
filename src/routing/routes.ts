import { LetterLockerPreviewer } from "../automaton/letterLockerAutomaton";
import { HomeView } from "../views/home/home.view";
import type { Route } from "./routing";

const routes: Route[] = [
  { path: "/", view: () => new HomeView(new LetterLockerPreviewer) },
  // { path: "/contact", template: "c" }
];

export default routes;