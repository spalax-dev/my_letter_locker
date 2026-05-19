import './style.css'
import Navigo from 'navigo';
import routes from './routing/routes';
import Handlebars from 'handlebars';
import { Automaton, TransitionDeclaration } from './automaton/automaton';
import { Q0, Q1, Q2 } from './automaton/statuses';
import { readCommandName, readCommandValue } from './automaton/listeners';

// router instantiation
const router = new Navigo('/', { hash: false });
// space where to render content
const renderSpace = document.getElementById('app');

for (const route of routes) {
  router.on(route.path, async () => {
    // importing template
    const module = await import(`./templates/${route.template}.html?raw`);
    const content = module.default;
    // compiling template
    const compileTemplate = Handlebars.compile(content);
    const compiledTemplate = compileTemplate(route.data);

    // replace content of the render space
    renderSpace!.innerHTML = compiledTemplate;
  });
}

// run the router
router.resolve();

const aut = new Automaton(Q0);

// con '$' pasa de leer texto plano a leer un comando
aut.addTransition(TransitionDeclaration.of(Q0, '$', Q1));
// con cualquier caracter que no sea '$' se queda leyendo texto plano
aut.addTransition(TransitionDeclaration.of(Q0, /[^$]/, Q0));
// con '$' pasa de leer el nombre del comando a leer su valor
aut.addTransition(TransitionDeclaration.of(Q1, '$', Q2));
// con cualquier caracter que no sea '$' se queda leyendo el nombre
aut.addTransition(TransitionDeclaration.of(Q1, /[a-zA-Z_]/, Q1));
// con '$' pasa de leer el valor del comando a leer texto
aut.addTransition(TransitionDeclaration.of(Q2, '$', Q0));
// con cualquier caracter que no sea '$' se queda leyendo el valor
aut.addTransition(TransitionDeclaration.of(Q2, /[^$]/, Q2));


aut.onTransition(Q1, readCommandName)
aut.onTransition(Q2, readCommandValue)

aut.run("hola $bold$juan$ ¿como estas?");