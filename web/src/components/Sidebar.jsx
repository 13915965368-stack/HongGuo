import { relativeTime } from '../lib/sessions.js';

// 会话历史侧栏（§2.5/§3）：264px --paper-deep 底 + 右侧 3px 粗竖线
// 顶部「新对话」黑底红阴影按钮；会话项透明底 2px 黑框，当前项红底纸字 Bold
// 每项第二行显示相对活跃时间（扣子侧会话/登录态有时效）
// 手机端（≤768px）变为左侧滑入抽屉：open 控制滑入，遮罩点击关闭
export default function Sidebar({ sessions, currentId, streaming, open, onSwitch, onNew, onClose }) {
  return (
    <>
      {open && <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />}
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <button className="btn-primary" onClick={onNew} disabled={streaming}>
          新对话
        </button>

        <div className="session-list">
          {sessions.map((s) => (
            <button
              key={s.id}
              className={s.id === currentId ? 'session-item active' : 'session-item'}
              onClick={() => onSwitch(s.id)}
              disabled={streaming}
              title={s.title}
            >
              <span className="session-title">{s.title}</span>
              <span className="session-time">{relativeTime(s.updatedAt)}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
