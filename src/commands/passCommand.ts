/**
 * comando para declarar la clave de cifrado de la carta.
 * No produce HTML — retorna undefined para que el previewer lo omita.
 */
export class PassCommand {
  // nombre recomendado para el comando
  static readonly name: string = 'pass';

  static render(_value: string, _mods: string[]): string | undefined {
    return '';
  }
}
