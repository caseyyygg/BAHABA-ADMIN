(function () {
  const view = document.getElementById('view-users');
  if (!view) return;
  const pages = { admin: 1, app: 1 };
  const pageSizes = { admin: 10, app: 10 };
  const originalRender = window.renderUserManager;
  function locationName(user) {
    const location = locationForId(user.assigned_location);
    return user.role === 'platform-admin' ? 'All supported locations' : [location?.name, location?.city, user.location, user.city].filter(Boolean).join(' ');
  }
  for (const kind of ['admin', 'app']) {
    const search = document.getElementById(`${kind}-user-search`);
    search.setAttribute('aria-label', `Search ${kind} users by name or email`);
    const panel = search.closest('.panel'); panel.classList.add('user-directory-panel');
    const controls = search.parentElement; controls.classList.add('user-directory-filters');
    let role = null;
    if (kind === 'admin') {
      role = document.createElement('select'); role.id = 'admin-user-role-filter';
      role.setAttribute('aria-label', 'Filter admin users by role');
      role.add(new Option('All roles', ''));
      for (const [name, value] of [['Platform admin', 'platform-admin'], ['LGU / Barangay admin', 'lgu-admin']]) role.add(new Option(name, value));
    }
    const city = document.createElement('input'); city.type = 'search'; city.id = `${kind}-user-city-filter`; city.placeholder = 'Search city or location'; city.setAttribute('aria-label', `Search ${kind} users by city or location`);
    if (role) controls.append(role);
    controls.append(city);
    const status = document.getElementById(`${kind}-user-status-filter`); status.setAttribute('aria-label', `Filter ${kind} users by status`);
    for (const input of [search, role, city, status].filter(Boolean)) {
      input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => { pages[kind] = 1; }, true);
    }
    role?.addEventListener('change', render); city.addEventListener('input', render);
    const footer = document.createElement('div'); footer.className = 'user-directory-footer';
    const count = document.createElement('span'); count.id = `${kind}-user-page-count`; count.setAttribute('role', 'status');
    const actions = document.createElement('div'); actions.className = 'user-directory-pagination';
    const size = document.createElement('select'); size.setAttribute('aria-label', `${kind} users per page`);
    for (const value of [10, 20, 50]) size.add(new Option(`${value} per page`, value));
    size.onchange = () => { pageSizes[kind] = Number(size.value); pages[kind] = 1; render(); };
    const previous = document.createElement('button'); previous.id = `${kind}-user-prev`; previous.className = 'btn btn-outline btn-sm'; previous.type = 'button'; previous.textContent = 'Previous'; previous.onclick = () => { pages[kind]--; render(); };
    const page = document.createElement('span'); page.id = `${kind}-user-page`;
    const next = document.createElement('button'); next.id = `${kind}-user-next`; next.className = 'btn btn-outline btn-sm'; next.type = 'button'; next.textContent = 'Next'; next.onclick = () => { pages[kind]++; render(); };
    actions.append(size, previous, page, next); footer.append(count, actions); panel.append(footer);
  }
  window.userManagerPage = function (users, kind) {
    const role = kind === 'admin' ? document.getElementById('admin-user-role-filter').value : '';
    const city = document.getElementById(`${kind}-user-city-filter`).value.trim().toLowerCase();
    const filtered = users.filter(user => {
      const userRole = kind === 'app' ? 'app-user' : user.role || (user.acls?.admin_overview === 'full' ? 'platform-admin' : 'lgu-admin');
      return (!role || role === userRole) && (!city || locationName(user).toLowerCase().includes(city));
    });
    const size = pageSizes[kind], totalPages = Math.max(1, Math.ceil(filtered.length / size));
    pages[kind] = Math.min(totalPages, Math.max(1, pages[kind]));
    const start = (pages[kind] - 1) * size;
    document.getElementById(`${kind}-user-page-count`).textContent = filtered.length ? `${start + 1}–${Math.min(start + size, filtered.length)} of ${filtered.length} users` : 'No users match these filters';
    document.getElementById(`${kind}-user-page`).textContent = `Page ${pages[kind]} of ${totalPages}`;
    document.getElementById(`${kind}-user-prev`).disabled = pages[kind] === 1;
    document.getElementById(`${kind}-user-next`).disabled = pages[kind] === totalPages;
    queueMicrotask(() => {
      const body = document.getElementById(`user-manager-${kind}-table-body`);
      if (!body.children.length) { const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 6; cell.className = 'user-directory-empty'; cell.textContent = 'No users found. Try another name, role, city, or status.'; }
    });
    return filtered.slice(start, start + size);
  };
  function render() { originalRender(); }
  window.renderUserManager = render;
  window.resetAdminUserFilters = function () {
    const search = document.getElementById('admin-user-search');
    const role = document.getElementById('admin-user-role-filter');
    const city = document.getElementById('admin-user-city-filter');
    const status = document.getElementById('admin-user-status-filter');
    if (search) search.value = '';
    if (role) role.value = '';
    if (city) city.value = '';
    if (status) status.value = 'all';
    pages.admin = 1;
    render();
  };

  const location = document.getElementById('new-user-location');
  const role = document.getElementById('new-user-role');
  const picker = document.createElement('div'); picker.className = 'location-picker';
  const trigger = document.createElement('button'); trigger.type = 'button'; trigger.id = 'new-user-location-trigger'; trigger.className = 'location-picker-trigger'; trigger.setAttribute('aria-haspopup', 'listbox'); trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-label', 'Choose an assigned location');
  const triggerText = document.createElement('span');
  const chevron = document.createElement('span'); chevron.className = 'location-picker-chevron'; chevron.setAttribute('aria-hidden', 'true'); chevron.textContent = '▾';
  trigger.append(triggerText, chevron);
  const menu = document.createElement('div'); menu.className = 'location-picker-menu'; menu.hidden = true;
  const search = document.createElement('input'); search.type = 'search'; search.id = 'new-user-location-search'; search.placeholder = 'Search city, municipality, or province'; search.setAttribute('aria-label', 'Search assigned locations'); search.autocomplete = 'off';
  const results = document.createElement('div'); results.className = 'location-picker-results'; results.setAttribute('role', 'listbox'); results.setAttribute('aria-label', 'Supported locations');
  menu.append(search, results);
  location.before(picker); picker.append(trigger, menu, location); location.tabIndex = -1; location.setAttribute('aria-hidden', 'true');
  const hint = document.createElement('small'); hint.className = 'user-location-hint'; picker.after(hint);
  const password = document.getElementById('new-user-password'); password.type = 'password'; password.autocomplete = 'new-password'; password.minLength = 8;
  for (const id of ['name', 'email', 'role', 'location', 'password']) {
    const input = document.getElementById('new-user-' + id); input.closest('.field').querySelector('label').htmlFor = input.id;
  }
  location.closest('.field').querySelector('label').htmlFor = trigger.id;
  function closeMenu() { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
  function renderLocations() {
    const isPlatform = role.value === 'platform-admin';
    const query = search.value.trim().toLocaleLowerCase();
    const selected = location.options[location.selectedIndex];
    triggerText.textContent = isPlatform ? 'All supported locations' : selected?.value && selected.value !== 'all' ? selected.textContent : 'Choose an assigned location';
    trigger.disabled = isPlatform;
    trigger.classList.toggle('is-disabled', isPlatform);
    results.replaceChildren();
    const allOption = document.createElement('button'); allOption.type = 'button'; allOption.className = 'location-picker-option location-picker-all'; allOption.textContent = 'All supported locations — Platform Admin only'; allOption.disabled = true; allOption.setAttribute('role', 'option');
    results.append(allOption);
    const matches = SUPPORTED_LOCATIONS.filter(item => [item.name, item.city, item.province, item.region, ...(item.aliases || [])].filter(Boolean).join(' ').toLocaleLowerCase().includes(query));
    for (const item of matches) {
      const option = document.createElement('button'); option.type = 'button'; option.className = 'location-picker-option'; option.textContent = item.name; option.setAttribute('role', 'option'); option.setAttribute('aria-selected', String(location.value === item.id));
      option.addEventListener('click', () => { location.value = item.id; location.dispatchEvent(new Event('change', { bubbles: true })); search.value = ''; renderLocations(); closeMenu(); trigger.focus(); });
      results.append(option);
    }
    hint.textContent = isPlatform ? 'Platform admins can manage all supported locations.' : `${matches.length} matching locations. Search or scroll to choose one.`;
  }
  function syncLocation() {
    const isPlatform = role.value === 'platform-admin';
    const previous = location.value;
    location.disabled = isPlatform; location.required = false; trigger.disabled = isPlatform; trigger.setAttribute('aria-required', String(!isPlatform)); search.disabled = isPlatform;
    const options = [new Option(isPlatform ? 'All supported locations' : 'Choose an assigned location', isPlatform ? 'all' : '')];
    if (!isPlatform) {
      const all = new Option('All supported locations — Platform Admin only', 'all'); all.disabled = true; options.push(all);
      for (const item of SUPPORTED_LOCATIONS) options.push(new Option(item.name, item.id));
    }
    location.replaceChildren(...options);
    location.value = isPlatform ? 'all' : SUPPORTED_LOCATIONS.some(item => item.id === previous) ? previous : '';
    renderLocations();
  }
  window.refreshAssignedLocationPicker = syncLocation;
  trigger.addEventListener('click', () => { if (trigger.disabled) return; menu.hidden = !menu.hidden; trigger.setAttribute('aria-expanded', String(!menu.hidden)); if (!menu.hidden) { renderLocations(); search.focus(); } });
  search.addEventListener('input', renderLocations);
  search.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); trigger.focus(); } });
  document.addEventListener('click', event => { if (!picker.contains(event.target)) closeMenu(); });
  role.addEventListener('change', () => { search.value = ''; closeMenu(); syncLocation(); });
  document.getElementById('new-user-form').addEventListener('reset', () => setTimeout(() => { search.value = ''; syncLocation(); }, 0));
  syncLocation();
})();
