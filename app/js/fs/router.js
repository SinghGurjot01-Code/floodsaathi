/* FloodSaathi Hash Router with Lifecycle & Clean Teardown */
window.FS = window.FS || {};

(function() {
  let currentScreen = null;
  let currentRoute = '';
  let currentParams = {};

  const routes = {};

  function register(pattern, screenObj) {
    routes[pattern] = screenObj;
  }

  function parseHash() {
    let hash = window.location.hash.slice(1);
    if (!hash || hash === '/') {
      const onboarded = window.FS.store.get('onboarded');
      hash = onboarded ? '/home' : '/welcome';
    }
    return hash;
  }

  function matchRoute(path) {
    // Exact match
    if (routes[path]) {
      return { screen: routes[path], params: {} };
    }

    // Pattern match (e.g. /alert/:id)
    for (const pattern in routes) {
      if (pattern.includes(':')) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');
        if (patternParts.length === pathParts.length) {
          const params = {};
          let match = true;
          for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
              params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
            } else if (patternParts[i] !== pathParts[i]) {
              match = false;
              break;
            }
          }
          if (match) {
            return { screen: routes[pattern], params: params };
          }
        }
      }
    }

    return null;
  }

  function handleRoute() {
    const rawPath = parseHash();
    let matched = matchRoute(rawPath);

    if (!matched) {
      // Unknown route -> fallback to home
      window.location.hash = '#/home';
      return;
    }

    const { screen, params } = matched;

    // Teardown previous screen to avoid memory leaks and duplicate timers/listeners
    if (currentScreen && typeof currentScreen.teardown === 'function') {
      try {
        currentScreen.teardown();
      } catch (err) {
        console.error('Screen teardown error:', err);
      }
    }

    currentScreen = screen;
    currentRoute = rawPath;
    currentParams = params;

    // Update Shell Controls (Bottom Nav & SOS Button)
    updateShellControls(rawPath);

    // Render new screen in #view
    const view = document.getElementById('view');
    if (!view) return;

    view.replaceChildren(); // Safe clear
    view.scrollTop = 0;

    try {
      if (screen && typeof screen.render === 'function') {
        const screenEl = screen.render(params);
        if ((typeof Node !== 'undefined' && screenEl instanceof Node) || (screenEl && typeof screenEl.nodeType === 'number')) {
          view.appendChild(screenEl);
        }
      }
    } catch (err) {
      console.error(`Error rendering route ${rawPath}:`, err);
      renderErrorFallback(view, rawPath);
    }
  }

  function updateShellControls(path) {
    const nav = document.getElementById('bottom-nav');
    const fab = document.getElementById('sos-fab');

    // 1. Bottom Nav visibility and active tab state
    if (nav) {
      if (path === '/welcome') {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');

        // Determine which tab is active
        let activeTab = 'home';
        if (path.startsWith('/home')) activeTab = 'home';
        else if (path.startsWith('/map')) activeTab = 'map';
        else if (path.startsWith('/saathi')) activeTab = 'saathi';
        else if (path.startsWith('/alert')) activeTab = 'alerts';
        else if (path === '/more' || path === '/afterflood' || path === '/prefs' || path === '/emergency') {
          activeTab = 'more';
        }

        nav.querySelectorAll('.nav-tab').forEach((tab) => {
          const tabName = tab.getAttribute('data-tab');
          if (tabName === activeTab) {
            tab.setAttribute('aria-current', 'page');
          } else {
            tab.removeAttribute('aria-current');
          }
        });
      }
    }

    // 2. Floating SOS Button visibility
    // Visible on Home, Map, Alerts, Shelter; Hidden on Welcome, Emergency, Saathi, More, Prefs, Afterflood
    if (fab) {
      const sosRoutes = ['/home', '/map', '/alerts', '/shelter'];
      const shouldShow = sosRoutes.some(r => path.startsWith(r));
      if (shouldShow) {
        fab.classList.remove('hidden');
      } else {
        fab.classList.add('hidden');
      }
    }
  }

  function renderErrorFallback(view, path) {
    const fallback = window.FS.ui.el('div', {
      style: {
        padding: '40px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }
    }, [
      window.FS.ui.el('h2', { textContent: 'Something went wrong' }),
      window.FS.ui.el('p', {
        style: { color: 'var(--muted)', fontSize: '14px' },
        textContent: `Failed to load screen for ${path}`
      }),
      window.FS.ui.el('button', {
        className: 'quick-action-btn',
        style: { padding: '10px 24px', height: 'auto', background: 'var(--navy)', color: '#fff' },
        textContent: 'Go Home',
        onClick: () => navigate('/home')
      })
    ]);
    view.appendChild(fallback);
  }

  function navigate(path) {
    if (!path.startsWith('#')) path = '#' + path;
    window.location.hash = path;
  }

  function renderCurrent() {
    handleRoute();
  }

  window.addEventListener('hashchange', handleRoute);

  window.FS.router = {
    register: register,
    navigate: navigate,
    renderCurrent: renderCurrent,
    getCurrentRoute: () => currentRoute,
    init: handleRoute
  };
})();
