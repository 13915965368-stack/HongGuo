import express from 'express';
import 'dotenv/config';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '2mb' }));

const {
  COZE_API_DOMAIN,
  COZE_PROJECT_ID,
  COZE_API_TOKEN,
  PORT = 3001,
  DAILY_LIMIT = 10, // 每设备每日聊天句数
  ADMIN_CODE = '', // 站长口令：超限后解锁当日额度；为空则解锁功能关闭
} = process.env;

if (!COZE_API_DOMAIN || !COZE_PROJECT_ID || !COZE_API_TOKEN) {
  console.error('缺少环境变量，请检查 server/.env 文件');
  process.exit(1);
}

// ---------- 访客额度：内存计数（设备 ID + 自然日），进程重启即清零 ----------
// 结构：Map<"deviceId|YYYY-MM-DD", { used: number, unlimited: boolean }>
const quota = new Map();

const todayKey = () => new Date().toISOString().slice(0, 10);
const quotaKey = (deviceId) => `${deviceId}|${todayKey()}`;

// 防御性清理：条目过多时只保留今天的（历史日期的条目作废）
function pruneQuota() {
  if (quota.size < 5000) return;
  const today = todayKey();
  for (const key of quota.keys()) {
    if (!key.endsWith(today)) quota.delete(key);
  }
}

function checkAndConsume(deviceId) {
  pruneQuota();
  const key = quotaKey(deviceId);
  const rec = quota.get(key) ?? { used: 0, unlimited: false };
  if (!rec.unlimited && rec.used >= DAILY_LIMIT) {
    return { ok: false, used: rec.used };
  }
  rec.used += 1;
  quota.set(key, rec);
  return { ok: true, remaining: rec.unlimited ? -1 : DAILY_LIMIT - rec.used };
}

// ---------- 站长口令解锁：验证通过后该设备当日不限量 ----------
app.post('/api/unlock', (req, res) => {
  const { device_id: deviceId, code } = req.body ?? {};
  if (!ADMIN_CODE) {
    return res.status(503).json({ error: '站长口令未配置' });
  }
  if (!deviceId || typeof code !== 'string' || code !== ADMIN_CODE) {
    return res.status(403).json({ error: '口令不正确' });
  }
  const key = quotaKey(deviceId);
  const rec = quota.get(key) ?? { used: 0, unlimited: false };
  rec.unlimited = true;
  quota.set(key, rec);
  res.json({ ok: true });
});

// ---------- 前端聊天代理接口 ----------
// 请求头 X-Device-Id：前端生成的匿名设备标识，用于每日限额
// VERIFY: 鉴权/限流已在此实现（设备级每日 DAILY_LIMIT）；上游代理逻辑保持原样
app.post('/api/chat', async (req, res) => {
  const { text, session_id: sessionId } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text 不能为空' });
  }
  if (!sessionId) {
    return res.status(400).json({ error: 'session_id 不能为空' });
  }
  const deviceId = req.get('X-Device-Id');
  if (!deviceId) {
    return res.status(400).json({ error: '缺少设备标识' });
  }

  const q = checkAndConsume(deviceId);
  if (!q.ok) {
    return res.status(429).json({
      error: `今日 ${DAILY_LIMIT} 句额度已用完，联系站长可继续使用`,
      code: 'QUOTA_EXCEEDED',
    });
  }

  try {
    const upstream = await fetch(`${COZE_API_DOMAIN}/stream_run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${COZE_API_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        content: {
          query: {
            prompt: [{ type: 'text', content: { text } }],
          },
        },
        type: 'query',
        session_id: sessionId,
        project_id: Number(COZE_PROJECT_ID),
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '');
      return res
        .status(upstream.status || 502)
        .json({ error: `扣子 API 返回 ${upstream.status}`, detail: errText.slice(0, 500) });
    }

    // SSE 原样透传给前端；响应头带上今日剩余额度
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Quota-Remaining': String(q.remaining),
    });
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(502).json({ error: '无法连接扣子 API', detail: String(err) });
    } else {
      res.end();
    }
  }
});

// ---------- 静态托管（部署形态）：同端口吐 web/dist + SPA 路由回退 ----------
// 本地开发仍走 vite dev/preview；此配置供 Webify/容器部署使用
// DIST_DIR 环境变量可覆盖（容器路径不同时用得上）；本地默认走相对路径
const distDir = process.env.DIST_DIR
  ? path.resolve(process.env.DIST_DIR)
  : path.resolve(__dirname, '../../web/dist');
app.use(express.static(distDir));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`后端代理已启动: http://localhost:${PORT}`);
  console.log(`访客限额: 每设备每日 ${DAILY_LIMIT} 句; 站长口令: ${ADMIN_CODE ? '已配置' : '未配置（解锁功能关闭）'}`);
});
