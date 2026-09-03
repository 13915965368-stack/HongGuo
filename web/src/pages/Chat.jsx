import { Children, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Nav from '../components/Nav.jsx';
import Sidebar from '../components/Sidebar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PromptPanel from '../components/PromptPanel.jsx';
import {
  ensureCurrentSession,
  loadSessions,
  createSession,
  setCurrentId,
  loadMessages,
  saveMessages,
  touchSession,
} from '../lib/sessions.js';
import { getDeviceId } from '../lib/device.js';
import '../Chat.css';

// 输入净化：清除模型输出中泄漏的内部标签（</think_xxx> 等）
function sanitizeText(text) {
  return text
    .replace(/<think[^>]*>[\s\S]*?<\/think[^>]*>/gi, '')
    .replace(/<\/?think[^>]*>/gi, '');
}

// Markdown 自定义渲染：
// - 链接一律新窗口打开
// - 独立成段的链接（如互助墙「点击进入」）渲染为 3px 黑框链接块，不再是孤零零一行红字
const mdComponents = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
  p: ({ node, children, ...props }) => {
    const kids = Children.toArray(children);
    if (kids.length === 1 && kids[0]?.props?.href) {
      return (
        <p className="link-block" {...props}>
          {children}
        </p>
      );
    }
    return <p {...props}>{children}</p>;
  },
};

// 调用后端代理，流式解析 SSE 并通过回调分发事件
// 智能体输出为 Markdown：图片以 ![alt](url) 形式内嵌在 answer 文本中，由渲染层就地显示
// 每次请求带匿名设备 ID（后端每日额度计数）；onQuota 回调接收今日剩余句数
async function streamChat({ text, sessionId, onAnswer, onError, onQuota }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Device-Id': getDeviceId() },
    body: JSON.stringify({ text, session_id: sessionId }),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: `请求失败 (${res.status})` }));
    const e = new Error(err.error || err.detail || `请求失败 (${res.status})`);
    e.code = err.code; // 如 QUOTA_EXCEEDED
    throw e;
  }
  if (onQuota) {
    const remaining = res.headers.get('X-Quota-Remaining');
    if (remaining !== null) onQuota(Number(remaining));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() ?? '';
    for (const block of blocks) {
      const dataText = block
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .join('\n');
      if (!dataText) continue;
      let event;
      try {
        event = JSON.parse(dataText);
      } catch {
        continue;
      }
      const type = event?.type;
      if (type === 'answer' && event?.content?.answer) {
        onAnswer(event.content.answer);
      }
      if (type === 'error') {
        onError(event?.content?.error || '智能体执行出错');
      }
    }
  }
}

export default function Chat() {
  const [session, setSession] = useState(() => ensureCurrentSession());
  const [sessions, setSessions] = useState(() => loadSessions());
  const [messages, setMessages] = useState(() => loadMessages(session.id)); // {id, role, text, error}
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false); // 手机端会话抽屉
  const [quotaRemaining, setQuotaRemaining] = useState(null); // 今日剩余句数（null=未知，-1=已解锁）
  const [quotaExceeded, setQuotaExceeded] = useState(false); // 触发解锁横幅
  const [adminCode, setAdminCode] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  const [misHint, setMisHint] = useState(false); // 会话时效提示条
  const listRef = useRef(null);
  const messagesRef = useRef(messages);
  const inputRef = useRef(null);

  // 一键提示词：填入输入框并聚焦（空态面板和 / 唤起面板共用）
  const pickPrompt = (text) => {
    setInput(text);
    setPromptOpen(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    document.title = '红果万事屋 · WY';
  }, []);

  // 会话时效提示：空会话或上次活跃超过 30 分钟的旧会话，提示可能要重新登录 MIS
  const maybeShowMisHint = (sessionObj, msgs) => {
    const stale = Date.now() - (sessionObj.updatedAt ?? Date.now()) > 30 * 60 * 1000;
    const empty = (msgs ?? []).length === 0;
    if (stale || empty) setMisHint(true);
  };

  // 提示条 10 秒自动消失
  useEffect(() => {
    if (!misHint) return undefined;
    const t = setTimeout(() => setMisHint(false), 10000);
    return () => clearTimeout(t);
  }, [misHint]);

  useEffect(() => {
    messagesRef.current = messages;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setPromptOpen(false);
    setMisHint(false);
    setStreaming(true);

    const userMsg = { id: crypto.randomUUID(), role: 'user', text };
    const aiMsg = { id: crypto.randomUUID(), role: 'assistant', text: '' };
    setMessages((prev) => [...prev, userMsg, aiMsg]);

    // 首条用户消息落定会话标题，并把会话顶到列表最前
    touchSession(session.id, text);
    setSessions(loadSessions());

    try {
      await streamChat({
        text,
        sessionId: session.cozeSessionId,
        onQuota: setQuotaRemaining,
        onAnswer: (chunk) =>
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsg.id ? { ...m, text: m.text + chunk } : m))
          ),
        onError: (err) =>
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsg.id ? { ...m, error: err } : m))
          ),
      });
    } catch (err) {
      if (err.code === 'QUOTA_EXCEEDED') {
        setQuotaExceeded(true);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsg.id
              ? { ...m, error: '今日额度已用完，可在下方输入站长口令解锁后重试' }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsg.id ? { ...m, error: String(err.message || err) } : m))
        );
      }
    } finally {
      setStreaming(false);
      saveMessages(session.id, messagesRef.current);
    }
  };

  // 站长口令解锁：验证通过后该设备当日不限量
  const unlock = async () => {
    const code = adminCode.trim();
    if (!code) return;
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: getDeviceId(), code }),
      });
      if (res.ok) {
        setQuotaExceeded(false);
        setUnlockError(false);
        setAdminCode('');
        setQuotaRemaining(-1);
      } else {
        setUnlockError(true);
      }
    } catch {
      setUnlockError(true);
    }
  };

  const switchSession = (id) => {
    setDrawerOpen(false);
    if (streaming || id === session.id) return;
    saveMessages(session.id, messagesRef.current);
    setCurrentId(id);
    const target = loadSessions().find((s) => s.id === id);
    if (!target) return;
    const msgs = loadMessages(id);
    setSession(target);
    setMessages(msgs);
    maybeShowMisHint(target, msgs);
  };

  const newSession = () => {
    setDrawerOpen(false);
    if (streaming) return;
    saveMessages(session.id, messagesRef.current);
    const created = createSession();
    setCurrentId(created.id);
    setSession(created);
    setMessages([]);
    setSessions(loadSessions());
    maybeShowMisHint(created, []);
  };

  return (
    <div className="chat-layout">
      <Nav />
      <div className="chat-page page-enter">
        <Sidebar
          sessions={sessions}
          currentId={session.id}
          streaming={streaming}
          open={drawerOpen}
          onSwitch={switchSession}
          onNew={newSession}
          onClose={() => setDrawerOpen(false)}
        />

        <main className="chat-main">
          {/* 手机端会话条（桌面隐藏）：打开抽屉 + 显示当前会话 */}
          <div className="chat-mobilebar">
            <button className="sessions-btn" onClick={() => setDrawerOpen(true)}>
              会话
            </button>
            <span className="mobile-session-title">{session.title}</span>
          </div>

          {/* 会话时效提示条：空会话/旧会话可能需要重新登录 MIS */}
          {misHint && (
            <div className="session-hint">
              <span className="mark mark-gold" />
              <span>教务类查询可能需要（重新）登录一次 MIS，把学号密码直接发给红果万事屋即可</span>
            </div>
          )}

          <div className="chat-list" ref={listRef}>
            {messages.length === 0 && <EmptyState onPick={pickPrompt} />}
            {messages.map((m, i) => (
              <div key={m.id} className={`msg ${m.role}`}>
                {m.role === 'assistant' && <div className="avatar">红</div>}
                <div className={m.role === 'assistant' ? 'bubble-col' : 'bubble'}>
                  {m.role === 'assistant' ? (
                    <>
                      <div className="bubble">
                        {m.text && (
                          <div className="text">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                              {sanitizeText(m.text)}
                            </ReactMarkdown>
                          </div>
                        )}
                        {streaming && i === messages.length - 1 && <span className="cursor" />}
                        {m.error && <div className="error">{m.error}</div>}
                      </div>
                      <div className="bubble-hint">首次登录教务系统可能需要 30-60 秒</div>
                    </>
                  ) : (
                    <>
                      {m.text && (
                        <div className="text">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      )}
                      {m.error && <div className="error">{m.error}</div>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {promptOpen && (
            <PromptPanel onPick={pickPrompt} onClose={() => setPromptOpen(false)} />
          )}

          {/* 额度用完：联系站长提示 + 口令解锁 */}
          {quotaExceeded && (
            <div className="quota-banner">
              <div className="quota-text">
                <span className="mark mark-red" />
                <p>
                  今日额度已用完。联系站长可继续使用（主页页脚有邮箱和小红书），或输入站长口令解锁当日不限量：
                </p>
              </div>
              <div className="quota-row">
                <input
                  className="quota-input"
                  type="password"
                  value={adminCode}
                  onChange={(e) => {
                    setAdminCode(e.target.value);
                    setUnlockError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') unlock();
                  }}
                  placeholder="站长口令"
                />
                <button className="quota-btn" onClick={unlock}>
                  解锁
                </button>
              </div>
              {unlockError && <p className="quota-error">口令不正确，再试试</p>}
            </div>
          )}

          <footer className="input-bar">
            <textarea
              ref={inputRef}
              value={input}
              placeholder="输入消息，输入 / 唤起提示词"
              onChange={(e) => {
                // 输入为空时敲 / → 唤起提示词面板（不产生实际字符）
                if (e.target.value === '/') {
                  setInput('');
                  setPromptOpen(true);
                  return;
                }
                setInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setPromptOpen(false);
                  return;
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
            />
            <button
              className="send-btn"
              onClick={send}
              disabled={streaming || !input.trim()}
              aria-label="发送"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" />
              </svg>
            </button>
          </footer>

          {/* 常驻安全提示：教务功能需要凭证 + 本站的处理承诺 */}
          <div className="input-hint">
            <svg width="10" height="12" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="1" y="6" width="10" height="7" fill="currentColor" />
              <path d="M3 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>
              查成绩/课表等教务功能，直接把学号和 MIS 密码发给我即可。密码仅用于学校统一认证，含凭证的消息不会在本地留存。
              {quotaRemaining === -1 && ' · 今日已解锁不限量'}
              {quotaRemaining !== null && quotaRemaining >= 0 && ` · 今日剩余 ${quotaRemaining} 句`}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
