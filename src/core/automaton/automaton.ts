

export class StatusDeclaration {
  public readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  static for(id: string): StatusDeclaration {
    return new StatusDeclaration(id);
  }
}

export class Transition {
  public readonly from: StatusDeclaration;
  public readonly to: StatusDeclaration;
  public readonly matcher: (char: string) => boolean;

  private constructor(from: StatusDeclaration, matcher: (char: string) => boolean, to: StatusDeclaration) {
    this.from = from;
    this.matcher = matcher;
    this.to = to;
  }

  static of(from: StatusDeclaration, matcher: (char: string) => boolean, to: StatusDeclaration): Transition {
    return new Transition(from, matcher, to);
  }
}

export class TransitedStatus {
  public readonly status: StatusDeclaration;
  public readonly char: string;

  constructor(status: StatusDeclaration, char: string) {
    this.status = status;
    this.char = char;
  }
}

export type OnTransitionCallback = (t: TransitedStatus, nextStatus: StatusDeclaration) => void;

export class Automaton {
  private transitionsByStatus: Map<string, Transition[]> = new Map();
  private transitionCallbacks: Map<string, OnTransitionCallback[]> = new Map();
  private initialStatus: TransitedStatus;
  private currentStatus: TransitedStatus;

  constructor(startingStatus: StatusDeclaration) {
    this.initialStatus = new TransitedStatus(startingStatus, "");
    this.currentStatus = this.initialStatus;
  }

  run(str: string): void {
    this.currentStatus = this.initialStatus;

    for (let i = 0; i < str.length; i++) {
      const chr = str[i];
      const trns = this.transitionsByStatus.get(this.currentStatus.status.id);

      if (trns === undefined) {
        throw new Error(`No transitions from state: ${this.currentStatus.status.id}`);
      }

      const trn = trns.find(t => t.matcher(chr));

      if (trn === undefined) {
        throw new Error(`No transition from [${this.currentStatus.status.id}] for character '${chr}'`);
      }

      this.currentStatus = new TransitedStatus(trn.to, chr);
      this.callTransitionCallbacks(trn.from.id, this.currentStatus, trn.to);
    }
  }

  private callTransitionCallbacks(fromId: string, t: TransitedStatus, n: StatusDeclaration): void {
    const calls = this.transitionCallbacks.get(fromId);
    if (calls !== undefined) {
      calls.forEach(call => call(t, n));
    }
  }

  public onTransition(from: StatusDeclaration, callback: OnTransitionCallback): void {
    let calls = this.transitionCallbacks.get(from.id);
    if (calls === undefined) {
      this.transitionCallbacks.set(from.id, calls = []);
    }
    calls.push(callback);
  }

  public addTransition(t: Transition): void {
    let trns = this.transitionsByStatus.get(t.from.id);
    if (trns === undefined) {
      this.transitionsByStatus.set(t.from.id, trns = []);
    }
    trns.push(t);
  }

  public clearCallbacks(): void {
    this.transitionCallbacks.clear();
  }
}