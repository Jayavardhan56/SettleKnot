export function getRouteFromHash() {
  if (typeof window === 'undefined') return { view: 'landing', param: null };
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return { view: 'landing', param: null };

  const parts = hash.split('/');
  const route = parts[0];
  const param = parts[1] || null;

  if (route === 'dashboard') return { view: 'dashboard', param };
  if (route === 'room') return { view: 'room', param };
  if (route === 'notifications') return { view: 'notifications', param };
  if (route === 'auth') return { view: 'auth', param };
  if (route === 'admin') return { view: 'admin', param };
  if (route === 'about') return { view: 'landing', param: 'about' };
  if (route === 'features') return { view: 'landing', param: 'features' };
  if (route === 'workflow') return { view: 'landing', param: 'workflow' };

  return { view: 'landing', param: null };
}

export function navigateTo(view, param = '') {
  if (typeof window === 'undefined') return;
  let target = '#/';
  if (view === 'dashboard') target = '#/dashboard';
  else if (view === 'room') target = `#/room/${param}`;
  else if (view === 'notifications') target = '#/notifications';
  else if (view === 'auth') target = param ? `#/auth/${param}` : '#/auth';
  else if (view === 'admin') target = '#/admin';
  else if (view === 'features') target = '#/features';
  else if (view === 'workflow') target = '#/workflow';
  else if (view === 'about') target = '#/about';

  window.location.hash = target;
}
