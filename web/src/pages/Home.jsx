import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav.jsx';
import { PROMPT_GROUPS } from '../lib/prompts.js';
import '../Home.css';

// 主页：导航 → Hero（红果万事屋简介 = 首屏主角，WY 退居站点品牌）
// → 它能做什么（三步上手 + 能力宫格）→ 未来模块占位 → 站点统计条 → 黑色页脚
export default function Home() {
  useEffect(() => {
    document.title = 'WY';
  }, []);

  return (
    <div className="home">
      <Nav />

      <main className="page-enter">
        {/* Hero：第一个功能的简介放最开头——红果万事屋是主角 */}
        <section className="hero">
          <div className="hero-red-block" aria-hidden="true" />
          <div className="hero-corner" aria-hidden="true" />
          <div className="hero-inner">
            <p className="hero-label">WY · 模块 01</p>
            <h1 className="hero-title">红果万事屋</h1>
            <p className="hero-tagline">北交大在校生的 AI 校园助手</p>
            <span className="hero-bar" />
            <p className="hero-sub">
              查成绩课表、问校园政策、找资料真题、逛互助墙……直接开聊，不用注册。
            </p>
            <div className="hero-actions">
              <Link className="btn-primary" to="/chat">
                开始对话
              </Link>
              <a className="btn-secondary" href="#modules">
                它能做什么
              </a>
            </div>
          </div>

          {/* 红色块面上的对话预览 mock */}
          <div className="hero-preview" aria-hidden="true">
            <div className="preview-bubble preview-user">查这学期成绩</div>
            <div className="preview-bubble preview-ai">
              好的，先帮你登录教务系统……
              <span className="preview-cursor" />
            </div>
          </div>
        </section>

        {/* 详细介绍：怎么用 + 能做什么 */}
        <section className="section" id="modules">
          <h2 className="section-title">它能做什么</h2>
          <p className="section-sub">三步上手，六类能力，校园里的问题都可以问它</p>

          {/* 怎么用：三步上手条 */}
          <div className="howto">
            <div className="howto-step">
              <span className="howto-num">01</span>
              <p>直接开问，不用注册</p>
            </div>
            <div className="howto-step">
              <span className="howto-num">02</span>
              <p>教务类查询需 MIS 登录，登一次后续免输</p>
            </div>
            <div className="howto-step">
              <span className="howto-num">03</span>
              <p>左侧栏管理多组对话，互不串扰</p>
            </div>
          </div>

          {/* 能做什么：能力宫格（数据与聊天页提示词同源） */}
          <div className="capability-grid">
            {PROMPT_GROUPS.map((g) => (
              <div className="cap-cell" key={g.key}>
                <div className="cap-head">
                  <span className={`mark mark-${g.mark}`} />
                  <h4>{g.label}</h4>
                  {g.note && <span className="cap-note">{g.note}</span>}
                </div>
                <p>{g.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 未来模块：3 列等宽占位卡 */}
        <section className="section">
          <h2 className="section-title">未来模块</h2>
          <div className="future-grid">
            <div className="future-card">
              <span className="mark mark-gold" />
              <p className="tag-outline">[ UNDER CONSTRUCTION ]</p>
              <h3>模块 02 · 文章</h3>
              <p className="future-soon">即将上线</p>
            </div>
            <div className="future-card">
              <span className="mark mark-gold" />
              <p className="tag-outline">[ UNDER CONSTRUCTION ]</p>
              <h3>模块 03 · 项目</h3>
              <p className="future-soon">即将上线</p>
            </div>
            <div className="future-card">
              <span className="mark mark-gold" />
              <p className="tag-outline">[ UNDER CONSTRUCTION ]</p>
              <h3>模块 04 · 关于</h3>
              <p className="future-soon">即将上线</p>
            </div>
          </div>
        </section>

        {/* 站点统计条：构成主义式自我陈述（从 Hero 下移） */}
        <section className="site-stats">
          <div className="stat">
            <span className="stat-num">01</span>
            <span className="stat-label">已上线模块</span>
          </div>
          <div className="stat">
            <span className="stat-num">03</span>
            <span className="stat-label">规划中</span>
          </div>
          <div className="stat">
            <span className="stat-num">0°</span>
            <span className="stat-label">允许的圆角</span>
          </div>
          <div className="stat">
            <span className="stat-num">100MS</span>
            <span className="stat-label">动效上限</span>
          </div>
          {/* 累计访客：不蒜子计数，脚本加载后自动填充（-- 为加载中占位） */}
          <div className="stat">
            <span className="stat-num">
              <span id="busuanzi_value_site_uv">--</span>
            </span>
            <span className="stat-label">累计访客</span>
          </div>
        </section>
      </main>

      {/* 页脚：墨黑实心横条 + 纸色字 + 联系方式 */}
      <footer className="footer">
        <div className="footer-brand">
          <span>WY — 个人网站</span>
          <span className="footer-en">© 2026</span>
        </div>
        <div className="footer-contacts">
          <a href="mailto:3228445746@qq.com" className="footer-contact">
            <svg width="12" height="10" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="0.5" y="0.5" width="13" height="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M1 1l6 5 6-5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            3228445746@qq.com
          </a>
          <a
            href="https://www.xiaohongshu.com/user/profile/5f5516a1000000000100436f"
            target="_blank"
            rel="noreferrer"
            className="footer-contact"
          >
            <svg width="10" height="11" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="0.5" y="1.5" width="10" height="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 1.5v-1h5v1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            小红书
          </a>
        </div>
      </footer>
    </div>
  );
}
