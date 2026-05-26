import { HomeView } from "../views/home/home.view";
import { ReadCardView } from "../views/readcart/readcart.view";
import { ReaderView } from "../views/reader/reader.view";
import type { Route } from "./routing";

const routes: Route[] = [
  { path: "/", view: () => new HomeView() },
  { path: "/read", view: () => new ReaderView() },
  { path: "/read/card", view: () => new ReadCardView() },
];

export default routes;
