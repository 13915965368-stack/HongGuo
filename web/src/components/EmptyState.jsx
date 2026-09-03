import { PROMPT_GROUPS } from '../lib/prompts.js';

// 空态能力面板：新会话时展示红果万事屋能做什么
// 点击提示词 → 填入输入框并聚焦（不直接发送，同学可以改完再发）
export default function EmptyState({ onPick }) {
  return (
    <div className="empty-panel">
      <div className="empty-head">
        <div className="avatar">红</div>
        <h2>红果万事屋</h2>
      </div>

      <p className="empty-intro">
        北交大专属 AI 助手——查成绩、选课、找资料、逛互助墙，点下面任意一条试试。
      </p>

      <div className="prompt-groups">
        {PROMPT_GROUPS.map((group) => (
          <div className="prompt-group" key={group.key}>
            <div className="prompt-group-label">
              <span className={`mark mark-${group.mark}`} />
              <span>{group.label}</span>
              {group.note && <span className="prompt-note">{group.note}</span>}
            </div>
            <div className="prompt-chips">
              {group.prompts.map((text) => (
                <button key={text} className="prompt-chip" onClick={() => onPick(text)}>
                  {text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="empty-trust">
        教务查询需 MIS 登录，密码仅用于学校统一认证，含凭证的消息不会在本地留存
      </p>
    </div>
  );
}
