(function () {
  const view = document.getElementById('view-nlp-api');
  if (!view) return;
  const grid = view.querySelector('.collector-status-grid');
  const description = document.getElementById('nlp-login-setup');
  const note = grid.nextElementSibling;
  description.textContent = 'Choose a social account for this LGU. Sign in privately, complete any platform verification, then save the session. You can disconnect and sign in with another account at any time.';
  note.textContent = 'Connections belong to the selected LGU. Disconnect removes the BANTALA’s saved session; it does not sign you out on your personal devices.';
  const style = document.createElement('style');
  style.textContent = `.social-login-dialog{width:min(1060px,95vw);max-height:95vh;padding:20px;border:1px solid #dee7f1;border-radius:18px;color:#0f1f33;font:13px/1.6 Inter,system-ui,sans-serif}.social-login-dialog::backdrop{background:#071b30aa}.social-login-dialog header{display:flex;align-items:center;justify-content:space-between;gap:16px}.social-login-dialog h3{font:600 16px Inter,system-ui,sans-serif}.social-login-dialog img{display:block;width:100%;margin:16px 0;border:1px solid #dee7f1;border-radius:12px;cursor:pointer}.social-login-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.social-login-controls input{min-height:40px;flex:1;padding:8px 12px;border:1px solid #dee7f1;border-radius:10px;font:inherit}.social-login-dialog .btn{min-height:38px;border-radius:10px;font-size:12px}.social-login-feedback{margin:12px 0;color:#57697f}.social-account-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}.social-account-actions .btn{flex:1}`;
  document.head.append(style);
  let csrf = '', generation = 0, active = null, busy = false;
  const dialog = document.createElement('dialog');
  dialog.className = 'social-login-dialog';
  dialog.innerHTML = `<header><h3>Private social sign-in</h3><button class="btn btn-outline" type="button" data-op="close">Close</button></header><p>Click the platform form below. Enter text with the private input, then send it to the focused field. Complete sign-in and verification before saving.</p><img alt="Private platform login browser" tabindex="0" hidden><div class="social-login-controls"><input type="password" autocomplete="off" aria-label="Text to send to the selected platform field" placeholder="Type into the selected field"><button type="button" class="btn btn-outline" data-op="type">Send text</button><button type="button" class="btn btn-outline" data-op="enter">Enter</button><button type="button" class="btn btn-outline" data-op="tab">Next field</button><button type="button" class="btn btn-outline" data-op="clear">Clear field</button><button type="button" class="btn btn-outline" data-op="up">Scroll up</button><button type="button" class="btn btn-outline" data-op="down">Scroll down</button><button type="button" class="btn btn-outline" data-op="frame">Refresh view</button><button type="button" class="btn btn-primary" data-op="save">Save account</button></div><p class="social-login-feedback" role="status"></p>`;
  document.body.append(dialog);
  const image = dialog.querySelector('img'), input = dialog.querySelector('input'), feedback = dialog.querySelector('[role=status]');
  const importDialog = document.createElement('dialog');
  importDialog.className = 'social-login-dialog cookie-import-dialog';
  importDialog.innerHTML = `<header><h3>Submit account cookies</h3><button class="btn btn-outline" type="button" data-close>Close</button></header><p>Paste your signed-in session. It will be saved privately for the selected LGU.</p><form><label class="cookie-field"><span data-cookie-label>Cookies</span><span class="cookie-input-wrap"><input name="cookies" type="password" autocomplete="off" spellcheck="false" required maxlength="60000" placeholder="Paste cookie header or JSON"><button type="button" class="cookie-eye" data-reveal="cookies" aria-label="Show cookies" aria-pressed="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button></span></label><p data-help></p><p role="status" class="social-login-feedback"></p><div class="cookie-actions"><button class="btn btn-primary" type="submit">Submit session</button></div></form>`;
  style.textContent += `.cookie-import-dialog{box-sizing:border-box;width:min(660px,calc(100vw - 32px));padding:24px;border:1px solid #dee7f1}.cookie-import-dialog p{margin:12px 0;color:#57697f}.cookie-field{display:block;margin:18px 0 12px;font-weight:600}.cookie-field[hidden]{display:none}.cookie-input-wrap{position:relative;display:flex;margin-top:8px}.cookie-input-wrap input{box-sizing:border-box;width:100%;min-width:0;height:48px;border:1px solid #cfdae7;border-radius:10px;background:#f8fafc;padding:12px 50px 12px 14px;font:13px/1.5 ui-monospace,monospace}.cookie-input-wrap input:focus{outline:2px solid #176be8;outline-offset:2px}.cookie-eye{position:absolute;right:6px;top:6px;width:36px;height:36px;display:grid;place-items:center;border:0;border-radius:8px;background:transparent;color:#57697f;cursor:pointer}.cookie-eye:hover,.cookie-eye[aria-pressed=true]{background:#e7effb;color:#176be8}.cookie-actions{display:flex;justify-content:flex-end;margin-top:20px}`;
  document.body.append(importDialog);
  let importTarget = null;
  const importForm = importDialog.querySelector('form');
  function resetImport() {
    importForm.reset();
    importDialog.querySelectorAll('[data-reveal]').forEach(button => {
      importForm.elements[button.dataset.reveal].type = 'password';
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', 'Show ' + button.dataset.reveal);
    });
  }
  importDialog.querySelectorAll('[data-reveal]').forEach(button => {
    button.onclick = () => {
      const field = importForm.elements[button.dataset.reveal];
      const show = field.type === 'password';
      field.type = show ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', (show ? 'Hide ' : 'Show ') + button.dataset.reveal);
    };
  });
  const clearImport = () => { resetImport(); importTarget = null; importDialog.close(); };
  importDialog.querySelector('[data-close]').onclick = clearImport;
  importDialog.addEventListener('cancel', event => { event.preventDefault(); clearImport(); });
  function importSession(platform, location) {
    importTarget = { platform, location };
    resetImport();
    importDialog.querySelector('h3').textContent = `Submit ${platform} cookies`;
    importDialog.querySelector('[data-cookie-label]').textContent = platform + ' cookies';
    importDialog.querySelector('[data-help]').textContent = platform === 'X'
      ? 'Paste both cookies together: auth_token=YOUR_VALUE; ct0=YOUR_VALUE. JSON with auth_token and ct0 also works.'
      : platform === 'Facebook' ? 'Facebook cookies must include c_user and xs. ct0 is not needed.'
      : 'Threads cookies must include sessionid. Use JSON to preserve the original Threads or Instagram cookie domains. ct0 is not needed.';
    importDialog.querySelector('[role=status]').textContent = '';
    importDialog.showModal();
  }
  importForm.onsubmit = async event => {
    event.preventDefault();
    if (!importTarget) return;
    const target = { ...importTarget }, cookies = importForm.elements.cookies.value.trim();
    let text;
    try { text = JSON.stringify(JSON.parse(cookies)); }
    catch { text = JSON.stringify(cookies); }
    resetImport();
    importDialog.querySelectorAll('button,input').forEach(el => { el.disabled = true; });
    const status = importDialog.querySelector('[role=status]');
    status.textContent = 'Saving session…';
    try {
      await request('social-browser', { platform: target.platform, operation: 'import-session', text }, target.location);
      clearImport(); await refreshAccounts();
    } catch (error) { status.textContent = error.message; }
    finally { importDialog.querySelectorAll('button,input').forEach(el => { el.disabled = false; }); }
  };
  async function request(action, payload = {}, location = currentAdminLocationId()) {
    const write = action === 'social-browser';
    const url = ADMIN_API_URL + (write ? '' : '?' + new URLSearchParams({ action, location }));
    const response = await fetch(url, { credentials: 'include', cache: 'no-store', ...(write ? {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ ...payload, action, location_id: location }),
    } : {}) });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) throw Error('Your BANTALA admin session expired. Sign in again, then reopen Social accounts.');
    if (!response.ok) throw Error(data.error || 'Social browser request failed.');
    return data;
  }
  async function refreshAccounts() {
    const own = ++generation, location = currentAdminLocationId();
    if (!session || !location) return;
    grid.replaceChildren();
    try {
      const data = await request('social-accounts', {}, location);
      if (own !== generation || location !== currentAdminLocationId()) return;
      csrf = data.csrf;
      if (!data.can_import) { const hint = document.createElement('p'); hint.textContent = 'Submit cookies is available only to the super admin. Sign in with the platform admin account to import sessions.'; grid.append(hint); }
      for (const platform of ['Facebook', 'X', 'Threads']) {
        const connected = data.accounts.find(a => a.platform === platform)?.connected;
        const card = document.createElement('div'); card.className = 'collector-status-card';
        const title = document.createElement('strong'); title.textContent = platform;
        const status = document.createElement('span'); status.textContent = connected ? 'Session saved for this LGU' : 'Not connected';
        const help = document.createElement('small');
        help.textContent = !data.available ? 'Online sign-in is waiting for the browser service to be deployed.' : connected ? 'You can replace this session by signing in with another account.' : 'Sign in with the account this LGU wants to use.';
        const actions = document.createElement('div'); actions.className = 'social-account-actions';
        const login = document.createElement('button'); login.className = 'btn btn-outline'; login.type = 'button';
        login.textContent = connected ? 'Switch account' : 'Sign in'; login.disabled = !data.available || !data.can_edit;
        login.onclick = () => start(platform, location); actions.append(login);
        if (data.can_import) {
          const submit = document.createElement('button'); submit.type = 'button'; submit.className = 'btn btn-outline';
          submit.textContent = 'Submit cookies'; submit.onclick = () => importSession(platform, location); actions.append(submit);
        }
        if (connected) {
          const logout = document.createElement('button'); logout.className = 'btn btn-outline'; logout.type = 'button'; logout.textContent = 'Disconnect'; logout.disabled = !data.can_edit;
          logout.onclick = async () => {
            if (!confirm(`Disconnect ${platform} for this LGU?`)) return;
            logout.disabled = true;
            try { await request('social-browser', { platform, operation: 'disconnect' }, location); await refreshAccounts(); }
            catch (error) { help.textContent = error.message; logout.disabled = false; }
          }; actions.append(logout);
        }
        card.append(title, status, help, actions); grid.append(card);
      }
    } catch (error) { const message = document.createElement('p'); message.textContent = error.message; grid.append(message); }
  }
  async function operate(operation, extra = {}) {
    if (!active || busy) return;
    busy = true;
    dialog.querySelectorAll('button,input').forEach(el => { el.disabled = true; });
    feedback.textContent = 'Updating private browser…';
    try {
      const data = await request('social-browser', { platform: active.platform, operation, ...extra }, active.location);
      if (data.image) { image.src = 'data:image/jpeg;base64,' + data.image; image.hidden = false; }
      feedback.textContent = 'Complete sign-in in the platform view, then choose Save account.';
      if (data.connected) { active = null; image.removeAttribute('src'); input.value = ''; dialog.close(); await refreshAccounts(); }
    } catch (error) { feedback.textContent = error.message; }
    finally { busy = false; dialog.querySelectorAll('button,input').forEach(el => { el.disabled = false; }); }
  }
  async function start(platform, location) {
    active = { platform, location }; image.hidden = true; input.value = '';
    dialog.querySelector('h3').textContent = `Sign in to ${platform}`;
    dialog.showModal(); await operate('start');
  }
  async function close() {
    if (busy) return;
    const previous = active; active = null;
    image.removeAttribute('src'); input.value = ''; dialog.close();
    if (previous) try { await request('social-browser', { platform: previous.platform, operation: 'cancel' }, previous.location); } catch { /* Server expires abandoned browsers automatically. */ }
  }
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  image.onclick = event => { const rect = image.getBoundingClientRect(); operate('click', { x: (event.clientX - rect.left) * 1000 / rect.width, y: (event.clientY - rect.top) * 720 / rect.height }); };
  image.onkeydown = event => { if (['Enter', 'Tab', 'Backspace', 'Escape'].includes(event.key)) { event.preventDefault(); operate('key', { key: event.key }); } };
  dialog.querySelectorAll('[data-op]').forEach(button => { button.onclick = async () => {
    const op = button.dataset.op;
    if (op === 'close') return close();
    if (op === 'type') { const text = input.value; input.value = ''; return operate('type', { text }); }
    if (op === 'clear') { await operate('key', { key: 'ControlOrMeta+A' }); return operate('key', { key: 'Backspace' }); }
    if (op === 'enter' || op === 'tab') return operate('key', { key: op === 'enter' ? 'Enter' : 'Tab' });
    if (op === 'up' || op === 'down') return operate('scroll', { delta: op === 'up' ? -500 : 500 });
    return operate(op);
  }; });
  const original = window.renderNlpConnections;
  window.renderNlpConnections = async function (...args) {
    await Promise.allSettled([original.apply(this, args), refreshAccounts()]);
    if (!session) return;
    const location = currentAdminLocationId(), monitor = document.getElementById('nlp-connections-status');
    const health = nlpServiceHealth?.lgu_social_collectors || {};
    document.getElementById('nlp-connections-message').textContent = 'Monitoring for the selected LGU’s saved accounts. Collection starts after the hosted browser service and LGU collectors are configured.';
    monitor.replaceChildren();
    for (const platform of ['Facebook', 'X', 'Threads']) {
      const state = health[location + ':' + platform];
      const card = document.createElement('div'); card.className = 'collector-status-card';
      const title = document.createElement('strong'); title.textContent = platform;
      const status = document.createElement('span'); status.textContent = !state ? 'Awaiting LGU collector setup' : state.last_error ? 'Needs attention' : !state.connected ? 'Waiting for account sign-in' : state.running ? 'Collecting posts' : 'Waiting for next poll';
      const detail = document.createElement('small'); detail.textContent = state?.last_error || (state ? `${state.posts_processed || 0} posts analyzed by this LGU collector this session.` : 'Shared collector activity does not indicate that this LGU has connected an account.');
      card.append(title, status, detail); monitor.append(card);
    }
  };
})();

// Monitor the selected LGU's saved-account collectors instead of shared logins.
(function () {
  function scopedStates(health) {
    if (!health || !Object.hasOwn(health, 'lgu_social_collectors')) return null;
    const scope = currentAdminLocationId();
    return ['X', 'Facebook', 'Threads'].map(platform => ({
      platform, state: health.lgu_social_collectors?.[scope + ':' + platform],
    }));
  }
  const previousRender = window.renderCollectorStatuses;
  window.renderCollectorStatuses = function (id, health) {
    const entries = scopedStates(health);
    if (!entries) return previousRender(id, health);
    const grid = document.getElementById(id);
    if (!grid) return;
    grid.replaceChildren(...entries.map(({ platform, state }) => {
      const card = document.createElement('div'); card.className = 'collector-status-card';
      const title = document.createElement('strong'); title.textContent = platform;
      const label = document.createElement('span');
      label.textContent = !state ? 'Waiting for collector status' : state.last_error ? 'Needs attention' :
        !state.connected ? 'Account not connected' : state.paused ? 'API ready; collection paused' : state.running ? 'Collecting posts' : 'Connected; waiting for next poll';
      card.dataset.state = state?.last_error ? 'attention' : state?.connected ? 'active' : 'waiting';
      const detail = document.createElement('small');
      detail.textContent = state?.last_error || `${Number(state?.posts_processed || 0)} posts analyzed for this LGU this session`;
      card.append(title, label, detail); return card;
    }));
  };
  const previousMessage = window.socialCollectorMessage;
  window.socialCollectorMessage = function (health) {
    const entries = scopedStates(health);
    return entries ? entries.filter(({ state }) => state?.last_error)
      .map(({ platform, state }) => `${platform}: ${state.last_error}`).join(' | ') : previousMessage(health);
  };
  const previousBadge = window.socialCollectorBadge;
  window.socialCollectorBadge = function (health) {
    const entries = scopedStates(health);
    if (!entries) return previousBadge(health);
    if (entries.some(({ state }) => state?.last_error)) return 'Social collectors need attention';
    if (entries.some(({ state }) => state?.running)) return 'Collecting posts';
    if (entries.some(({ state }) => state?.connected)) return 'Accounts connected; awaiting next poll';
    return 'Waiting for social account connection';
  };
})();
