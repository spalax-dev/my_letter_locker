import type { TransitionCallback } from "./automaton";
import { Q0, Q1, Q2 } from "./statuses";

let tempName = '';
let tempValue  = '';

const readCommandName: TransitionCallback = (t, n) => {
  if (n.id === Q1.id) {
    tempName += t.newSymbol;
  }
}

const readCommandValue: TransitionCallback = (t, n) => {
  console.log(n.id)
  if (n.id === Q2.id) {
    tempValue += t.newSymbol;
  } else if (n.id === Q0.id) {
    console.log(` => command: ${tempName} ; value: ${tempValue}`)

    tempValue = '';
    tempName = '';
  }
}

export { readCommandName, readCommandValue }