'use client';
import { useEffect, useRef } from 'react';

// 首页 hero 的赛季主题背景：S18「自然之力」——林间光尘 / 孢子向上漂浮。
//
// 与 AmbientField 的分工：
//   AmbientField = 极淡陪衬（攻略列表头等小面积），opacity 0.22、粒子 10~20
//   HeroField    = 主视觉氛围（首页 hero 大面积），opacity 0.5、粒子 28~58、尺寸更大
// 两者都是原生 WebGL 点精灵、零依赖，共用同一套质量门槛。
//
// 质量门槛：prefers-reduced-motion 直接不渲染（留 CSS 渐变兜底）／DPR 上限 1.5／
// 移动端粒子减半／visibilitychange 暂停／context lost+restored 处理／卸载释放上下文。
const VERT = `
attribute vec2 aPos;
attribute float aSize;
attribute float aPhase;
attribute float aSpeed;
uniform float uTime;
uniform float uDpr;
varying float vPhase;
varying float vFade;
void main(){
  // 向上缓慢漂浮，mod 实现从底部回绕，避免在边界硬切
  float y = mod(aPos.y + 1.1 + uTime * aSpeed * 0.03, 2.2) - 1.1;
  float x = aPos.x + 0.05 * sin(uTime * 0.22 + aPhase * 2.3);
  vFade = smoothstep(1.15, 0.72, abs(y));
  gl_Position = vec4(x, y, 0.0, 1.0);
  gl_PointSize = aSize * uDpr;
  vPhase = aPhase;
}`;

const FRAG = `
precision mediump float;
uniform vec3 uGold;
uniform vec3 uWild;
uniform float uOpacity;
varying float vPhase;
varying float vFade;
void main(){
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  float a = smoothstep(0.5, 0.02, d);
  a = pow(a, 1.5);
  vec3 col = mix(uGold, uWild, fract(vPhase * 0.37 + 0.15));
  gl_FragColor = vec4(col, a * uOpacity * vFade);
}`;

export default function HeroField({ count, opacity = 0.5 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // 动效敏感用户：完全不渲染，视觉交给 .hero 的林间光晕渐变与 hero-hex
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const gl =
      canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: 'low-power',
      }) || canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return; // 无 WebGL：静默降级，不报错

    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    const N = count || (isMobile ? 28 : 58);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('[HeroField] shader', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[HeroField] link', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const pos = new Float32Array(N * 2);
    const size = new Float32Array(N);
    const phase = new Float32Array(N);
    const speed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 2] = (Math.random() * 2 - 1) * 0.95;
      pos[i * 2 + 1] = (Math.random() * 2 - 1) * 0.95;
      size[i] = 6 + Math.random() * 20; // 比 AmbientField 更大，主视觉才立得住
      phase[i] = Math.random() * Math.PI * 2;
      speed[i] = 0.6 + Math.random() * 1.3;
    }
    function buf(name, data, comp) {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, comp, gl.FLOAT, false, 0, 0);
    }
    buf('aPos', pos, 2);
    buf('aSize', size, 1);
    buf('aPhase', phase, 1);
    buf('aSpeed', speed, 1);

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uDpr = gl.getUniformLocation(prog, 'uDpr');
    const uGold = gl.getUniformLocation(prog, 'uGold');
    const uWild = gl.getUniformLocation(prog, 'uWild');
    const uOpacity = gl.getUniformLocation(prog, 'uOpacity');
    gl.uniform1f(uDpr, dpr);
    gl.uniform3f(uGold, 0.612, 0.486, 0.235); // --gold #9C7C3C
    gl.uniform3f(uWild, 0.306, 0.42, 0.29); // --wild #4E6B4A
    gl.uniform1f(uOpacity, opacity);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let raf = 0;
    let running = true;
    let lastW = 0;
    let lastH = 0;
    const t0 = performance.now();

    function resize() {
      const w = canvas.clientWidth || 0;
      const h = canvas.clientHeight || 0;
      if (w === 0 || h === 0) return;
      const dw = Math.round(w * dpr);
      const dh = Math.round(h * dpr);
      if (dw === lastW && dh === lastH) return;
      lastW = dw;
      lastH = dh;
      canvas.width = dw;
      canvas.height = dh;
      gl.viewport(0, 0, dw, dh);
    }
    function frame(now) {
      if (!running) return;
      resize();
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.drawArrays(gl.POINTS, 0, N);
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    const onVis = () => {
      if (document.hidden) {
        running = false;
        stop();
      } else {
        running = true;
        start();
      }
    };
    const onLost = (e) => {
      e.preventDefault();
      stop();
    };
    const onRestored = () => {
      start();
    };
    document.addEventListener('visibilitychange', onVis);
    canvas.addEventListener('webglcontextlost', onLost, false);
    canvas.addEventListener('webglcontextrestored', onRestored, false);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    resize();
    start();

    return () => {
      stop();
      running = false;
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      ro.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    };
  }, [count, opacity]);

  return <canvas ref={ref} className="ambient-canvas" aria-hidden="true" />;
}
