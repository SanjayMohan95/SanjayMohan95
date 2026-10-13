import { create } from 'zustand';

/**
 * In-memory router for the single-file artifact build. The hosted page runs in a
 * sandboxed frame without server routing, so navigation is kept in state.
 */
interface RouterState {
  path: string;
  search: string;
  navigate: (href: string, replace?: boolean) => void;
}

function split(href: string): { path: string; search: string; fragment: string } {
  const [beforeHash, fragment = ''] = href.split('#');
  const [path, search = ''] = beforeHash.split('?');
  return { path: path || '/', search, fragment };
}

export const useRouterStore = create<RouterState>((set, get) => ({
  path: '/',
  search: '',
  navigate: (href, replace) => {
    const { path, search, fragment } = split(href);
    const changedPage = path !== get().path;
    set({ path, search });
    try {
      history.replaceState(null, '', fragment ? `#${fragment}` : location.pathname + location.search);
    } catch {
      /* sandboxed history — ignore */
    }
    if (changedPage && !replace) window.scrollTo({ top: 0 });
  },
}));
