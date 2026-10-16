// 단칸방 API — Vercel 서버리스 함수 하나로 모든 요청을 처리합니다.
// 요청 형식: /api/index?action=<이름>
//
//   GET  config          서버 설정 상태
//   GET  session         일기 잠금 상태
//   POST unlock          비밀번호로 일기 열기
//   POST lock            일기 다시 잠그기
//   POST password_change 비밀번호 바꾸기
//   GET  list            채널 메시지 (channel, before)
//   GET  pins            채널 고정 메시지 (channel)
//   POST post            메시지 작성
//   POST edit            메시지 수정
//   POST delete          메시지 삭제
//   POST react           반응 이모지 토글
//   POST pin             고정 / 고정 해제
//   GET  guest_list      방명록 목록 (before)
//   POST guest_post      방명록 작성
//   POST guest_delete    방명록 삭제
//   GET  profiles_get    프로필 사진
//   POST profiles_save   프로필 사진 저장

import {createHash, createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual} from 'node:crypto';

// ───────── 설정 ─────────

const MEMBERS = ['건호', '주훈'];

// 텍스트 채널 → 그 채널에 들어가는 메시지 종류(kind)
// 채널을 추가하려면 여기와 public/config.js 두 곳에 같은 키를 넣으세요.
const CHANNEL_KINDS = {
  diary: ['diary', 'photo', 'quote'],
  music: ['music'],
};
const ALL_KINDS = [...new Set(Object.values(CHANNEL_KINDS).flat())];

// 비밀번호를 풀어야 볼 수 있는 채널 (public/config.js 의 locked 와 같게)
const LOCKED_CHANNELS = new Set(['diary']);
const LOCKED_KINDS = new Set([...LOCKED_CHANNELS].flatMap(c => CHANNEL_KINDS[c]));
const SESSION_DAYS = 7;

const PAGE_SIZE = 8;
const GUEST_PAGE_SIZE = 30;
const REACTION_MAX = 20;          // 메시지 하나에 달 수 있는 이모지 종류 수
const MAX_BODY_BYTES = 1_000_000;

// 사용자에게 그대로 보여 줘도 되는 오류
class UserError extends Error {}
// 비밀번호가 필요한 요청
class LockedError extends Error {}

// ───────── Supabase ─────────

const env = () => ({url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY});
const isConfigured = e => Boolean(e.url && e.key);

async function db(path, options = {}) {
  const e = env();
  const response = await fetch(`${e.url.replace(/\/$/, '')}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: e.key,
      Authorization: `Bearer ${e.key}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    // 새 기능(답장·반응·고정)용 열이 아직 없을 때
    if (/reply_to|reactions|pinned|room_settings/.test(detail)) {
      throw new UserError('데이터베이스 업데이트가 필요해요. README의 "업데이트" 항목을 확인해 주세요.');
    }
    throw new UserError('공유 저장소에 연결하지 못했어요. 설정을 확인해 주세요.');
  }
  const raw = await response.text();
  return raw ? JSON.parse(raw) : null;
}

// ───────── 입력 검사 ─────────

function checkImage(value) {
  if (value === null || value === undefined) return null;
  const ok = typeof value === 'string' && value.length <= 400000
    && /^data:image\/(png|webp|jpeg|gif);base64,[A-Za-z0-9+/=]+$/.test(value);
  if (!ok) throw new UserError('지원하지 않거나 너무 큰 이미지예요.');
  return value;
}

function checkId(value) {
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value || '')) {
    throw new UserError('기록을 찾을 수 없어요.');
  }
  return value;
}

function checkMember(value) {
  if (!MEMBERS.includes(value)) throw new UserError('작성자를 확인해 주세요.');
  return value;
}

function checkChannel(value) {
  if (!CHANNEL_KINDS[value]) throw new UserError('채널을 확인해 주세요.');
  return value;
}

function checkEmoji(value) {
  // 이모지 한 개(조합 이모지 포함), 최대 16글자
  if (typeof value !== 'string' || !value || value.length > 16 || /[\s<>"'&]/.test(value)
    || !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(value)) {
    throw new UserError('이모지를 확인해 주세요.');
  }
  return value;
}

// 작성·수정 공통 내용
function messageContent(body) {
  if (!ALL_KINDS.includes(body.kind) || typeof body.text !== 'string' || body.text.length > 5000) {
    throw new UserError('기록 형식을 확인해 주세요.');
  }
  const row = {
    author: checkMember(body.author),
    kind: body.kind,
    text: body.text.trim(),
    image: checkImage(body.image),
  };
  if (!row.text && !row.image) throw new UserError('내용이나 사진을 넣어 주세요.');
  return row;
}

function beforeFilter(req) {
  const before = query(req, 'before');
  if (!before) return '';
  if (!/^\d{4}-\d{2}-\d{2}T/.test(before) || Number.isNaN(Date.parse(before))) {
    throw new UserError('날짜 형식을 확인해 주세요.');
  }
  return `&created_at=lt.${encodeURIComponent(before)}`;
}

const kindFilter = channel => `&kind=in.(${CHANNEL_KINDS[checkChannel(channel)].join(',')})`;

// ───────── 비밀번호 잠금 ─────────
// 비밀번호는 사이트에서 바꾼 값(DB의 room_settings)이 우선이고,
// 없으면 Vercel 환경변수 ROOM_PASSWORD 를 씁니다.
// 비밀번호가 바뀌면 모든 기기의 잠금 해제가 풀립니다.

const sha256 = value => createHash('sha256').update(String(value)).digest();

function hashPassword(password) {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString('hex')}$${scryptSync(password, salt, 32).toString('hex')}`;
}

function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(part => {
    const i = part.indexOf('=');
    return i < 0 ? [part.trim(), ''] : [part.slice(0, i).trim(), decodeURIComponent(part.slice(i + 1).trim())];
  }));
}

function makeAuth(req, res, e) {
  let stored;
  const secret = process.env.SESSION_SECRET || createHmac('sha256', e.key).update('room-session').digest('hex');

  // 사이트에서 바꾼 비밀번호 (테이블이 없거나 아직 안 바꿨으면 null)
  async function savedHash() {
    if (stored === undefined) {
      try { stored = (await db('room_settings?select=value&key=eq.diary_password'))[0]?.value || null; }
      catch { stored = null; }
    }
    return stored;
  }

  async function fingerprint() {
    const hash = await savedHash();
    const source = hash || process.env.ROOM_PASSWORD;
    return source ? sha256('fp:' + source).toString('hex').slice(0, 16) : null;
  }

  const sign = value => createHmac('sha256', secret).update(value).digest('base64url');

  async function setCookie() {
    const exp = Date.now() + SESSION_DAYS * 86400000;
    const body = `${exp}.${await fingerprint()}`;
    res.setHeader('Set-Cookie', `room_session=${body}.${sign(body)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`);
  }

  return {
    async passwordSet() { return Boolean(await fingerprint()); },

    async unlocked() {
      const token = cookies(req).room_session || '';
      const [exp, fp, sig] = token.split('.');
      if (!exp || !fp || !sig) return false;
      const expected = sign(`${exp}.${fp}`);
      if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
      return Number(exp) > Date.now() && fp === await fingerprint();
    },

    // 비밀번호가 아직 없으면 예전처럼 열어 둡니다 (일기가 갑자기 안 보이는 일이 없도록).
    // Vercel에 ROOM_PASSWORD를 넣는 순간부터 잠깁니다.
    async require() {
      if (!await this.passwordSet()) return;
      if (!await this.unlocked()) throw new LockedError();
    },

    async verify(password) {
      if (typeof password !== 'string' || !password || password.length > 200) return false;
      const hash = await savedHash();
      if (hash) {
        const [, salt, digest] = hash.split('$');
        const actual = scryptSync(password, Buffer.from(salt, 'hex'), 32);
        return timingSafeEqual(actual, Buffer.from(digest, 'hex'));
      }
      const env = process.env.ROOM_PASSWORD;
      return Boolean(env) && timingSafeEqual(sha256(password), sha256(env));
    },

    setCookie,
    clearCookie() { res.setHeader('Set-Cookie', 'room_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'); },

    async savePassword(next) {
      const value = hashPassword(next);
      await db('room_settings?on_conflict=key', {
        method: 'POST',
        headers: {Prefer: 'resolution=merge-duplicates'},
        body: JSON.stringify([{key: 'diary_password', value}]),
      });
      stored = value;
    },
  };
}

async function unlock(req, body, e, auth) {
  if (!await auth.passwordSet()) throw new UserError('아직 비밀번호가 정해지지 않았어요. README의 "비밀번호" 항목을 확인해 주세요.');
  if (!await rateAllowed(req, e, 'unlock')) return [429, {error: '시도가 너무 많아요. 15분 후 다시 시도해 주세요.'}];
  if (!await auth.verify(body.password)) return [403, {error: '비밀번호가 맞지 않아요.'}];
  await auth.setCookie();
  return [200, {unlocked: true}];
}

async function changePassword(req, body, e, auth) {
  if (!await rateAllowed(req, e, 'unlock')) return [429, {error: '시도가 너무 많아요. 15분 후 다시 시도해 주세요.'}];
  // 처음 비밀번호는 Vercel 환경변수로만 정할 수 있어요 (아무나 먼저 정하지 못하게).
  if (!await auth.passwordSet()) throw new UserError('먼저 Vercel 환경변수 ROOM_PASSWORD 로 첫 비밀번호를 정해 주세요.');
  if (!await auth.verify(body.current)) return [403, {error: '지금 비밀번호가 맞지 않아요.'}];
  if (typeof body.next !== 'string' || body.next.length < 4 || body.next.length > 72) {
    throw new UserError('새 비밀번호는 4~72자로 정해 주세요.');
  }
  try { await auth.savePassword(body.next); }
  catch { throw new UserError('데이터베이스 업데이트가 필요해요. README의 "업데이트" 항목을 확인해 주세요.'); }
  await auth.setCookie();
  return [200, {ok: true}];
}

// 메시지 id → 잠긴 채널의 메시지인지
async function guardMessage(id, auth) {
  const [row] = await db(`room_messages?select=kind&id=eq.${checkId(id)}`);
  if (!row) throw new UserError('기록을 찾을 수 없어요.');
  if (LOCKED_KINDS.has(row.kind)) await auth.require();
}

async function guardChannel(channel, auth) {
  if (LOCKED_CHANNELS.has(checkChannel(channel))) await auth.require();
}

// ───────── 목록 ─────────

async function listMessages(req, body, auth) {
  const channel = query(req, 'channel') || 'diary';
  await guardChannel(channel, auth);
  const rows = await db(`room_messages?select=*&order=created_at.desc,id.desc&limit=${PAGE_SIZE + 1}${kindFilter(channel)}${beforeFilter(req)}`);
  const posts = rows.slice(0, PAGE_SIZE);

  // 답장 원본이 이번 페이지에 없으면 따로 가져옵니다.
  const loaded = new Set(posts.map(p => p.id));
  const missing = [...new Set(posts.map(p => p.reply_to).filter(id => id && !loaded.has(id)))];
  const refs = missing.length
    ? await db(`room_messages?select=id,author,text,image&id=in.(${missing.join(',')})${kindFilter(channel)}`)
    : [];

  return {
    posts: posts.reverse(),
    refs,
    more: rows.length > PAGE_SIZE,
    nextCursor: posts.at(-1)?.created_at || null,
  };
}

async function listGuests(req) {
  const rows = await db(`room_guest_messages?select=*&order=created_at.desc,id.desc&limit=${GUEST_PAGE_SIZE + 1}${beforeFilter(req)}`);
  const posts = rows.slice(0, GUEST_PAGE_SIZE);
  return {
    posts: posts.reverse(),
    refs: [],
    more: rows.length > GUEST_PAGE_SIZE,
    nextCursor: posts.at(-1)?.created_at || null,
  };
}

async function listPins(req, body, auth) {
  const channel = query(req, 'channel') || 'diary';
  await guardChannel(channel, auth);
  const posts = await db(`room_messages?select=*&pinned=is.true&order=created_at.desc&limit=50${kindFilter(channel)}`);
  return {posts};
}

// ───────── 작성 ─────────

async function createMessage(body, auth) {
  const row = {...messageContent(body), id: randomUUID()};
  if (LOCKED_KINDS.has(row.kind)) await auth.require();
  if (body.reply_to) row.reply_to = checkId(body.reply_to);
  const rows = await db('room_messages', {
    method: 'POST',
    headers: {Prefer: 'return=representation'},
    body: JSON.stringify(row),
  });
  return {post: rows[0]};
}

async function editMessage(body, auth) {
  await guardMessage(body.id, auth);
  if (LOCKED_KINDS.has(body.kind)) await auth.require();
  // 답장·반응·고정은 그대로 두고 내용만 바꿉니다.
  await db(`room_messages?id=eq.${checkId(body.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({...messageContent(body), edited_at: new Date().toISOString()}),
  }).catch(async error => {
    // edited_at 열이 없는 이전 DB에서도 수정은 되게 합니다.
    if (!(error instanceof UserError)) throw error;
    await db(`room_messages?id=eq.${body.id}`, {method: 'PATCH', body: JSON.stringify(messageContent(body))});
  });
  return {ok: true};
}

async function toggleReaction(body, auth) {
  const id = checkId(body.id);
  await guardMessage(id, auth);
  const emoji = checkEmoji(body.emoji);
  const member = checkMember(body.author);

  const [row] = await db(`room_messages?select=reactions&id=eq.${id}`);
  if (!row) throw new UserError('기록을 찾을 수 없어요.');

  const reactions = {...(row.reactions || {})};
  const people = new Set(reactions[emoji] || []);
  people.has(member) ? people.delete(member) : people.add(member);
  if (people.size) reactions[emoji] = MEMBERS.filter(m => people.has(m));
  else delete reactions[emoji];
  if (Object.keys(reactions).length > REACTION_MAX) throw new UserError('반응이 너무 많아요.');

  await db(`room_messages?id=eq.${id}`, {method: 'PATCH', body: JSON.stringify({reactions})});
  return {reactions};
}

async function setPinned(body, auth) {
  await guardMessage(body.id, auth);
  await db(`room_messages?id=eq.${checkId(body.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({pinned: Boolean(body.pinned)}),
  });
  return {ok: true};
}

async function createGuest(req, body, e) {
  const author = typeof body.author === 'string' ? body.author.trim() : '';
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (author.length < 1 || author.length > 24 || !text || body.text.length > 2000) {
    throw new UserError('닉네임은 24자, 방명록은 2,000자까지 입력할 수 있어요.');
  }
  if (!await rateAllowed(req, e, 'guest')) return [429, {error: '작성 횟수가 많아요. 15분 후 다시 시도해 주세요.'}];
  const rows = await db('room_guest_messages', {
    method: 'POST',
    headers: {Prefer: 'return=representation'},
    body: JSON.stringify({id: randomUUID(), author, text}),
  });
  return [200, {post: rows[0]}];
}

async function saveProfiles(body) {
  const list = body.profiles;
  if (!Array.isArray(list) || list.length !== MEMBERS.length || new Set(list.map(p => p.name)).size !== MEMBERS.length) {
    throw new UserError('프로필 형식을 확인해 주세요.');
  }
  const rows = list.map(p => {
    if (!MEMBERS.includes(p.name) || (p.avatar && p.avatar.length > 200000)) throw new UserError('프로필 형식을 확인해 주세요.');
    return {name: p.name, avatar: checkImage(p.avatar)};
  });
  await db('room_member_profiles?on_conflict=name', {
    method: 'POST',
    headers: {Prefer: 'resolution=merge-duplicates'},
    body: JSON.stringify(rows),
  });
  return {ok: true};
}

// ───────── 작성 제한 (IP당 15분 10회) ─────────

async function rateAllowed(req, e, scope) {
  const ip = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const key = createHmac('sha256', e.key).update(scope + ':' + String(ip).split(',')[0]).digest('hex');
  return db('rpc/room_login_attempt', {method: 'POST', body: JSON.stringify({p_key: key})});
}

// ───────── 요청 처리 ─────────

function query(req, name) {
  return req.query?.[name] ?? new URL(req.url, 'http://localhost').searchParams.get(name);
}

const ROUTES = {
  'GET list': listMessages,
  'GET pins': listPins,
  'GET guest_list': listGuests,
  'GET session': async (req, body, auth) => { const passwordSet = await auth.passwordSet(); return {passwordSet, unlocked: !passwordSet || await auth.unlocked()}; },
  'GET profiles_get': async () => ({profiles: await db('room_member_profiles?select=name,avatar')}),
  'POST post': (req, body, auth) => createMessage(body, auth),
  'POST edit': (req, body, auth) => editMessage(body, auth),
  'POST delete': async (req, body, auth) => { await guardMessage(body.id, auth); await db(`room_messages?id=eq.${checkId(body.id)}`, {method: 'DELETE'}); return {ok: true}; },
  'POST guest_delete': async (req, body) => { await db(`room_guest_messages?id=eq.${checkId(body.id)}`, {method: 'DELETE'}); return {ok: true}; },
  'POST react': (req, body, auth) => toggleReaction(body, auth),
  'POST pin': (req, body, auth) => setPinned(body, auth),
  'POST lock': async (req, body, auth) => { auth.clearCookie(); return {ok: true}; },
  'POST profiles_save': (req, body) => saveProfiles(body),
};

// 반응·고정은 자주 누르는 버튼이라 작성 제한에서 뺍니다.
const UNLIMITED_POSTS = new Set(['guest_post', 'react', 'pin', 'unlock', 'lock', 'password_change']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const send = (status, data) => res.status(status).json(data);

  try {
    const e = env();
    const action = query(req, 'action');

    if (req.method === 'GET' && action === 'config') {
      return send(200, {configured: isConfigured(e), public: true});
    }
    if (!isConfigured(e)) return send(503, {error: 'Supabase 연결 설정이 필요해요.'});

    if (req.method !== 'GET') {
      // 다른 사이트에서 온 쓰기 요청 차단
      const origin = req.headers.origin;
      if (origin) {
        let sameSite = false;
        try { sameSite = new URL(origin).host === req.headers.host; } catch {}
        if (!sameSite) return send(403, {error: '사이트에서 다시 시도해 주세요.'});
      }
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
        return send(415, {error: '지원하지 않는 요청이에요.'});
      }
    }

    const auth = makeAuth(req, res, e);

    // 잠금을 푼 두 사람은 작성 제한 없이, 그 외에는 IP당 15분 10회
    if (req.method === 'POST' && !UNLIMITED_POSTS.has(action) && !await auth.unlocked() && !await rateAllowed(req, e, 'public-write')) {
      return send(429, {error: '작성 횟수가 많아요. 15분 후 다시 시도해 주세요.'});
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES) return send(413, {error: '첨부 파일 크기를 줄여 주세요.'});

    const special = {guest_post: createGuest, unlock, password_change: changePassword}[action];
    if (req.method === 'POST' && special) {
      const [status, data] = await special(req, body, e, auth);
      return send(status, data);
    }

    const route = ROUTES[`${req.method} ${action}`];
    if (!route) return send(405, {error: '지원하지 않는 요청이에요.'});
    return send(200, await route(req, body, auth));
  } catch (error) {
    if (error instanceof LockedError) return send(401, {error: '일기는 비밀번호를 입력해야 볼 수 있어요.', locked: true});
    return send(400, {
      error: error instanceof UserError ? error.message : '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
    });
  }
}
