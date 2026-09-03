import { NavLink } from 'react-router-dom';

// 共享导航（规范 §2.1）：64px 高 + 3px 粗黑底线
// 左：14px 红方块 + 站名 WY（Bold 18）；中：链接（当前项红色 Bold）；
// 右：黑框状态标签（2px 边框 + 8px 红方块点 + Inter Bold 小字）
export default function Nav() {
  const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <header className="nav">
      <NavLink to="/" className="brand" aria-label="回到主页">
        <span className="logo-mark" />
        <span className="brand-name">WY</span>
      </NavLink>

      <nav className="nav-links">
        <NavLink to="/" end className={linkClass}>
          主页
        </NavLink>
        <NavLink to="/chat" className={linkClass}>
          红果万事屋
        </NavLink>
      </nav>

      <div className="nav-status">
        <span className="status-dot" />
        <span className="status-text">LOCAL</span>
      </div>
    </header>
  );
}
