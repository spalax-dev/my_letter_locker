import { render } from 'state-machine-cat';
import fs from 'fs';

const diagrams = [
  {
    name: 'command-automaton',
    smcat: 'initial, inicio, leer, inline, linea, final; inicio => leer: "$"; leer => inline: "$"; leer => linea: "newline"; inline => inicio: "$"; linea => inicio: "newline";'
  },
  {
    name: 'email-automaton', 
    smcat: 'initial, inicio, local, dominio, tld, final; inicio => local: "[a-zA-Z0-9]"; local => dominio: "@"; dominio => tld: "."; dominio => dominio: "[a-zA-Z0-9.-]"; tld => dominio: "[a-zA-Z0-9]"; local => inicio: "[invalid]"; dominio => inicio: "[invalid]"; tld => inicio: "[invalid]";'
  },
  {
    name: 'url-automaton',
    smcat: 'initial, inicio, esquema, dominio, ruta, final; inicio => esquema: "https://"; esquema => dominio: "[a-zA-Z0-9.-]"; dominio => ruta: "/"; ruta => ruta: "[chars]"; dominio => inicio: "[no-url]"; ruta => inicio: "[fin]";'
  },
  {
    name: 'newline-automaton',
    smcat: 'initial, inicio, linea, final; inicio => linea: "newline"; linea => inicio: "newline"; inicio => inicio: "[otro]"; linea => linea: "[otro]";'
  },
  {
    name: 'tab-automaton',
    smcat: 'initial, inicio, columna, final; inicio => columna: "tab"; columna => inicio: "tab"; inicio => inicio: "[otro]"; columna => columna: "[otro]";'
  }
];

for (const { name, smcat } of diagrams) {
  try {
    const svg = await render(smcat, { 
      outputType: 'svg', 
      direction: 'left-right'
    });
    fs.writeFileSync(`docs/report/images/${name}.svg`, svg);
    console.log(`✓ ${name}.svg`);
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  }
}