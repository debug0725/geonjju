// 단칸방 — 화면 동작
// 이름·색·채널 설명은 config.js에서 바꿉니다. 이 파일은 동작만 담당해요.
//
// 목차
//   1. 기본 도구        5. 메시지 그리기     9.  팝오버(이모지·고정·프로필)
//   2. 상태            6. 메시지 작성       10. 프로필
//   3. 저장소          7. 메시지 동작       11. 음성 연출
//   4. 채널 이동        8. 사이드바·멤버     12. 시작

'use strict';

// ───────── 1. 기본 도구 ─────────

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const CONFIG = window.ROOM;
const MEMBERS = CONFIG.members.map(m => m.name);
const memberIndex = name => MEMBERS.indexOf(name);
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
}

const ICONS = {
  hash: '<path d="m10 3-4 18M18 3l-4 18M4 9h17M2 15h17"/>',
  speaker: '<path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H3l2-5A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8 9h8M8 13h5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  pin: '<path d="M12 17v5M9 3h6l-1 6 4 4H6l4-4-1-6Z"/>',
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>',
  members: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  search: '<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-5-5"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14s1.3 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01"/>',
  smilePlus: '<path d="M20.5 12A8.5 8.5 0 1 1 12 3.5"/><path d="M8.5 14s1.3 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01M19 2v6M16 5h6"/>',
  reply: '<path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
  plus: '<circle cx="12" cy="12" r="9.5" class="fill"/><path d="M12 7.5v9M7.5 12h9" class="on-fill"/>',
  send: '<path d="m3 3 19 9-19 9 4-9-4-9ZM7 12h15"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  swap: '<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="M7 4v16l13-8Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  person: '<circle cx="12" cy="9" r="3.6" class="solid"/><path d="M5.4 20.4v-1.2a6.6 6.6 0 0 1 13.2 0v1.2" class="solid"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
const fillIcons = (root = document) => root.querySelectorAll('i[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });

function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 3000);
}

function imageValue(s) {
  return typeof s === 'string' && /^data:image\/(png|webp|jpeg|gif);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : null;
}

function youtubeId(text) {
  for (const match of String(text).matchAll(/https?:\/\/[^\s<>]+/g)) {
    try {
      const u = new URL(match[0]);
      let id;
      if (u.hostname === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
      if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(u.hostname)) {
        id = u.searchParams.get('v') || u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
      }
      if (/^[\w-]{11}$/.test(id || '')) return id;
    } catch {}
  }
  return null;
}

// 시간 표시: 오늘 오후 3:12 / 어제 오후 3:12 / 2026. 10. 14. 오후 3:12
const clock = d => d.toLocaleTimeString('ko-KR', {hour: 'numeric', minute: '2-digit'});
function when(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);
  if (diff === 0) return `오늘 ${clock(d)}`;
  if (diff === 1) return `어제 ${clock(d)}`;
  return `${d.toLocaleDateString('ko-KR')} ${clock(d)}`;
}
const fullDate = d => d.toLocaleString('ko-KR', {dateStyle: 'full', timeStyle: 'short'});
const dayLabel = d => d.toLocaleDateString('ko-KR', {year: 'numeric', month: 'long', day: 'numeric'});

// ───────── 2. 상태 ─────────

const CHANNELS = Object.fromEntries([
  ...CONFIG.channels.map(c => [c.key, {...c, type: 'text'}]),
  ['guestbook', {key: 'guestbook', type: 'guestbook', ...CONFIG.guestbook}],
  ['voice', {key: 'voice', type: 'voice', ...CONFIG.voice}],
]);

const emptyFeed = () => ({posts: [], more: false, cursor: null, extended: false, loaded: false});

const S = {
  channel: CONFIG.channels[0].key,
  demo: false,
  author: MEMBERS.includes(localStorage.getItem('our-room-name')) ? localStorage.getItem('our-room-name') : MEMBERS[0],
  feeds: Object.fromEntries([...CONFIG.channels.map(c => c.key), 'guestbook'].map(k => [k, emptyFeed()])),
  refs: new Map(),          // 답장 원본 (화면에 안 불러온 메시지)
  profiles: Object.fromEntries(MEMBERS.map(n => [n, null])),
  drafts: {},               // 채널별 작성 중인 글
  attachment: null,
  editing: null,            // 수정 중인 메시지 id
  replyTo: null,            // 답장 대상 메시지 id
  saving: false,
  search: '',
  membersOpen: localStorage.getItem('our-room-members') !== '0',
  version: 0,
};

const feed = () => S.feeds[S.channel];
const isGuestbook = () => S.channel === 'guestbook';
const findPost = id => S.feeds[S.channel]?.posts.find(p => p.id === id) || S.refs.get(id);

// ───────── 3. 저장소 ─────────
// remote: 실제 서버(Supabase), demo: 이 브라우저(localStorage)

async function api(action, data, extra = '') {
  const res = await fetch(`/api/index?action=${action}${extra}`, {
    method: data ? 'POST' : 'GET',
    headers: data ? {'Content-Type': 'application/json'} : undefined,
    body: data ? JSON.stringify(data) : undefined,
    cache: 'no-store',
  });
  let out;
  try { out = await res.json(); } catch { throw new Error('연결할 수 없어요. 잠시 후 다시 시도해 주세요.'); }
  if (!res.ok) throw new Error(out.error || '요청을 처리하지 못했어요.');
  return out;
}

const remote = {
  list: (channel, before) => channel === 'guestbook'
    ? api('guest_list', null, before ? `&before=${encodeURIComponent(before)}` : '')
    : api('list', null, `&channel=${channel}${before ? `&before=${encodeURIComponent(before)}` : ''}`),
  pins: async channel => (await api('pins', null, `&channel=${channel}`)).posts,
  post: (channel, rec) => channel === 'guestbook' ? api('guest_post', {author: rec.author, text: rec.text}) : api('post', rec),
  edit: (id, rec) => api('edit', {...rec, id}),
  remove: (channel, id) => api(channel === 'guestbook' ? 'guest_delete' : 'delete', {id}),
  react: (id, emoji, author) => api('react', {id, emoji, author}).then(r => r.reactions),
  pin: (id, pinned) => api('pin', {id, pinned}),
  loadProfiles: async () => (await api('profiles_get')).profiles || [],
  saveProfiles: profiles => api('profiles_save', {profiles: MEMBERS.map(name => ({name, avatar: profiles[name]}))}),
};

const DEMO_KEY = 'our-room-discord-v2';
const demo = {
  read() {
    try { return JSON.parse(localStorage.getItem(DEMO_KEY)) || {posts: [], guests: []}; } catch { return {posts: [], guests: []}; }
  },
  write(data) { localStorage.setItem(DEMO_KEY, JSON.stringify(data)); },
  kinds(channel) { return channel === 'music' ? ['music'] : channel === 'diary' ? ['diary', 'photo', 'quote'] : [channel]; },
  async list(channel) {
    const data = this.read();
    const posts = channel === 'guestbook' ? data.guests : data.posts.filter(p => this.kinds(channel).includes(p.kind));
    return {posts, refs: data.posts, more: false, nextCursor: null};
  },
  async pins(channel) { return (await this.list(channel)).posts.filter(p => p.pinned).reverse(); },
  async post(channel, rec) {
    const data = this.read();
    const row = {...rec, id: crypto.randomUUID(), created_at: new Date().toISOString(), reactions: {}, pinned: false};
    channel === 'guestbook' ? data.guests.push({id: row.id, author: rec.author, text: rec.text, created_at: row.created_at}) : data.posts.push(row);
    this.write(data);
  },
  async edit(id, rec) {
    const data = this.read();
    data.posts = data.posts.map(p => p.id === id ? {...p, ...rec, reply_to: p.reply_to, edited_at: new Date().toISOString()} : p);
    this.write(data);
  },
  async remove(channel, id) {
    const data = this.read();
    if (channel === 'guestbook') data.guests = data.guests.filter(p => p.id !== id);
    else data.posts = data.posts.filter(p => p.id !== id).map(p => p.reply_to === id ? {...p, reply_to: null} : p);
    this.write(data);
  },
  async react(id, emoji, author) {
    const data = this.read();
    const post = data.posts.find(p => p.id === id);
    const reactions = {...(post.reactions || {})};
    const people = new Set(reactions[emoji] || []);
    people.has(author) ? people.delete(author) : people.add(author);
    if (people.size) reactions[emoji] = MEMBERS.filter(m => people.has(m)); else delete reactions[emoji];
    post.reactions = reactions;
    this.write(data);
    return reactions;
  },
  async pin(id, pinned) {
    const data = this.read();
    data.posts.find(p => p.id === id).pinned = pinned;
    this.write(data);
  },
  async loadProfiles() {
    try {
      const saved = JSON.parse(localStorage.getItem('our-room-profiles-v1')) || {};
      return MEMBERS.map(name => ({name, avatar: saved[name]}));
    } catch { return []; }
  },
  async saveProfiles(profiles) { localStorage.setItem('our-room-profiles-v1', JSON.stringify(profiles)); },
};

let store = remote;

// ───────── 4. 채널 이동 ─────────

async function navigate(channel) {
  if (!CHANNELS[channel]) return;
  const changing = S.channel !== channel;
  const info = CHANNELS[channel];

  if (changing && S.channel !== 'voice') {
    S.drafts[S.channel] = {text: $('#message-input').value, attachment: S.attachment, editing: S.editing, replyTo: S.replyTo};
  }
  S.channel = channel;
  closePopover();
  closeDrawers();

  // 머리말
  $('#channel-name').textContent = info.label;
  $('#channel-topic').textContent = info.topic || '';
  $('#channel-icon').dataset.icon = info.type === 'voice' ? 'speaker' : info.type === 'guestbook' ? 'chat' : 'hash';
  fillIcons($('.chat-header'));
  document.title = `${info.label} · ${CONFIG.siteTitle}`;
  $$('[data-channel]').forEach(b => {
    const on = b.dataset.channel === channel;
    b.classList.toggle('selected', on);
    b.setAttribute('aria-current', on ? 'page' : 'false');
  });

  // 화면 전환
  const voice = info.type === 'voice';
  $('#feed').hidden = voice;
  $('#composer').hidden = voice;
  $('#voice-stage').hidden = !voice;
  $('#pins-open').hidden = info.type !== 'text';
  $('.search').hidden = voice;
  $('#guest-link').hidden = voice;
  $('#message-input').placeholder = `#${info.label}에 메시지 보내기`;
  $('#attach').hidden = isGuestbook();

  if (changing) {
    const draft = S.drafts[channel] || {};
    S.attachment = draft.attachment || null;
    S.editing = draft.editing || null;
    S.replyTo = draft.replyTo || null;
    $('#message-input').value = draft.text || '';
    resizeInput();
    showAttachment();
    S.search = '';
    $('#search').value = '';
  }
  renderComposerBar();
  if (voice) return;

  if (changing && !reducedMotion()) {
    $('#feed').animate?.([{opacity: .5, transform: 'translateY(6px)'}, {opacity: 1, transform: 'none'}], {duration: 200, easing: 'ease-out'});
  }
  renderMessages();
  scrollToEnd();
  try {
    await loadChannel(false);
  } catch (e) { toast(e.message); }
  scrollToEnd();
}

async function loadChannel(older = false) {
  const channel = S.channel;
  const f = S.feeds[channel];
  const version = ++S.version;
  const out = await store.list(channel, older ? f.cursor : null);
  if (channel !== S.channel || version !== S.version) return;

  (out.refs || []).forEach(r => S.refs.set(r.id, r));
  const before = JSON.stringify(f.posts);

  if (older) {
    const merged = new Map([...out.posts, ...f.posts].map(p => [p.id, p]));
    f.posts = [...merged.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
    f.more = out.more;
    f.cursor = out.nextCursor;
    f.extended = true;
  } else if (f.extended) {
    // 예전 메시지를 더 불러온 상태: 최신 페이지만 바꿉니다.
    const oldest = out.posts[0]?.created_at;
    f.posts = oldest ? [...f.posts.filter(p => p.created_at < oldest), ...out.posts] : [];
  } else {
    f.posts = out.posts;
    f.more = out.more;
    f.cursor = out.nextCursor;
  }
  const firstLoad = !f.loaded;
  f.loaded = true;

  if (firstLoad || older || before !== JSON.stringify(f.posts)) {
    const nearBottom = isNearBottom();
    const fromBottom = $('#feed').scrollHeight - $('#feed').scrollTop;
    renderMessages();
    if (older) $('#feed').scrollTop = $('#feed').scrollHeight - fromBottom;
    else if (nearBottom || firstLoad) scrollToEnd();
  }
}

const isNearBottom = () => { const el = $('#feed'); return el.scrollHeight - el.scrollTop - el.clientHeight < 120; };
const scrollToEnd = () => { $('#feed').scrollTop = $('#feed').scrollHeight; };

// ───────── 5. 메시지 그리기 ─────────

function avatarHTML(name, size = '') {
  const i = memberIndex(name);
  const photo = imageValue(S.profiles[name]);
  const cls = `avatar ${size} ${i >= 0 ? 'm' + i : 'guest'}`;
  if (photo) return `<span class="${cls}"><img src="${photo}" alt=""></span>`;
  if (i < 0) return `<span class="${cls}">${esc(String(name).slice(0, 1))}</span>`;
  return `<span class="${cls}">${icon('person')}</span>`;
}

const nameClass = name => memberIndex(name) >= 0 ? `m${memberIndex(name)}` : 'guest';

function snippet(post) {
  if (!post) return '<i>원본 메시지가 삭제되었어요</i>';
  const text = String(post.text || '').replace(/[*_~`>|#\[\]()]/g, '').replace(/\s+/g, ' ').trim();
  return esc(text.slice(0, 90)) || '<i>사진</i>';
}

function welcomeHTML() {
  const info = CHANNELS[S.channel];
  return `<div class="welcome">
    <div class="welcome-icon">${icon(info.type === 'guestbook' ? 'chat' : 'hash')}</div>
    <h2>#${esc(info.label)}에 오신 것을 환영합니다!</h2>
    <p>#${esc(info.label)} 채널의 시작이에요. ${esc(info.welcome || '')}</p>
  </div>`;
}

function reactionsHTML(post) {
  const entries = Object.entries(post.reactions || {}).filter(([, people]) => people?.length);
  if (!entries.length) return '';
  return `<div class="reactions">${entries.map(([emoji, people]) => `
    <button class="reaction ${people.includes(S.author) ? 'mine' : ''}" data-react="${esc(emoji)}" data-tip="${esc(people.join(', '))} 님이 반응했어요" aria-pressed="${people.includes(S.author)}">
      <span class="reaction-emoji">${esc(emoji)}</span><span class="reaction-count">${people.length}</span>
    </button>`).join('')}
    <button class="reaction add" data-action="react-pick" aria-label="반응 추가" data-tip="반응 추가">${icon('smilePlus')}</button>
  </div>`;
}

function toolsHTML(post) {
  if (isGuestbook()) {
    return `<div class="msg-tools"><button data-action="delete" class="danger" data-tip="삭제" aria-label="삭제">${icon('trash')}</button></div>`;
  }
  return `<div class="msg-tools">
    <button data-action="react-pick" data-tip="반응 추가" aria-label="반응 추가">${icon('smilePlus')}</button>
    <button data-action="reply" data-tip="답장" aria-label="답장">${icon('reply')}</button>
    <button data-action="pin" data-tip="${post.pinned ? '고정 해제' : '메시지 고정'}" aria-label="${post.pinned ? '고정 해제' : '메시지 고정'}" class="${post.pinned ? 'on' : ''}">${icon('pin')}</button>
    <button data-action="edit" data-tip="수정" aria-label="수정">${icon('edit')}</button>
    <button data-action="delete" class="danger" data-tip="삭제" aria-label="삭제">${icon('trash')}</button>
  </div>`;
}

function messageHTML(post, prev) {
  const d = new Date(post.created_at);
  const guest = isGuestbook();
  const reply = !guest && post.reply_to ? findPost(post.reply_to) || {missing: true} : null;
  const compact = !reply && prev && prev.author === post.author
    && new Date(prev.created_at).toDateString() === d.toDateString()
    && d - new Date(prev.created_at) < 7 * 60 * 1000;

  let text = renderMarkdown(post.text || '');
  if (post.edited_at) {
    const mark = `<span class="edited" data-tip="${esc(fullDate(new Date(post.edited_at)))}">(수정됨)</span>`;
    text = /<\/p>\s*$/.test(text) ? text.replace(/<\/p>\s*$/, ` ${mark}</p>`) : text + mark;
  }
  const video = youtubeId(post.text || '');
  const photo = imageValue(post.image);

  const replyHTML = reply ? `
    <div class="reply-ref" ${reply.missing ? '' : `data-jump="${esc(post.reply_to)}"`}>
      ${reply.missing ? '' : avatarHTML(reply.author, 'xs')}
      ${reply.missing ? '' : `<b class="name ${nameClass(reply.author)}">${esc(reply.author)}</b>`}
      <span class="reply-text">${reply.missing ? '<i>원본 메시지가 삭제되었어요</i>' : snippet(reply)}</span>
    </div>` : '';

  const head = compact
    ? `<time class="hover-time" datetime="${esc(post.created_at)}" data-tip="${esc(fullDate(d))}">${esc(clock(d))}</time>`
    : `<button class="avatar-btn" data-profile="${esc(post.author)}" aria-label="${esc(post.author)} 프로필">${avatarHTML(post.author)}</button>`;

  const meta = compact ? '' : `
    <h3 class="msg-head">
      <button class="name ${nameClass(post.author)}" data-profile="${esc(post.author)}">${esc(post.author)}</button>
      ${guest ? '<span class="tag">방문자</span>' : ''}
      <time datetime="${esc(post.created_at)}" data-tip="${esc(fullDate(d))}">${esc(when(d))}</time>
      ${post.pinned ? `<span class="pinned-mark" data-tip="고정된 메시지">${icon('pin')}</span>` : ''}
    </h3>`;

  return `
  <article class="msg ${compact ? 'compact' : ''} ${reply ? 'has-reply' : ''} ${post.pinned ? 'pinned' : ''}" id="m-${esc(post.id)}" data-id="${esc(post.id)}">
    ${replyHTML}
    <div class="msg-row">
      <div class="msg-gutter">${head}</div>
      <div class="msg-body">
        ${meta}
        <div class="msg-text">${text}</div>
        ${photo ? `<img class="msg-photo" src="${photo}" alt="첨부 사진" data-photo loading="lazy" tabindex="0" role="button">` : ''}
        ${video ? `<div class="embed youtube">
            <div class="embed-provider">YouTube</div>
            <a class="embed-title" href="https://www.youtube.com/watch?v=${video}" target="_blank" rel="noopener noreferrer">YouTube에서 보기</a>
            <button class="yt-preview" data-video="${video}" aria-label="영상 재생"><img src="https://i.ytimg.com/vi/${video}/hqdefault.jpg" alt="" loading="lazy"><span class="yt-play">${icon('play')}</span></button>
          </div>` : ''}
        ${reactionsHTML(post)}
      </div>
    </div>
    ${toolsHTML(post)}
  </article>`;
}

function renderMessages() {
  if (S.channel === 'voice') return;
  const f = feed();
  const q = S.search.trim().toLowerCase();
  const posts = q ? f.posts.filter(p => `${p.author} ${p.text}`.toLowerCase().includes(q)) : f.posts;

  $('#load-more').hidden = !f.more || Boolean(q);
  const note = $('#search-note');
  note.hidden = !q;
  if (q) note.innerHTML = `<span>“${esc(S.search.trim())}” 검색 결과 <b>${posts.length}</b>개 · 불러온 메시지 안에서 찾았어요</span><button type="button" id="search-clear">지우기</button>`;

  let html = !f.more && !q && f.loaded ? welcomeHTML() : '';
  let lastDay = '';
  posts.forEach((post, i) => {
    const day = dayLabel(new Date(post.created_at));
    if (day !== lastDay) { html += `<div class="date-divider"><span>${esc(day)}</span></div>`; lastDay = day; }
    const prev = posts[i - 1];
    html += messageHTML(post, prev && dayLabel(new Date(prev.created_at)) === day ? prev : null);
  });
  if (q && !posts.length) html = '<div class="empty-search">검색 결과가 없어요.</div>';
  $('#messages').innerHTML = html;
}

// ───────── 6. 메시지 작성 ─────────

function resizeInput() {
  const el = $('#message-input');
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 220) + 'px';
}

function renderComposerBar() {
  const bar = $('#composer-bar');
  let html = '';
  if (isGuestbook()) {
    html = `<label class="nickname">닉네임 <input id="visitor-name" maxlength="24" placeholder="방문자" autocomplete="nickname" value="${esc(localStorage.getItem('our-room-visitor') || '')}"></label>`;
  } else if (S.editing) {
    html = `<span>메시지 수정 중 · <kbd>Esc</kbd> 로 취소</span><button type="button" class="bar-close" data-bar="cancel" aria-label="수정 취소">${icon('close')}</button>`;
  } else if (S.replyTo) {
    const target = findPost(S.replyTo);
    html = `<span><b class="name ${nameClass(target?.author)}">${esc(target?.author || '')}</b> 님에게 답장하는 중</span><button type="button" class="bar-close" data-bar="cancel" aria-label="답장 취소">${icon('close')}</button>`;
  }
  bar.innerHTML = html;
  bar.hidden = !html;
  $('.compose-box').classList.toggle('attached', Boolean(html));
}

function clearComposer() {
  delete S.drafts[S.channel];
  S.editing = null;
  S.replyTo = null;
  S.attachment = null;
  $('#message-input').value = '';
  $('#photo-file').value = '';
  resizeInput();
  showAttachment();
  renderComposerBar();
}

function showAttachment() {
  const el = $('#attachment-preview');
  el.hidden = !S.attachment;
  el.innerHTML = S.attachment
    ? `<div class="attachment-card"><img src="${S.attachment}" alt="첨부할 사진"><button type="button" id="remove-photo" class="attachment-remove" aria-label="사진 첨부 취소">${icon('trash')}</button></div>`
    : '';
}

async function readPhoto(file) {
  if (!file) return null;
  if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('PNG, JPG, WEBP, GIF 파일을 선택해 주세요.');
  if (file.size > 12 * 1024 * 1024) throw new Error('사진은 12MB 이하로 선택해 주세요.');
  const img = await createImageBitmap(file);
  const ratio = Math.min(1, 1200 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * ratio));
  canvas.height = Math.max(1, Math.round(img.height * ratio));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  img.close();
  let data = canvas.toDataURL('image/webp', .78);
  if (data.length > 400000) data = canvas.toDataURL('image/webp', .55);
  if (data.length > 400000) throw new Error('사진 크기를 줄여 다시 첨부해 주세요.');
  return data;
}

async function submitMessage() {
  if (S.saving) return;
  const channel = S.channel;
  const text = $('#message-input').value.trim();
  const guest = channel === 'guestbook';
  if (!text && !S.attachment) return;
  if (guest && !text) return toast('방명록 내용을 입력해 주세요.');

  const author = guest ? ($('#visitor-name')?.value.trim() || '방문자') : S.author;
  if (guest && (author.length > 24 || text.length > 2000)) return toast('닉네임은 24자, 방명록은 2,000자까지 입력할 수 있어요.');

  S.saving = true;
  $('#send').disabled = true;
  try {
    const rec = {author, text, kind: channel, image: guest ? null : S.attachment};
    if (S.editing) await store.edit(S.editing, rec);
    else await store.post(channel, S.replyTo ? {...rec, reply_to: S.replyTo} : rec);
    clearComposer();
    await loadChannel(false);
    scrollToEnd();
  } catch (err) {
    toast(err.message);
  } finally {
    S.saving = false;
    $('#send').disabled = false;
  }
}

function startEdit(post) {
  S.editing = post.id;
  S.replyTo = null;
  if (MEMBERS.includes(post.author)) { S.author = post.author; syncIdentity(); }
  $('#message-input').value = post.text;
  S.attachment = post.image || null;
  showAttachment();
  renderComposerBar();
  resizeInput();
  $('#message-input').focus();
}

function startReply(post) {
  S.replyTo = post.id;
  S.editing = null;
  renderComposerBar();
  $('#message-input').focus();
}

function insertAtCursor(text) {
  const el = $('#message-input');
  const start = el.selectionStart ?? el.value.length;
  el.setRangeText(text, start, el.selectionEnd ?? start, 'end');
  el.focus();
  resizeInput();
}

// ───────── 7. 메시지 동작 ─────────

async function react(postId, emoji) {
  const post = findPost(postId);
  if (!post) return;
  // 먼저 화면에 반영하고, 실패하면 되돌립니다.
  const previous = post.reactions || {};
  const people = new Set(previous[emoji] || []);
  people.has(S.author) ? people.delete(S.author) : people.add(S.author);
  const next = {...previous};
  if (people.size) next[emoji] = MEMBERS.filter(m => people.has(m)); else delete next[emoji];
  post.reactions = next;
  renderMessages();
  try {
    post.reactions = await store.react(postId, emoji, S.author);
    renderMessages();
  } catch (e) {
    post.reactions = previous;
    renderMessages();
    toast(e.message);
  }
}

async function togglePin(post) {
  try {
    await store.pin(post.id, !post.pinned);
    post.pinned = !post.pinned;
    renderMessages();
    toast(post.pinned ? '메시지를 고정했어요.' : '고정을 해제했어요.');
  } catch (e) { toast(e.message); }
}

async function deletePost(post) {
  if (!confirm('이 메시지를 삭제할까요?')) return;
  try {
    await store.remove(S.channel, post.id);
    feed().posts = feed().posts.filter(p => p.id !== post.id);
    if (S.editing === post.id || S.replyTo === post.id) clearComposer();
    renderMessages();
    await loadChannel(false);
  } catch (e) { toast(e.message); }
}

function jumpTo(id) {
  const el = document.getElementById('m-' + id);
  if (!el) return toast('이전 메시지를 불러오면 볼 수 있어요.');
  el.scrollIntoView({block: 'center', behavior: reducedMotion() ? 'auto' : 'smooth'});
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

$('#messages').addEventListener('click', e => {
  const t = e.target;
  const article = t.closest('.msg');
  const post = article && findPost(article.dataset.id);

  const spoiler = t.closest('.spoiler');
  if (spoiler) {
    e.preventDefault();
    spoiler.setAttribute('aria-expanded', String(spoiler.classList.toggle('revealed')));
    return;
  }
  const video = t.closest('[data-video]');
  if (video) {
    video.outerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${video.dataset.video}?autoplay=1" title="유튜브 영상" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    return;
  }
  if (t.closest('[data-photo]')) {
    $('#full-image').src = post.image;
    $('#image-dialog').showModal();
    return;
  }
  const jump = t.closest('[data-jump]');
  if (jump) return jumpTo(jump.dataset.jump);

  const profile = t.closest('[data-profile]');
  if (profile) return openProfileCard(profile, profile.dataset.profile);

  const reaction = t.closest('[data-react]');
  if (reaction) return react(post.id, reaction.dataset.react);

  const action = t.closest('[data-action]')?.dataset.action;
  if (action === 'react-pick') return openEmojiPicker(t.closest('[data-action]'), emoji => react(post.id, emoji));
  if (action === 'reply') return startReply(post);
  if (action === 'pin') return togglePin(post);
  if (action === 'edit') return startEdit(post);
  if (action === 'delete') return deletePost(post);

  // 휴대폰: 메시지를 누르면 도구 모음 표시
  if (article && window.matchMedia('(hover: none)').matches) {
    $$('.msg.active').forEach(m => m !== article && m.classList.remove('active'));
    article.classList.toggle('active');
  }
});

$('#messages').addEventListener('keydown', e => {
  if (e.target.matches('[data-photo], .spoiler') && ['Enter', ' '].includes(e.key)) {
    e.preventDefault();
    e.target.click();
  }
});

// ───────── 8. 사이드바·멤버 ─────────

function renderSidebar() {
  $('#server-name').textContent = CONFIG.serverName;
  $('#server-home').dataset.tip = CONFIG.serverName;
  $('#voice-label').textContent = CONFIG.voice.label;
  $('#guestbook-label').textContent = CONFIG.guestbook.label;
  $('#text-channels').innerHTML = CONFIG.channels.map(c =>
    `<button class="channel" data-channel="${esc(c.key)}">${icon('hash')}<span class="channel-label">${esc(c.label)}</span></button>`).join('');
  $('#voice-members').innerHTML = MEMBERS.map((name, i) =>
    `<div class="voice-member v${i}">${avatarHTML(name, 'sm')}<span>${esc(name)}</span><span class="voice-bars"><i></i><i></i><i></i></span></div>`).join('');
  $('#voice-tiles').innerHTML = MEMBERS.map((name, i) =>
    `<div class="voice-tile v${i}">${avatarHTML(name, 'xl')}<span class="voice-name">${esc(name)}</span></div>`).join('');
  renderMembers();
}

function renderMembers() {
  const groups = {};
  CONFIG.members.forEach(m => (groups[m.role] ||= []).push(m));
  $('#members').innerHTML = Object.entries(groups).map(([role, list]) => `
    <h3 class="members-title">${esc(role)} — ${list.length}</h3>
    ${list.map(m => `
      <button class="member" data-profile="${esc(m.name)}">
        <span class="avatar-wrap">${avatarHTML(m.name, 'sm')}<span class="status-dot"></span></span>
        <span class="member-text"><b class="name ${nameClass(m.name)}">${esc(m.name)}</b>${m.name === S.author ? '<small>지금 쓰는 중</small>' : ''}</span>
      </button>`).join('')}`).join('');
}

function syncIdentity() {
  $('#self-name').textContent = S.author;
  $('#self-avatar').outerHTML = avatarHTML(S.author).replace('class="avatar', 'id="self-avatar" class="avatar');
  $('#self-role').textContent = S.demo ? '미리보기 · 온라인' : '온라인';
  renderSidebar();
  // 사이드바를 다시 그린 뒤 선택 표시 복원
  $$('[data-channel]').forEach(b => b.classList.toggle('selected', b.dataset.channel === S.channel));
}

function setMembersOpen(open) {
  S.membersOpen = open;
  localStorage.setItem('our-room-members', open ? '1' : '0');
  $('#app').classList.toggle('members-hidden', !open);
  $('#members-toggle').setAttribute('aria-pressed', String(open));
}

function closeDrawers() { $('#app').classList.remove('nav-open', 'members-open-mobile'); }

$('#sidebar').addEventListener('click', e => {
  const ch = e.target.closest('[data-channel]');
  if (ch) return navigate(ch.dataset.channel);
  const cat = e.target.closest('.category-toggle');
  if (cat) {
    const open = cat.getAttribute('aria-expanded') !== 'true';
    cat.setAttribute('aria-expanded', String(open));
    cat.closest('[data-category]').classList.toggle('collapsed', !open);
  }
});
$('#members').addEventListener('click', e => {
  const m = e.target.closest('[data-profile]');
  if (m) openProfileCard(m, m.dataset.profile, 'left');
});
$('#server-home').onclick = () => navigate(CONFIG.channels[0].key);
$('#menu').onclick = () => $('#app').classList.toggle('nav-open');
$('#scrim').onclick = closeDrawers;
$('#members-toggle').onclick = () => {
  if (window.matchMedia('(max-width: 1000px)').matches) $('#app').classList.toggle('members-open-mobile');
  else setMembersOpen(!S.membersOpen);
};

// 검색
$('#search').addEventListener('input', e => { S.search = e.target.value; renderMessages(); });
$('#search').addEventListener('keydown', e => { if (e.key === 'Escape') { e.target.value = ''; S.search = ''; renderMessages(); } });
$('.chat').addEventListener('click', e => {
  if (e.target.id === 'search-clear') { $('#search').value = ''; S.search = ''; renderMessages(); scrollToEnd(); }
});

// ───────── 9. 팝오버 ─────────

let popoverAnchor = null;

function openPopover(anchor, html, className, side = 'below') {
  const pop = $('#popover');
  if (popoverAnchor === anchor && !pop.hidden) return closePopover();
  pop.className = 'popover ' + className;
  pop.innerHTML = html;
  pop.hidden = false;
  popoverAnchor = anchor;

  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight, pad = 8;
  let left, top;
  if (side === 'left') { left = r.left - w - pad; top = r.top; }
  else if (side === 'right') { left = r.right + pad; top = r.top; }
  else {
    // 화면 왼쪽 절반이면 왼쪽 맞춤, 오른쪽 절반이면 오른쪽 맞춤
    left = r.left + r.width / 2 < innerWidth / 2 ? r.left : r.right - w;
    top = r.bottom + pad;
    if (top + h > innerHeight - pad) top = r.top - h - pad;
  }
  left = Math.max(pad, Math.min(left, innerWidth - w - pad));
  top = Math.max(pad, Math.min(top, innerHeight - h - pad));
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
  if (!reducedMotion()) pop.animate?.([{opacity: 0, transform: 'scale(.97)'}, {opacity: 1, transform: 'none'}], {duration: 120, easing: 'ease-out'});
}

function closePopover() {
  $('#popover').hidden = true;
  popoverAnchor = null;
}

document.addEventListener('mousedown', e => {
  if (!$('#popover').hidden && !e.target.closest('#popover') && !popoverAnchor?.contains(e.target)) closePopover();
});

function openEmojiPicker(anchor, onPick) {
  openPopover(anchor, `
    <div class="emoji-head">자주 쓰는 이모지</div>
    <div class="emoji-grid">${CONFIG.emojis.map(e => `<button type="button" data-emoji="${esc(e)}" aria-label="${esc(e)}">${esc(e)}</button>`).join('')}</div>`, 'emoji-pop');
  $('#popover').onclick = e => {
    const b = e.target.closest('[data-emoji]');
    if (!b) return;
    onPick(b.dataset.emoji);
    closePopover();
  };
}

async function openPins(anchor) {
  openPopover(anchor, `<div class="pop-head">${icon('pin')}고정된 메시지</div><div class="pins-list"><div class="pins-empty">불러오는 중…</div></div>`, 'pins-pop');
  $('#popover').onclick = e => {
    const j = e.target.closest('[data-jump]');
    if (j) { closePopover(); jumpTo(j.dataset.jump); }
  };
  try {
    const pins = await store.pins(S.channel);
    pins.forEach(p => S.refs.set(p.id, p));
    const list = $('#popover .pins-list');
    if (!list) return;
    list.innerHTML = pins.length ? pins.map(p => `
      <div class="pin-item">
        ${avatarHTML(p.author, 'sm')}
        <div class="pin-body">
          <div class="pin-meta"><b class="name ${nameClass(p.author)}">${esc(p.author)}</b><time>${esc(when(new Date(p.created_at)))}</time></div>
          <div class="pin-text">${renderMarkdown(p.text || '')}${imageValue(p.image) ? '<i>사진</i>' : ''}</div>
        </div>
        <button class="btn small" data-jump="${esc(p.id)}">이동</button>
      </div>`).join('')
      : `<div class="pins-empty">${icon('pin')}<p>아직 고정된 메시지가 없어요.<br>메시지 위에 마우스를 올리고 핀 버튼을 눌러 보세요.</p></div>`;
  } catch (e) {
    const list = $('#popover .pins-list');
    if (list) list.innerHTML = `<div class="pins-empty">${esc(e.message)}</div>`;
  }
}

function openProfileCard(anchor, name, side = 'right') {
  const member = CONFIG.members.find(m => m.name === name);
  const guest = !member;
  const count = Object.values(S.feeds).flatMap(f => f.posts).filter(p => p.author === name).length;
  openPopover(anchor, `
    <div class="card-banner ${nameClass(name)}"></div>
    <div class="card-avatar"><span class="avatar-wrap">${avatarHTML(name, 'lg')}${guest ? '' : '<span class="status-dot"></span>'}</span></div>
    <div class="card-body">
      <h3>${esc(name)}</h3>
      <p class="card-sub">${guest ? '방명록 방문자' : esc(CONFIG.serverName)}</p>
      <div class="card-section">
        <h4>${guest ? '정보' : '역할'}</h4>
        ${guest ? '<p>방명록에 글을 남긴 방문자예요.</p>' : `<span class="role-pill"><i class="role-dot ${nameClass(name)}"></i>${esc(member.role)}</span>`}
      </div>
      ${guest ? '' : `<div class="card-section"><h4>불러온 메시지</h4><p>${count}개</p></div>`}
      ${guest || name === S.author ? '' : `<button class="btn primary wide" data-switch-to="${esc(name)}">${esc(name)}(으)로 전환</button>`}
    </div>`, 'profile-pop', side);
  $('#popover').onclick = e => {
    const sw = e.target.closest('[data-switch-to]');
    if (sw) { switchAuthor(sw.dataset.switchTo); closePopover(); }
  };
}

$('#pins-open').onclick = e => openPins(e.currentTarget);
$('#emoji-open').onclick = e => openEmojiPicker(e.currentTarget, insertAtCursor);

// 툴팁 (data-tip)
let tipTarget = null;
document.addEventListener('mouseover', e => {
  const t = e.target.closest('[data-tip]');
  if (t === tipTarget) return;
  tipTarget = t;
  const tip = $('#tooltip');
  if (!t || window.matchMedia('(hover: none)').matches) { tip.hidden = true; return; }
  tip.textContent = t.dataset.tip;
  tip.hidden = false;
  const r = t.getBoundingClientRect();
  const server = t.closest('.servers');
  let left = server ? r.right + 12 : r.left + r.width / 2 - tip.offsetWidth / 2;
  let top = server ? r.top + r.height / 2 - tip.offsetHeight / 2 : r.top - tip.offsetHeight - 8;
  if (top < 4) top = r.bottom + 8;
  tip.classList.toggle('right', Boolean(server));
  tip.style.left = Math.max(4, Math.min(left, innerWidth - tip.offsetWidth - 4)) + 'px';
  tip.style.top = top + 'px';
});
document.addEventListener('scroll', () => { $('#tooltip').hidden = true; tipTarget = null; }, true);

// ───────── 10. 프로필 ─────────

function applyProfiles(list) {
  const before = JSON.stringify(S.profiles);
  S.profiles = Object.fromEntries(MEMBERS.map(n => [n, null]));
  for (const p of list) if (MEMBERS.includes(p.name)) S.profiles[p.name] = imageValue(p.avatar);
  if (before !== JSON.stringify(S.profiles)) { syncIdentity(); renderMessages(); }
}

function switchAuthor(name) {
  if (!MEMBERS.includes(name)) return;
  S.author = name;
  localStorage.setItem('our-room-name', name);
  syncIdentity();
  renderMessages();
  if ($('#author-picker').open) $('#author-picker').close();
  if (!reducedMotion()) $('.user-chip').animate?.([{opacity: .4, transform: 'translateY(3px)'}, {opacity: 1, transform: 'none'}], {duration: 200});
  toast(`${name}(으)로 전환했어요.`);
}

function openPicker() {
  $('#author-options').innerHTML = MEMBERS.map(n => `
    <button class="author-option ${S.author === n ? 'active' : ''}" data-pick-author="${esc(n)}" aria-pressed="${S.author === n}">
      ${avatarHTML(n)}<b class="name ${nameClass(n)}">${esc(n)}</b>${S.author === n ? `<span class="check">${icon('check')}</span>` : ''}
    </button>`).join('');
  $('#author-picker').showModal();
}
$('#author-options').onclick = e => { const b = e.target.closest('[data-pick-author]'); if (b) switchAuthor(b.dataset.pickAuthor); };

let profileDraft = null;
async function readAvatar(file) {
  if (!file) return null;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('5MB 이하의 PNG, JPG, WEBP 사진을 선택해 주세요.');
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  canvas.getContext('2d').drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 256, 256);
  bitmap.close();
  const data = canvas.toDataURL('image/webp', .85);
  if (data.length > 200000) throw new Error('더 작은 사진을 선택해 주세요.');
  return data;
}

function openProfileSettings() {
  if ($('#author-picker').open) $('#author-picker').close();
  profileDraft = {...S.profiles};
  const preview = n => profileDraft[n] ? `<span class="avatar lg ${nameClass(n)}"><img src="${profileDraft[n]}" alt=""></span>` : `<span class="avatar lg ${nameClass(n)}">${icon('person')}</span>`;
  const draw = () => {
    $('#profile-fields').innerHTML = MEMBERS.map(n => `
      <div class="profile-row">
        ${preview(n)}
        <div class="profile-row-text"><b class="name ${nameClass(n)}">${esc(n)}</b>
          <div class="photo-actions">
            <label class="btn small">사진 변경<input type="file" data-upload-profile="${esc(n)}" accept="image/png,image/jpeg,image/webp" hidden></label>
            <button type="button" class="btn small ghost" data-remove-profile="${esc(n)}">삭제</button>
          </div>
        </div>
      </div>`).join('');
  };
  draw();
  $('#profile-fields').onchange = async e => {
    const input = e.target.closest('[data-upload-profile]');
    if (!input) return;
    try { const data = await readAvatar(input.files[0]); if (data) { profileDraft[input.dataset.uploadProfile] = data; draw(); } }
    catch (err) { toast(err.message); }
  };
  $('#profile-fields').onclick = e => {
    const rm = e.target.closest('[data-remove-profile]');
    if (rm) { profileDraft[rm.dataset.removeProfile] = null; draw(); }
  };
  $('#profile-settings').showModal();
}

$('#profile-form').onsubmit = async e => {
  e.preventDefault();
  $('#profile-save').disabled = true;
  try {
    await store.saveProfiles(profileDraft);
    S.profiles = {...profileDraft};
    syncIdentity();
    renderMessages();
    $('#profile-settings').close();
    toast('프로필 사진을 저장했어요.');
  } catch (err) { toast(err.message); }
  finally { $('#profile-save').disabled = false; }
};

$('#profile-switch').onclick = openPicker;
$('#profile-switch-2').onclick = openPicker;
$('#profile-settings-open').onclick = openProfileSettings;
$('#picker-settings').onclick = openProfileSettings;
$$('[data-close]').forEach(b => b.addEventListener('click', () => $('#' + b.dataset.close).close()));
$$('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));

// ───────── 11. 음성 연출 ─────────

$('#voice-toggle').onclick = () => {
  const paused = document.body.classList.toggle('voice-paused');
  $('#voice-toggle').setAttribute('aria-pressed', String(paused));
  $('#voice-toggle').innerHTML = `${icon(paused ? 'play' : 'pause')}<span>${paused ? '애니메이션 재생' : '애니메이션 멈추기'}</span>`;
};

// ───────── 작성창 이벤트 ─────────

$('#composer').onsubmit = e => { e.preventDefault(); submitMessage(); };
$('#message-input').addEventListener('input', resizeInput);
$('#message-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submitMessage(); }
  if (e.key === 'Escape' && (S.editing || S.replyTo)) { e.preventDefault(); clearComposer(); }
  // ↑: 빈 입력창에서 내 마지막 메시지 수정 (디스코드와 같아요)
  if (e.key === 'ArrowUp' && !e.target.value && !isGuestbook()) {
    const mine = [...feed().posts].reverse().find(p => p.author === S.author);
    if (mine) { e.preventDefault(); startEdit(mine); }
  }
});
$('#composer-bar').addEventListener('click', e => { if (e.target.closest('[data-bar="cancel"]')) clearComposer(); });
$('#composer-bar').addEventListener('input', e => {
  if (e.target.id === 'visitor-name') localStorage.setItem('our-room-visitor', e.target.value);
});
$('#attach').onclick = () => $('#photo-file').click();
$('#photo-file').onchange = async e => {
  try { S.attachment = await readPhoto(e.target.files[0]); showAttachment(); }
  catch (err) { toast(err.message); }
};
$('#attachment-preview').addEventListener('click', e => {
  if (e.target.closest('#remove-photo')) { S.attachment = null; $('#photo-file').value = ''; showAttachment(); }
});
$('#load-more').onclick = async () => {
  $('#load-more').disabled = true;
  try { await loadChannel(true); } catch (e) { toast(e.message); }
  finally { $('#load-more').disabled = false; }
};
$('#guest-link').onclick = async () => {
  if (S.demo) return toast('실제 배포 후 방명록 주소를 공유할 수 있어요.');
  const url = new URL(location.href);
  url.hash = 'guestbook';
  url.search = '';
  try { await navigator.clipboard.writeText(url.href); toast('방명록 주소를 복사했어요.'); }
  catch { toast('주소 끝에 #guestbook을 붙여 공유해 주세요.'); }
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePopover(); closeDrawers(); }
  // Ctrl/⌘ + K: 검색
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#search').focus(); }
});
window.addEventListener('hashchange', () => { if (location.hash === '#guestbook') navigate('guestbook'); });
window.addEventListener('resize', closePopover);

// ───────── 12. 시작 ─────────

function applyMemberColors() {
  CONFIG.members.forEach((m, i) => document.documentElement.style.setProperty(`--m${i}`, m.color));
}

async function init() {
  fillIcons();
  applyMemberColors();
  setMembersOpen(S.membersOpen);
  syncIdentity();

  const wantsDemo = location.protocol === 'file:' || new URLSearchParams(location.search).has('demo');
  try {
    if (!wantsDemo) {
      const config = await api('config');
      if (!config.configured) S.demo = true;
    }
  } catch (e) {
    $('#status').textContent = e.message;
  }
  if (wantsDemo) S.demo = true;
  store = S.demo ? demo : remote;
  if (S.demo) $('#status').textContent = '미리보기 모드 · 메시지는 이 브라우저에만 저장돼요';

  try { applyProfiles(await store.loadProfiles()); } catch {}
  syncIdentity();
  await navigate(location.hash === '#guestbook' ? 'guestbook' : CONFIG.channels[0].key);
}

// 10초마다 새 메시지, 30초마다 프로필 확인
setInterval(() => {
  if (!S.demo && S.channel !== 'voice' && !document.hidden && !S.saving) {
    loadChannel(false).then(() => { $('#status').textContent = ''; }).catch(() => { $('#status').textContent = '연결이 끊겼어요. 새로고침해 주세요.'; });
  }
}, 10000);
setInterval(() => {
  if (!S.demo && !document.hidden && !$('#profile-settings').open) store.loadProfiles().then(applyProfiles).catch(() => {});
}, 30000);

// 미리보기: 다른 탭에서 바뀌면 반영
window.addEventListener('storage', e => {
  if (!S.demo) return;
  if (e.key === DEMO_KEY) loadChannel(false).catch(() => {});
  if (e.key === 'our-room-profiles-v1') store.loadProfiles().then(applyProfiles);
});

// 브라우저 AI 도구용: 작성창에 초안만 넣고 보내지는 않아요.
if (document.modelContext?.registerTool) {
  const life = new AbortController();
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'stage_message',
      title: '메시지 초안',
      description: '텍스트 채널 작성창에 초안을 넣습니다. 전송하지 않습니다.',
      inputSchema: {
        type: 'object',
        properties: {
          channel: {type: 'string', enum: CONFIG.channels.map(c => c.key)},
          author: {type: 'string', enum: MEMBERS},
          text: {type: 'string', maxLength: 5000},
        },
        required: ['channel', 'author', 'text'],
        additionalProperties: false,
      },
      annotations: {readOnlyHint: false, untrustedContentHint: false},
      async execute(input) {
        if (!CHANNELS[input.channel] || !MEMBERS.includes(input.author) || typeof input.text !== 'string' || input.text.length > 5000) throw new Error('입력을 확인해 주세요.');
        if ($('#message-input').value || S.attachment || S.editing) throw new Error('작성 중인 내용을 먼저 저장해 주세요.');
        await navigate(input.channel);
        S.author = input.author;
        syncIdentity();
        $('#message-input').value = input.text;
        return {staged: true, sent: false};
      },
    }, {signal: life.signal})).catch(() => {});
    window.addEventListener('pagehide', () => life.abort(), {once: true});
  } catch {}
}

init();
