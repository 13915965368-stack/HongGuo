// 多会话本地存储（纯 localStorage，不动后端）
// 数据结构：
//   hongguo_sessions       → [{id, title, cozeSessionId, createdAt, updatedAt}]
//   hongguo_msgs_<id>      → [{id, role, text, error}]（沿用原消息结构）
//   hongguo_current_session → 当前会话 id
// 每个会话持有独立 cozeSessionId，保证扣子侧多轮上下文按会话隔离。

const SESSIONS_KEY = 'hongguo_sessions';
const CURRENT_KEY = 'hongguo_current_session';
const LEGACY_COZE_KEY = 'coze_session_id'; // 单会话时代的旧 key，首次启动迁移

const msgsKey = (id) => `hongguo_msgs_${id}`;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadSessions() {
  return readJSON(SESSIONS_KEY, []);
}

function saveSessions(list) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
}

export function loadMessages(sessionId) {
  return readJSON(msgsKey(sessionId), []);
}

// 凭证打码：学号密码属于敏感信息，持久化到 localStorage 前把疑似凭证的用户消息
// 替换为占位文本。运行时界面显示不受影响，仅存档被净化。
// 命中规则：①「学号+密码」同条裸发（数字串 + 密文）②「密码: xxx」句式
//          ③ 同学号又同密码且含 6 位以上数字串（如「学号xxx，密码yyy」）
function looksLikeCredential(text) {
  if (/^\s*\d{6,10}\s+\S{3,}\s*$/.test(text)) return true;
  if (/密码\s*[:：]\s*\S{3,}/.test(text)) return true;
  if (/学号/.test(text) && /密码/.test(text) && /\d{6,}/.test(text)) return true;
  return false;
}

const CREDENTIAL_PLACEHOLDER = '[已隐藏] 登录凭证（为保护安全，不在本地留存）';

export function saveMessages(sessionId, messages) {
  const safe = messages.map((m) =>
    m.role === 'user' && m.text && looksLikeCredential(m.text)
      ? { ...m, text: CREDENTIAL_PLACEHOLDER }
      : m
  );
  localStorage.setItem(msgsKey(sessionId), JSON.stringify(safe));
}

export function getCurrentId() {
  return localStorage.getItem(CURRENT_KEY);
}

export function setCurrentId(id) {
  localStorage.setItem(CURRENT_KEY, id);
}

// 新建会话；首个会话会接管旧版单会话的 coze_session_id，保住改造前的上下文
export function createSession() {
  const sessions = loadSessions();
  const legacy = sessions.length === 0 ? localStorage.getItem(LEGACY_COZE_KEY) : null;
  const session = {
    id: crypto.randomUUID(),
    title: '新对话',
    cozeSessionId: legacy || crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveSessions([session, ...sessions]);
  if (legacy) localStorage.removeItem(LEGACY_COZE_KEY);
  return session;
}

// 会话有动静（新消息）后更新标题与活跃时间，并把它顶到列表最前
export function touchSession(id, firstUserText) {
  const sessions = loadSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return;
  const session = { ...sessions[idx], updatedAt: Date.now() };
  if (session.title === '新对话' && firstUserText) {
    session.title = firstUserText.length > 20 ? `${firstUserText.slice(0, 20)}…` : firstUserText;
  }
  sessions.splice(idx, 1);
  saveSessions([session, ...sessions]);
}

// 保证至少存在一个会话并返回当前会话（应用启动时调用）
export function ensureCurrentSession() {
  let sessions = loadSessions();
  if (sessions.length === 0) {
    const session = createSession();
    setCurrentId(session.id);
    return session;
  }
  const currentId = getCurrentId();
  const current = sessions.find((s) => s.id === currentId);
  if (current) return current;
  setCurrentId(sessions[0].id);
  return sessions[0];
}

// 相对活跃时间（侧栏展示用）：扣子侧会话/登录态有时效，让用户看出会话是否凉了
export function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  return d === 1 ? '昨天' : `${d} 天前`;
}
