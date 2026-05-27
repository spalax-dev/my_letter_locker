import { render } from 'state-machine-cat';
import fs from 'fs';

const diagrams = [
  { name: 'command-automaton', smcat: 'initial, inicio, leer, inline, linea, final; inicio => leer: "$"; leer => inline: "$"; leer => linea: "newline"; inline => inicio: "$"; linea => inicio: "newline";' },
  { name: 'email-automaton', smcat: 'initial, inicio, local, dominio, tld, final; inicio => local: "char"; local => dominio: "@"; dominio => tld: "."; dominio => dominio: "char"; tld => dominio: "char"; local => inicio: "err"; dominio => inicio: "err"; tld => inicio: "err";' },
  { name: 'url-automaton', smcat: 'initial, inicio, esquema, dominio, ruta, final; inicio => esquema: "http"; esquema => dominio: "host"; dominio => ruta: "/"; ruta => ruta: "char"; ruta => final: "fin"; dominio => inicio: "err";' },
  { name: 'newline-automaton', smcat: 'initial, inicio, linea, final; inicio => linea: "nl"; linea => inicio: "nl"; inicio => inicio: "x"; linea => linea: "x";' },
  { name: 'tab-automaton', smcat: 'initial, inicio, columna, final; inicio => columna: "tab"; columna => inicio: "tab"; inicio => inicio: "x"; columna => columna: "x";' }
];

for (const { name, smcat } of diagrams) {
  try {
    // Generar PNG directamente
    const png = await render(smcat, { outputType: 'png' });
    fs.writeFileSync(`docs/report/images/${name}.png`, Buffer.isBuffer(png) ? png : png.data || png);
    console.log(`✓ ${name}.png`);
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  }
}
