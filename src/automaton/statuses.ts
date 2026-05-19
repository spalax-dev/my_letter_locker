import { StatusDeclaration } from "./automaton";

// estado inicial leyendo texto plano
const Q0: StatusDeclaration = StatusDeclaration.for("Q0");
// estado que identifica el inicio del nombre de un comando
const Q1: StatusDeclaration = StatusDeclaration.for("Q1");
// estado que representa el inicio del valor de un comando
const Q2: StatusDeclaration = StatusDeclaration.for("Q2");

export { Q0, Q1, Q2 }