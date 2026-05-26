import './style.css'
import Navigo from 'navigo';
import routes from './routing/routes';
import { checkViewConstructor } from './routing/routing';

const router = new Navigo('/', { hash: false });
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

router.resolve();
