export class StatusDeclaration {
  // 1. Declaramos la propiedad explícitamente afuera
  public readonly id: string;

  /**
   * @param id unique indentificator for status
   */
  constructor(id: string) {
    // 2. La asignamos manualmente
    this.id = id;
  }

  static for(id: string) {
    return new StatusDeclaration(id);
  }
}

export class TransitionDeclaration {
  public readonly from: StatusDeclaration;
  public readonly to: StatusDeclaration;
  public readonly symbol: string | RegExp;

  private constructor(from: StatusDeclaration, symbol: string | RegExp, to: StatusDeclaration) {
    this.from = from;
    this.to = to;
    this.symbol = symbol;
  }

  static of(from: StatusDeclaration, symbol: string | RegExp, to: StatusDeclaration): TransitionDeclaration {
    return new TransitionDeclaration(from, symbol, to);
  }
}

export class TransitedStatus {
  public readonly status: StatusDeclaration;
  public readonly newSymbol: string;

  constructor(status: StatusDeclaration, newSymbol: string) {
    this.status = status;
    this.newSymbol = newSymbol;
  }
}

export type TransitionCallback = (t: TransitedStatus, n: StatusDeclaration) => void;

export class Automaton {
  private transitionsByStatus: Map<string, TransitionDeclaration[]> = new Map();
  private transitionCallbacks: Map<string, TransitionCallback[]> = new Map();
  private currentStatus: TransitedStatus;

  constructor(startingStatus: StatusDeclaration) {
    this.currentStatus = new TransitedStatus(startingStatus, "");
  }

  run(str: string) {
    for (const chr of str) {
      const trns = this.transitionsByStatus.get(this.currentStatus.status.id);

      if (trns === undefined) {
        throw new Error(`Estado sin salidas: ${this.currentStatus.status.id}`);
      }

      const trn = trns.find((t) => {
        // Validación estricta para evitar el bug del "$"
        return typeof t.symbol === 'string' 
          ? chr === t.symbol 
          : t.symbol.test(chr);
      });

      if (trn === undefined) {
        throw new Error(`Error Sintáctico: No hay transición desde [${this.currentStatus.status.id}] para el carácter '${chr}'`);
      }

      this.currentStatus = new TransitedStatus(trn.to, chr);
      this.callTransitionCallbacks(trn.from.id, this.currentStatus, trn.to);
    }
  }

  private callTransitionCallbacks(fromId: string, t: TransitedStatus, n: StatusDeclaration) {
    const calls = this.transitionCallbacks.get(fromId);
    if (calls !== undefined) {
      calls.forEach((call) => call(t, n));
    }
  }

  public onTransition(from: StatusDeclaration, call: TransitionCallback) {
    let calls = this.transitionCallbacks.get(from.id);
    if (calls === undefined) this.transitionCallbacks.set(from.id, calls = []);
    calls.push(call);
  }

  addTransition(t: TransitionDeclaration) {
    let trns = this.transitionsByStatus.get(t.from.id);
    if (trns === undefined) {
      this.transitionsByStatus.set(t.from.id, trns = []);
    }
    trns.push(t);
  }
}