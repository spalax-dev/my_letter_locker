import './style.css'
import Navigo from 'navigo';
import routes from './routing/routes';
import { checkViewConstructor } from './routing/routing';

// instanciacion del router
const router = new Navigo('/', { hash: false });
// espacio donde se renderizara el contenido
const renderSpace = document.getElementById('app');

for (const route of routes) {
  router.on(route.path, async () => {
    const view = checkViewConstructor(route.view)
     ? new route.view()
     : route.view();

    renderSpace!.innerHTML = view.render({});
    view.afterRender();
  });
}

// run the router
router.resolve();
