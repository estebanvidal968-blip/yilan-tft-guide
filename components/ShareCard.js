'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 分享卡：把「当前页 / 站点首页」变成可扫码传播的资产。
 * - 二维码：微信 / 相机 / 浏览器扫一扫都能直达，不需要 App、不需要安装
 * - 朋友圈海报：750×1000 竖图，手机长按即可保存 → 发朋友圈 / 发群
 * - 一键分享：支持 Web Share API 的浏览器直接唤起系统分享面板
 *
 * 全部在浏览器端完成，不依赖任何后端接口。
 * qrcode 走 browser 入口 + 动态 import，SSR 期完全不加载。
 */

const SITE_NAME = '弈览';
const SITE_SUB = '金铲铲之战 S18 · 自然之力';

function isWeixin() {
  if (typeof navigator === 'undefined') return false;
  return /micromessenger/i.test(navigator.userAgent || '');
}

// canvas 逐字绘制，手动实现字距（canvas letterSpacing 兼容性差）
function drawTracked(ctx, text, cx, y, spacing) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
}

function hexPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90);
    const px = cx + r * Math.cos(a);
    const py = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export default function ShareCard({
  scope = 'page', // 'page' 当前页 | 'site' 站点首页
  headline = '一起玩金铲铲 S18',
  lines = ['阵容 / 装备 / 羁绊 / 弈子 即查即用', '出装模拟器 · 阵容生成器 · 装备小测'],
  compact = false,
}) {
  const [url, setUrl] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [poster, setPoster] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [wx, setWx] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const canvasRef = useRef(null);
  const qrRef = useRef(null); // 缓存二维码 dataURL，海报复用

  // 读取当前地址（只能在浏览器端）
  useEffect(() => {
    const origin = window.location.origin;
    setUrl(scope === 'site' ? `${origin}/` : window.location.href);
    const t = document.title || '';
    setPageTitle(t.split('·')[0].trim() || SITE_NAME);
    setWx(isWeixin());
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, [scope]);

  const loadQR = useCallback(async () => {
    const mod = await import('qrcode/lib/browser.js');
    return mod.default || mod;
  }, []);

  // 画屏幕上那枚二维码
  useEffect(() => {
    if (!url || !canvasRef.current) return;
    let alive = true;
    (async () => {
      try {
        const QR = await loadQR();
        if (!alive || !canvasRef.current) return;
        await QR.toCanvas(canvasRef.current, url, {
          margin: 1,
          width: 220,
          errorCorrectionLevel: 'M',
          color: { dark: '#1B1916', light: '#FFFFFF' },
        });
        qrRef.current = await QR.toDataURL(url, {
          margin: 0,
          width: 640,
          errorCorrectionLevel: 'M',
          color: { dark: '#1B1916', light: '#FFFFFF' },
        });
      } catch (e) {
        setMsg('二维码生成失败，可直接复制链接');
      }
    })();
    return () => {
      alive = false;
    };
  }, [url, loadQR]);

  const flash = (t) => {
    setMsg(t);
    setTimeout(() => setMsg(''), 2200);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      flash('链接已复制');
    } catch {
      // 老浏览器兜底
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      flash('链接已复制');
    }
  };

  const copyPitch = async () => {
    const text = `【${SITE_NAME}】${SITE_SUB}攻略站：阵容、装备、羁绊、出装模拟器全都有，扫码或点链接直接用，不用下 App —— ${url}`;
    try {
      await navigator.clipboard.writeText(text);
      flash('推荐文案已复制，去群里 / 游戏里发一条');
    } catch {
      flash('复制失败，请长按手动选择文案');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: `${SITE_NAME} · ${SITE_SUB}`,
        text: `${headline} —— ${SITE_NAME}攻略站，扫码即用`,
        url,
      });
    } catch {
      /* 用户取消，静默 */
    }
  };

  const downloadQR = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `弈览-二维码.png`;
    a.click();
    flash('二维码已保存（手机可长按图片保存）');
  };

  // 生成朋友圈竖版海报
  const makePoster = async () => {
    setBusy(true);
    setMsg('');
    try {
      const QR = await loadQR();
      try {
        await document.fonts.ready;
      } catch {
        /* 字体未就绪则降级系统字体 */
      }
      const W = 750;
      const H = 1000;
      const S = 2; // 2 倍图，朋友圈不糊
      const cv = document.createElement('canvas');
      cv.width = W * S;
      cv.height = H * S;
      const ctx = cv.getContext('2d');
      ctx.scale(S, S);

      // 纸底
      ctx.fillStyle = '#F4F1EA';
      ctx.fillRect(0, 0, W, H);

      // 双线金框（报纸气质）
      ctx.strokeStyle = '#D9D3C6';
      ctx.lineWidth = 1;
      ctx.strokeRect(22.5, 22.5, W - 45, H - 45);
      ctx.strokeStyle = '#C9B271';
      ctx.strokeRect(30.5, 30.5, W - 61, H - 61);

      const cx = W / 2;

      // 六边形站标
      ctx.strokeStyle = '#9C7C3C';
      ctx.lineWidth = 2;
      hexPath(ctx, cx, 118, 22);
      ctx.stroke();
      hexPath(ctx, cx, 118, 10);
      ctx.fillStyle = '#C9B271';
      ctx.fill();

      // 站名
      ctx.fillStyle = '#1B1916';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.font = '700 52px "Noto Serif SC", Georgia, serif';
      drawTracked(ctx, SITE_NAME, cx, 208, 14);

      // 赛季副标
      ctx.font = '500 22px "Noto Serif SC", Georgia, serif';
      ctx.fillStyle = '#46423A';
      drawTracked(ctx, SITE_SUB, cx, 246, 2);

      // 分隔金线
      ctx.strokeStyle = '#C9B271';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 70, 272);
      ctx.lineTo(cx + 70, 272);
      ctx.stroke();

      // 主文案
      ctx.fillStyle = '#1B1916';
      ctx.font = '600 36px "Noto Serif SC", Georgia, serif';
      drawTracked(ctx, headline, cx, 330, 3);

      // 卖点行
      ctx.textAlign = 'center';
      ctx.font = '400 20px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#8C867A';
      lines.slice(0, 2).forEach((t, i) => {
        ctx.fillText(t, cx, 372 + i * 32);
      });

      // 二维码白卡
      const qs = 320;
      const qx = cx - qs / 2;
      const qy = 460;
      const pad = 26;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qx - pad, qy - pad, qs + pad * 2, qs + pad * 2);
      ctx.strokeStyle = '#D9D3C6';
      ctx.lineWidth = 1;
      ctx.strokeRect(qx - pad + 0.5, qy - pad + 0.5, qs + pad * 2 - 1, qs + pad * 2 - 1);

      const qrData =
        qrRef.current ||
        (await QR.toDataURL(url, {
          margin: 0,
          width: 640,
          errorCorrectionLevel: 'M',
          color: { dark: '#1B1916', light: '#FFFFFF' },
        }));
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = qrData;
      });
      ctx.drawImage(img, qx, qy, qs, qs);

      // 扫码指引
      ctx.font = '500 24px "Noto Serif SC", Georgia, serif';
      ctx.fillStyle = '#4E6B4A';
      ctx.textAlign = 'left';
      drawTracked(ctx, '微信扫一扫 · 直接开始查', cx, 880, 2);

      ctx.textAlign = 'center';
      ctx.font = '400 17px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#8C867A';
      ctx.fillText('网页版 · 无需下载 App · 数据来源 OP.GG', cx, 914);

      let host = '';
      try {
        host = new URL(url).host;
      } catch {
        host = '';
      }
      if (host) {
        ctx.font = '400 15px -apple-system, "PingFang SC", sans-serif';
        ctx.fillStyle = '#B5AE9E';
        ctx.fillText(host, cx, 946);
      }

      setPoster(cv.toDataURL('image/png'));
      flash(wx ? '海报已生成，长按图片保存到相册' : '海报已生成，可长按或点下载保存');
    } catch (e) {
      flash('海报生成失败，可先用上面的二维码');
    } finally {
      setBusy(false);
    }
  };

  const downloadPoster = () => {
    if (!poster) return;
    const a = document.createElement('a');
    a.href = poster;
    a.download = '弈览-分享海报.png';
    a.click();
  };

  return (
    <div className={`share-card${compact ? ' compact' : ''}`}>
      <div className="share-qr-wrap">
        <div className="share-qr">
          <canvas ref={canvasRef} width={220} height={220} aria-label="本页二维码" />
        </div>
        <div className="share-meta">
          <b className="share-title">{scope === 'site' ? `${SITE_NAME}攻略站` : pageTitle || SITE_NAME}</b>
          <span className="share-url" title={url}>
            {url || '正在读取地址…'}
          </span>
          <p className="share-hint">
            {wx
              ? '微信里可点右上角「···」发送给朋友；或长按下方海报保存，发朋友圈让好友扫码。'
              : '手机上长按二维码可保存图片；发到群里 / 朋友圈，好友用微信或相机扫码即达。'}
          </p>
        </div>
      </div>

      <div className="share-actions">
        {canShare && (
          <button type="button" className="btn primary" onClick={nativeShare}>
            一键分享
          </button>
        )}
        <button type="button" className="btn ghost" onClick={copyLink}>
          复制链接
        </button>
        <button type="button" className="btn ghost" onClick={downloadQR}>
          保存二维码
        </button>
        <button type="button" className="btn ghost" onClick={makePoster} disabled={busy}>
          {busy ? '生成中…' : poster ? '重新生成海报' : '生成朋友圈海报'}
        </button>
        <button type="button" className="btn ghost" onClick={copyPitch}>
          复制推荐文案
        </button>
      </div>

      {msg && <p className="share-msg">{msg}</p>}

      {poster && (
        <div className="share-poster">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt="弈览分享海报" />
          <div className="share-poster-foot">
            <span className="share-poster-tip">长按图片即可保存到相册，再发朋友圈 / 发群</span>
            <button type="button" className="btn ghost sm" onClick={downloadPoster}>
              下载海报
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
