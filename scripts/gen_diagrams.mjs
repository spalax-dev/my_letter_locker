import { render } from 'state-machine-cat';
import fs from 'fs';

const diagrams = {
  'command-automaton': `initial,
q0, q1, q2, q3, final;

initial => q0;
q0 => q1: $;
q1 => q2: $;
q1 => q3: newline;
q2 => q0: $;
q3 => q0: newline;`,

  'email-automaton': `initial,
q0, qlocal, qdominio, qtld, final;

initial => q0;
q0 => qlocal: alnum;
qlocal => qdominio: @;
qlocal => qlocal: alnum;
qdominio => qdominio: .;
qdominio => qtld: .;
qtld => qdominio: alnum;
qtld => final: .;`,

  'url-automaton': `initial,
q0, qdominio, qruta, qerror;

initial => q0;
q0 => qdominio: https;
q0 => qdominio: http;
q0 => qdominio: www;
qdominio => qruta: /;
qdominio => qdominio: x;
qdominio => qruta: /;
qruta => qruta: x;
qruta => qruta: /;
qruta => qruta: .;
qruta => qruta: ?;`
};

for (const [name, smcat] of Object.entries(diagrams)) {
  try {
    const svg = await render(smcat, { outputType: 'svg' });
    fs.writeFileSync(`docs/report/images/${name}.svg`, svg);
    console.log(`✓ ${name}.svg (${svg.length} bytes)`);
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`);
  }
}
