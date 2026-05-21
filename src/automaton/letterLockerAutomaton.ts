import { BoldLetterCommand, CommandManager, CommandNotFoundError, ItalicCommand, TitleCommand, type LetterLockerCommand } from "../commands/commands";
import { Automaton, TransitionDeclaration, StatusDeclaration } from "./automaton";

// estado inicial leyendo texto plano
const Q0: StatusDeclaration = StatusDeclaration.for("Q0");
// estado que identifica el inicio del nombre de un comando
const Q1: StatusDeclaration = StatusDeclaration.for("Q1");
// estado que representa el inicio del valor de un comando
const Q2: StatusDeclaration = StatusDeclaration.for("Q2");

export { Q0, Q1, Q2 };

export class UnrecognizedCommand extends Error {
  readonly name: string;

  constructor(name: string) {
    super("Unrecognized command with name " + name);
    this.name = name;
  }
}

export class LetterLockerAutomaton extends Automaton {
  /**
   *
   */
  constructor() {
    super(Q0);

    this.configureTransitions();
    this.configureTransitionListeners();
  }

  private configureTransitions(): void {
    // con '$' pasa de leer texto plano a leer un comando
    this.addTransition(TransitionDeclaration.of(Q0, '$', Q1));
    // con cualquier caracter que no sea '$' se queda leyendo texto plano
    this.addTransition(TransitionDeclaration.of(Q0, /[^$]/, Q0));
    // con '$' pasa de leer el nombre del comando a leer su valor
    this.addTransition(TransitionDeclaration.of(Q1, '$', Q2));
    // con cualquier caracter que no sea '$' se queda leyendo el nombre
    this.addTransition(TransitionDeclaration.of(Q1, /[^$]/, Q1));
    // con '$' pasa de leer el valor del comando a leer texto
    this.addTransition(TransitionDeclaration.of(Q2, '$', Q0));
    // con cualquier caracter que no sea '$' se queda leyendo el valor
    this.addTransition(TransitionDeclaration.of(Q2, /[^$]/, Q2));
  }

  private configureTransitionListeners() {
  }
}

export class LetterLockerPreviewer {
  readonly automaton: Automaton;
  // private commands: Map<string, LetterLockerCommand>;
  private commands: CommandManager;


  // variables temporales utilizadas en el renderizado
  private commandName: string = '';
  private commandValue: string = '';
  private htmlPreview: string = '';

  /**
   *
   */
  constructor() {
    // this.commands = new Map();
    this.commands = new CommandManager();
    this.automaton = new LetterLockerAutomaton();

    this.configureCommands();
    this.configureTransitionListeners();
  }

  private configureCommands(): void {
    this.commands.registerCommand(BoldLetterCommand.name, BoldLetterCommand.render);
    this.commands.registerCommand(ItalicCommand.name, ItalicCommand.render);
    this.commands.registerCommand(TitleCommand.name, TitleCommand.render);
  }

  /**
   * @throws {CommandNotFoundError} if a tiped command is not registered
   */
  private configureTransitionListeners() {
    // agregar texto plano directamente
    this.automaton.onTransition(Q0, (t, n) => n.id === Q0.id ? this.htmlPreview += t.newSymbol : null);
    // almacenar el nombre del comando temporalmente
    this.automaton.onTransition(Q1, (t, n) => {
      if (n.id === Q1.id) { this.commandName += t.newSymbol; }
    })
    // capturar valor del comando y renderizarlo
    this.automaton.onTransition(Q2, (t, n) => {
      // si es parte del valor seguir capturando
      if (n.id === Q2.id) {
        this.commandValue += t.newSymbol;
      } else if (n.id === Q0.id) { // fin del commando
        try {
          this.htmlPreview += this.commands.callComand(this.commandName, this.commandValue);
        } finally {
          this.commandName = '';
          this.commandValue = '';
        }
      }
    })
  }

  /**
   * @throws {UnrecognizedCommand} if a tiped command is not registered
   */
  public preview(content: string): string {
    this.htmlPreview = '';
    this.commandValue = '';
    this.commandName = '';

    this.automaton.run(content);

    return this.htmlPreview;
  }
}