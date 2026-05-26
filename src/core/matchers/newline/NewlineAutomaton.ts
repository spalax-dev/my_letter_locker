import { Automaton, StatusDeclaration, Transition } from '../../automaton/automaton';

export class NewlineAutomaton {
  private automaton: Automaton;
  private replacements: Array<{ start: number; end: number }> = [];

  constructor() {
    const q0 = StatusDeclaration.for('Q0');
    const q1 = StatusDeclaration.for('Q1');

    this.automaton = new Automaton(q0);
    this.automaton.addTransition(
      Transition.of(q0, NewlineAutomaton.newlineMatcher(), q1)
    );
    this.automaton.addTransition(
      Transition.of(q1, NewlineAutomaton.newlineMatcher(), q0)
    );

    this.automaton.onTransition(StatusDeclaration.for('Q0'), (t) => {
      this.replacements.push({ start: t.char.length > 0 ? 0 : 0, end: 1 });
    });
  }

  private static newlineMatcher(): (char: string) => boolean {
    return (char: string) => char === '\n';
  }

  parse(input: string): Array<{ start: number; end: number }> {
    this.replacements = [];
    this.automaton.run(input);
    return this.replacements;
  }
}
