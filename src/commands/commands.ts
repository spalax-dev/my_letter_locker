/**
 * tipo que define la estructura de un comando de LetterLocker
 */
export type LetterLockerCommand = (value: string, mods: string[]) => string | undefined;

/**
 * expresa que no se ha podido encontrar un comando
 */
export class CommandNotFoundError extends Error {
  constructor(name: string) {
    super(`no ha encontrado el comando <${name}>`);
  }
}

/**
 * expresa el mal formato o la falta a un aspecto para el modificador de un comando
 */
export class BadCommandModifierError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/**
 * clase que facilita y encapsula el manejo de comandos
 */
export class CommandManager {
  // comandos dentro del manejador
  private commands: Map<string, LetterLockerCommand>;

  constructor() {
    this.commands = new Map();
  }

  /**
   * obtiene un comando dado su llamado
   * 
   * @param calledName 
   */
  public getCommand(calledName: string): LetterLockerCommand | undefined {
    const [name, _] = calledName.split(':', 2);

    return this.commands.get(name);
  }

  /**
   * registra un comando en el manejador
   * 
   * @param call la llamada del comando (nombre y modificadores)
   */
  public registerCommand(name: string, command: LetterLockerCommand): void {
    this.commands.set(name, command);
  }

  /**
   * ejecuta un comando dada su llamada
   * 
   * @param call la llamada al comando (nombre y valores para los modificadores)
   * @param value valor para el comando
   * 
   * @throws {CommandNotFoundError} si el comando no esta registrado
   */
  public callComand(call: string, value: string): string | undefined {
    const [name, modsString] = call.split(':', 2);
    const mods = modsString ? modsString.split(':') : [];

    const command = this.commands.get(name);

    if (command === undefined) {
      throw new CommandNotFoundError(name);
    }

    return command(value, mods);
  }
}

/*
 |----------------------------------------------------------------------------
 | COMANDOS GENERICOS
 |----------------------------------------------------------------------------
 | a partir de este punto se encuentran los comandos de uso generico,
 | es decir, que responden a necesidades basicas (normalmente de renderizado)
 |/

/**
 * comando generico para negrita
 */
export class BoldLetterCommand {
  // nombre recomendado para el comando
  static name: string = 'bold';

  static render(value: string): string | undefined {
    return `<b>${value}</b>`;
  }
}

/**
 * comando generico para italica
 */
export class ItalicCommand {
  // nombre recomendado para el comando
  static name: string = 'italic';

  static render(value: string): string | undefined {
    return `<i>${value}</i>`;
  }
}

/**
 * comando generico para titulos
 */
export class TitleCommand {
  // nombre recomendado para el comando
  static name: string = 'title'

  static render(value: string, params: string[]): string | undefined {
    TitleCommand.validateLevel(params[0]);

    return `<h${params[0]}>${value}</h${params[0]}>`;
  }

  /**
   * @throws {BadCommandParameter} si el modificador no es valido
   */
  private static validateLevel(level: string) {
    if (level == undefined || !level.match(/[1-6]/)) {
      throw new BadCommandModifierError("el parametro [level] del comando title espera un numero entre 1-6");
    }
  }
}