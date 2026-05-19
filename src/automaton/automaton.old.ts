/**
 * Representens the generic status of error for a automaton
 */
export interface ErrorStatus extends Status {
}

/**
 * Represents a status of the automaton
 */
export interface Status {
  accumulateString: string,
  symbolToInsert: string,

  next(symbol: string): Status;
}

export interface Transition {
  nextFor(symbol: string): Status|undefined
}

export class SimpleTransition implements Transition {
  readonly prevStatus: Status;
  /**
   * @var Function(string, string): SimpleStatus
   */
  readonly validation: Function

  /**
   *
   */
  constructor(status: Status) {
    this.prevStatus = status;
  }

  nextFor(symbol: string): Status | undefined {
    
  }
}

export abstract class SimpleStatus implements Status {
  accumulateString: string;
  symbolToInsert: string;
  fullString: string;
  transitions: Transition[] = [];
  // transitions: Record<string, Status>  = {};

  /**
   *
   */
  constructor(
    lastValue: string,
    accumlateValue: string,
  ) {
    this.accumulateString = accumlateValue;
    this.symbolToInsert = lastValue;
    this.fullString = accumlateValue + lastValue;
  }

  next(symbol: string): Status {
    for (const item of this.transitions) {
      const resultStatus = item.nextFor(symbol);

      if (resultStatus !== undefined) {
        return resultStatus;
      }
    }

    return ErrorStatusCreation(this, symbol);
  }

  static of(accumlateString: string, symbolToInsert: string, transitions: Transition[]): SimpleStatus {
    return new (class extends SimpleStatus {
      constructor() {
        super(symbolToInsert, accumlateString),
        transitions.forEach((t) => this.transitions.push(t));
      }
    });
  }

  // abstract addTransition(symbol: string, status: Status): SimpleStatus;
}

export const ErrorStatusCreation = function (status: Status, lastSymbol: string): ErrorStatus {
  return { 
    accumulateString: status.accumulateString += status.symbolToInsert,
    symbolToInsert: lastSymbol,

    next: function (symbol: string): ErrorStatus {
      return ErrorStatusCreation(this, symbol);
    }
  };
}

export class Automaton {
  /**
   * list of status passed for the automaton
   */
  private statuses: Status[] = [];
  
  /**
   * @param transitions define the transitions from start point
   */
  constructor(transitions: Transition[]) {
    this.statuses.push(SimpleStatus.of("", "", transitions));
  }
}