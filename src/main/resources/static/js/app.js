(() => {
  const state = { name: localStorage.getItem('momentum-name') || '', socket: null, connected: false, reconnectTimer: null };
  const $ = (selector) => document.querySelector(selector);

  const escapeHtml = (value) => value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const initials = (name) => name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const time = (date) => new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);

  function renderTask(task) {
    const stored = localStorage.getItem(`momentum-task-${task.id}`) === 'done';
    return `<article class="task"><input class="task-check" aria-label="Mark ${escapeHtml(task.title)} complete" type="checkbox" data-task="${escapeHtml(task.id)}" ${stored ? 'checked' : ''}><div><p class="task-type">${escapeHtml(task.type)}</p><h3 class="task-title">${escapeHtml(task.title)}</h3><p class="task-description">${escapeHtml(task.description)}</p></div><span class="task-duration">${escapeHtml(task.duration)}</span></article>`;
  }

  function renderResource(resource) {
    return `<a class="resource" href="${escapeHtml(resource.url)}" ${resource.url !== '#' ? 'target="_blank" rel="noopener noreferrer"' : ''}><span class="resource-icon ${escapeHtml(resource.tint)}">${escapeHtml(resource.icon)}</span><span class="resource-copy"><span class="resource-label">${escapeHtml(resource.label)}</span><span class="resource-detail">${escapeHtml(resource.detail)}</span></span><span class="resource-arrow">→</span></a>`;
  }

  async function loadDashboard() {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Dashboard unavailable');
      const data = await response.json();
      $('#dateLabel').textContent = data.dateLabel;
      $('#focusLine').textContent = data.focusLine;
      $('#onlineCount').textContent = data.onlineCount;
      $('#completedCount').textContent = data.completedCount;
      $('#memberCount').textContent = data.memberCount;
      $('#progressFill').style.width = `${Math.round((data.completedCount / data.memberCount) * 100)}%`;
      $('#taskList').innerHTML = data.tasks.map(renderTask).join('');
      $('#resourceList').innerHTML = data.resources.map(renderResource).join('');
      document.querySelectorAll('[data-task]').forEach(input => input.addEventListener('change', (event) => {
        localStorage.setItem(`momentum-task-${event.target.dataset.task}`, event.target.checked ? 'done' : '');
      }));
    } catch (error) {
      $('#dateLabel').textContent = 'TODAY';
      $('#taskList').innerHTML = '<p class="task-description">Couldn’t load the daily plan. Please refresh and try again.</p>';
    }
  }

  function addMessage(message, mine = false) {
    const root = $('#messages');
    const name = escapeHtml(message.author || 'Member');
    const text = escapeHtml(message.message || '');
    const sentAt = message.sentAt ? new Date(message.sentAt) : new Date();
    const color = mine ? 'coral' : 'green';
    root.insertAdjacentHTML('beforeend', `<div class="message"><span class="message-avatar ${color}">${escapeHtml(initials(message.author || 'M'))}</span><div><div class="message-meta"><b>${name}</b><time>${time(sentAt)}</time></div><p>${text}</p></div></div>`);
    root.scrollTop = root.scrollHeight;
  }

  function updateProfile() {
    $('#profileLabel').textContent = state.name || 'Join in';
  }

  function announcePresence() {
    if (state.connected && state.name) {
      sendStomp('/app/presence.join', { name: state.name });
    }
  }

  function sendFrame(command, headers = {}, body = '') {
    if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return;
    const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`).join('\n');
    state.socket.send(`${command}\n${headerLines}\n\n${body}\0`);
  }

  function sendStomp(destination, payload) {
    sendFrame('SEND', { destination, 'content-type': 'application/json' }, JSON.stringify(payload));
  }

  function readFrames(raw) {
    return raw.split('\0').map(part => part.replace(/^\n+/, '')).filter(Boolean).map(part => {
      const separator = part.indexOf('\n\n');
      const lines = (separator === -1 ? part : part.slice(0, separator)).split('\n');
      const headers = Object.fromEntries(lines.slice(1).filter(Boolean).map(line => {
        const divider = line.indexOf(':');
        return [line.slice(0, divider), line.slice(divider + 1)];
      }));
      return { command: lines[0], headers, body: separator === -1 ? '' : part.slice(separator + 2) };
    });
  }

  function setChatAvailable(available) {
    $('#chatInput').disabled = !available;
    $('#sendButton').disabled = !available;
  }

  function handleFrame(frame) {
    if (frame.command === 'CONNECTED') {
      state.connected = true;
      $('#connectionStatus').textContent = 'Live now';
      $('#connectionStatus').classList.add('connected');
      setChatAvailable(true);
      sendFrame('SUBSCRIBE', { id: 'chat-feed', destination: '/topic/chat', ack: 'auto' });
      sendFrame('SUBSCRIBE', { id: 'presence-feed', destination: '/topic/presence', ack: 'auto' });
      announcePresence();
      return;
    }
    if (frame.command !== 'MESSAGE') return;
    try {
      const message = JSON.parse(frame.body);
      if (frame.headers.destination === '/topic/chat') addMessage(message, message.author === state.name);
      if (frame.headers.destination === '/topic/presence') $('#onlineCount').textContent = message.onlineCount;
    } catch (_) {
      // Ignore malformed broker frames while retaining the connection.
    }
  }

  function connectChat() {
    clearTimeout(state.reconnectTimer);
    const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${scheme}://${location.host}/live`, ['v12.stomp', 'v11.stomp', 'v10.stomp']);
    state.socket = socket;
    socket.onopen = () => sendFrame('CONNECT', { 'accept-version': '1.2,1.1,1.0', 'heart-beat': '10000,10000' });
    socket.onmessage = event => readFrames(event.data).forEach(handleFrame);
    socket.onclose = () => {
      state.connected = false;
      $('#connectionStatus').textContent = 'Reconnecting…';
      $('#connectionStatus').classList.remove('connected');
      setChatAvailable(false);
      state.reconnectTimer = setTimeout(connectChat, 4000);
    };
    socket.onerror = () => { $('#connectionStatus').textContent = 'Connection issue'; };
  }

  $('#profileButton').addEventListener('click', () => {
    $('#nameInput').value = state.name;
    $('#nameDialog').showModal();
    setTimeout(() => $('#nameInput').focus(), 100);
  });
  $('#nameForm').addEventListener('submit', event => {
    const name = $('#nameInput').value.trim();
    if (!name) { event.preventDefault(); $('#nameInput').focus(); return; }
    state.name = name;
    localStorage.setItem('momentum-name', name);
    updateProfile();
    $('#nameDialog').close();
    announcePresence();
    $('#chatInput').focus();
  });
  $('#chatForm').addEventListener('submit', event => {
    event.preventDefault();
    const input = $('#chatInput');
    const message = input.value.trim();
    if (!message || !state.connected) return;
    if (!state.name) { $('#nameDialog').showModal(); return; }
    sendStomp('/app/chat.send', { author: state.name, message, avatar: initials(state.name) });
    input.value = '';
  });

  updateProfile();
  loadDashboard();
  connectChat();
})();
