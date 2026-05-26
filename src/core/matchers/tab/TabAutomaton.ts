import { Automaton, StatusDeclaration, Transition } from '../../automaton/automaton';
import { TabAlphabet } from './TabAlphabet';

export class TabAutomaton {
  private automaton: Automaton;

  constructor() {
    const q0 = StatusDeclaration.for('Q0');
    const q1 = StatusDeclaration.for('Q1');

    this.automaton = new Automaton(q0);
    this.automaton.addTransition(
      Transition.of(q0, TabAlphabet.isTab, q1)
    );
    this.automaton.addTransition(
      Transition.of(q1, TabAlphabet.isTab, q0)
    );
  }

  run(input: string): void {
    this.automaton.run(input);
  }

  onTabTransition(callback: () => void): void {
    this.automaton.onTransition(StatusDeclaration.for('Q0'), () => callback());
  }
}