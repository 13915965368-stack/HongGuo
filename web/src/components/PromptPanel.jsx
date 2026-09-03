import { PROMPT_GROUPS } from '../lib/prompts.js';

// 紧凑版提示词面板：聊天中输入 / 唤起，显示在输入条上方
// 与空态面板共用 prompts.js 数据；选中填入输入框，Esc 或 × 关闭
export default function PromptPanel({ onPick, onClose }) {
  return (
    <div className="prompt-panel">
      <div className="prompt-panel-head">
        <span className="prompt-panel-title">提示词</span>
        <button className="prompt-panel-close" onClick={onClose} aria-label="关闭提示词面板">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="3" />
          </svg>
        </button>
      </div>

      {PROMPT_GROUPS.map((group) => (
        <div className="prompt-panel-group" key={group.key}>
          <span className={`mark mark-${group.mark}`} />
          <span className="prompt-panel-label">{group.label}</span>
          <div className="prompt-panel-chips">
            {group.prompts.map((text) => (
              <button key={text} className="prompt-chip prompt-chip-s" onClick={() => onPick(text)}>
                {text}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
