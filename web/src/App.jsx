import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Chat from './pages/Chat.jsx';

// 页面层级：决定转场扫过方向（深入 = 左→右，返回 = 右→左）
const PAGE_ORDER = { '/': 0, '/chat': 1 };

// 方向感压版转场：
// 1. 点击链接后旧页面【保持渲染】，墨块（带 16px 红尾刃）扫入遮盖内容区（导航不动）
// 2. 150ms 全覆盖瞬间才交换路由 —— 盖旧 → 换新 → 揭新，一个连续因果动作
// 3. 方向随导航层级正反向翻转，给用户「聊天页在主页右边」的空间地图
function AnimatedRoutes() {
  const location = useLocation();
  const [displayed, setDisplayed] = useState(location); // 实际渲染的页面（比路由慢半拍）
  const [wipe, setWipe] = useState(null); // {id, dir}
  const firstRef = useRef(true);

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false; // 首次加载不扫
      return;
    }
    if (location.pathname === displayed.pathname) return;

    const dir =
      (PAGE_ORDER[location.pathname] ?? 0) > (PAGE_ORDER[displayed.pathname] ?? 0)
        ? 'forward'
        : 'backward';
    setWipe({ id: Date.now(), dir });

    const swapTimer = setTimeout(() => setDisplayed(location), 150); // 全覆盖瞬间换页
    const clearTimer = setTimeout(() => setWipe(null), 340); // 动画结束清理（300ms + 余量）
    return () => {
      clearTimeout(swapTimer);
      clearTimeout(clearTimer);
    };
  }, [location, displayed]);

  return (
    <>
      {wipe && (
        <div key={wipe.id} className={`route-wipe ${wipe.dir}`} aria-hidden="true">
          <span className="wipe-block" />
        </div>
      )}
      <Routes location={displayed}>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </>
  );
}

// 路由根：/ 是 WY 个人网站主页，/chat 是红果万事屋（站点的一个功能模块）
export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
