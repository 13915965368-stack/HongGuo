import { useEffect } from 'react';

// 全屏图片灯箱：点击聊天图片唤起
// - 原图分辨率查看（object-fit: contain）
// - 下载按钮：fetch blob 触发下载；跨域失败则降级新窗口打开（用户可长按/右键另存）
// - 手机长按图片 = 浏览器原生「保存图片」，无需额外代码
// - 关闭：点遮罩 / Esc / 右上按钮
export default function Lightbox({ src, alt, onClose }) {
  // Esc 关闭 + 滚动锁定
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const download = async () => {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (alt || '图片').slice(0, 40);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // 跨域 CORS 拦截等：降级为新窗口打开，用户可长按/右键另存
      window.open(src, '_blank', 'noreferrer');
    }
  };

  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true" aria-label="图片查看">
      <div className="lightbox-bar" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-btn" onClick={download}>
          下载
        </button>
        <button className="lightbox-btn" onClick={onClose}>
          关闭
        </button>
      </div>
      {/* stopPropagation：点图片本体不关闭，方便长按保存 */}
      <img className="lightbox-img" src={src} alt={alt || ''} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
