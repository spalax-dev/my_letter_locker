import './style.css'
import Navigo from 'navigo';
import routes from './routing/routes';
import { checkViewConstructor } from './routing/routing';

// router instantiation
const router = new Navigo('/', { hash: false });
// space where to render content
const renderSpace = document.getElementById('app');

for (const route of routes) {
  router.on(route.path, async () => {
    /*
    // importing template
    const module = await import(`./templates/${route.template}.html?raw`);
    const content = module.default;
    // compiling template
    const compileTemplate = Handlebars.compile(content);
    const compiledTemplate = compileTemplate(route.data);

    // replace content of the render space
    renderSpace!.innerHTML = compiledTemplate;
    */

    const view = checkViewConstructor(route.view)
     ? new route.view()
     : route.view();

    renderSpace!.innerHTML = view.render({});
    view.afterRender();
  });
}

// run the router
router.resolve();
