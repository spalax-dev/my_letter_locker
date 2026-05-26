import { WriterView } from "../views/writer/writer.view";
import { ReaderView } from "../views/reader/reader.view";
import type { Route } from "./routing";

const routes: Route[] = [
  { path: "/", view: () => new WriterView() },
  { path: "/read", view: () => new ReaderView() },
  { path: "/read/card", view: () => new ReaderView() },
];

export default routes;
