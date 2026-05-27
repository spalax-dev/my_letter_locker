import { DateAlphabet } from './DateAlphabet';

type DateMode = 'slash' | 'dash';
type DatePhase = 'collecting_first' | 'after_first_sep' | 'collecting_second' | 'after_second_sep' | 'collecting_third';

interface ParsedDate {
  start: number;
  end: number;
  year: number;
  month: number;
  day: number;
}

export class DateAutomaton {
  private content: string = '';
  private dates: ParsedDate[] = [];
  private startPos: number = -1;
  private mode: DateMode | null = null;
  private phase: DatePhase = 'collecting_first';
  private first: string = '';
  private second: string = '';
  private third: string = '';

  reset(): void {
    this.content = '';
    this.dates = [];
    this.startPos = -1;
    this.mode = null;
    this.phase = 'collecting_first';
    this.first = '';
    this.second = '';
    this.third = '';
  }

  resetState(): void {
    this.startPos = -1;
    this.mode = null;
    this.phase = 'collecting_first';
    this.first = '';
    this.second = '';
    this.third = '';
  }

  setContent(content: string): void {
    this.content = content;
  }

  process(pos: number): void {
    const char = this.content[pos];

    if (DateAlphabet.isDigit(char)) {
      if (this.mode === null && this.phase === 'collecting_first') {
        if (this.startPos === -1) {
          this.startPos = pos;
        }
        this.first += char;
      } else if (this.mode === 'slash') {
        if (this.phase === 'collecting_first' && this.first.length < 2) {
          this.first += char;
        } else if (this.phase === 'after_first_sep' && this.second.length < 2) {
          this.second += char;
        } else if (this.phase === 'after_second_sep' && this.third.length < 4) {
          this.third += char;
          if (this.third.length === 4) {
            this.pushDate();
            this.resetState();
          }
        }
      } else if (this.mode === 'dash') {
        if (this.phase === 'collecting_first' && this.first.length < 4) {
          this.first += char;
        } else if (this.phase === 'after_first_sep' && this.second.length < 2) {
          this.second += char;
        } else if (this.phase === 'after_second_sep' && this.third.length < 2) {
          this.third += char;
          if (this.third.length === 2) {
            this.pushDate();
            this.resetState();
          }
        }
      }
    } else if (DateAlphabet.isSlash(char)) {
      if (this.mode === null && this.first.length >= 2) {
        this.mode = 'slash';
        if (this.first.length === 4) {
          this.phase = 'after_first_sep';
        } else {
          this.phase = 'after_first_sep';
        }
      } else if (this.mode === 'slash' && this.phase === 'after_first_sep') {
        this.phase = 'after_second_sep';
      }
    } else if (DateAlphabet.isDash(char)) {
      if (this.mode === null && this.first.length >= 2) {
        this.mode = 'dash';
        this.phase = 'after_first_sep';
      } else if (this.mode === 'dash' && this.phase === 'after_first_sep') {
        this.phase = 'after_second_sep';
      }
    } else {
      if (this.startPos !== -1 && (this.first.length > 0 || this.second.length > 0 || this.third.length > 0)) {
        console.info(`Date pattern at position ${this.startPos} is invalid for parsing (incomplete: ${this.first}/${this.second}/${this.third})`);
      }
      if (this.first.length > 0 || this.second.length > 0 || this.third.length > 0) {
        this.reset();
      }
    }
  }

  pushDate(): void {
    if (this.mode === 'slash' && this.first.length === 2 && this.second.length === 2 && this.third.length === 4) {
      const month = parseInt(this.second);
      const day = parseInt(this.first);
      const year = parseInt(this.third);

      if (month < 1 || month > 12) {
        console.info(`Date pattern at position ${this.startPos} is invalid for parsing (month ${month} out of range, must be 1-12)`);
        return;
      }

      if (day < 1 || day > 31) {
        console.info(`Date pattern at position ${this.startPos} is invalid for parsing (day ${day} out of range, must be 1-31)`);
        return;
      }

      this.dates.push({
        start: this.startPos,
        end: this.startPos + 10,
        year: year,
        month: month,
        day: day
      });
      console.log(`Date pattern detected and parsed: ${this.first}/${this.second}/${this.third} (position ${this.startPos})`);
    } else if (this.mode === 'slash' && this.first.length === 4 && this.second.length === 2 && this.third.length === 2) {
      const year = parseInt(this.first);
      const month = parseInt(this.second);
      const day = parseInt(this.third);

      if (month < 1 || month > 12) {
        console.info(`Date pattern at position ${this.startPos} is invalid for parsing (month ${month} out of range, must be 1-12)`);
        return;
      }

      if (day < 1 || day > 31) {
        console.info(`Date pattern at position ${this.startPos} is invalid for parsing (day ${day} out of range, must be 1-31)`);
        return;
      }

      this.dates.push({
        start: this.startPos,
        end: this.startPos + 10,
        year: year,
        month: month,
        day: day
      });
      console.log(`Date pattern detected and parsed: ${this.first}/${this.second}/${this.third} (position ${this.startPos})`);
    } else if (this.mode === 'dash' && this.first.length === 4 && this.second.length === 2 && this.third.length === 2) {
      const year = parseInt(this.first);
      const month = parseInt(this.second);
      const day = parseInt(this.third);

      if (month < 1 || month > 12) {
        console.info(`Date pattern at position ${this.startPos} is invalid for parsing (month ${month} out of range, must be 1-12)`);
        return;
      }

      if (day < 1 || day > 31) {
        console.info(`Date pattern at position ${this.startPos} is invalid for parsing (day ${day} out of range, must be 1-31)`);
        return;
      }

      this.dates.push({
        start: this.startPos,
        end: this.startPos + 10,
        year: year,
        month: month,
        day: day
      });
      console.log(`Date pattern detected and parsed: ${this.first}/${this.second}/${this.third} (position ${this.startPos})`);
    }
  }

  finalize(_pos: number): void {
    if (this.startPos === -1) {
      return;
    }
    this.pushDate();
  }

  getDates(): ParsedDate[] {
    return this.dates;
  }
}