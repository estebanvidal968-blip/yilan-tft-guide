'use client';
import { useEffect, useRef } from 'react';

// 原生 WebGL 点精灵：极低存在感的「自然孢子」漂浮，匹配 S18 自然之力 + 纸金克制基调。
// 不依赖 three.js，零额外打包体积；透明背景叠在纸色之上，不动声色。
const VERT = `
attribute vec2 aPos;
attribute float aSize;
attribute float aPhase;
uniform float uTime;
uniform float uDpr;
varying float vPhase;
void main(){
  vec2 p = aPos + 0.05 * vec2(sin(uTime*0.16 + aPhase), cos(uTime*0.12 + aPhase*1.7));
  gl_Position = vec4(p, 0.0, 1.0);
  gl_PointSize = aSize * uDpr;
  vPhase = aPhase;
}`;

const FRAG = `
precision mediump float;
uniform vec3 uGold;
uniform vec3 uWild;
uniform float uOpacity;
varying float vPhase;
void main(){
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a = pow(a, 1.6);
  vec3 col = mix(uGold, uWild, fract(vPhase*0.41 + 0.2));
  gl_FragColor = vec4(col, a * uOpacity);
}`;

export default function AmbientField({ count, opacity = 0.22 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // 动效敏感用户：完全不动，留白交给既有 CSS 装饰（hero-hex 等）。
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const gl =
      canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: 'low-power',
      }) || canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return; // 无 WebGL：留白兜底，不报错

    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    const N = count || (isMobile ? 10 : 20);
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // DPR 上限 1.5，省电又够清晰

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('[AmbientField] shader', gl.getShaderInfoLog(s));
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
      console.warn('[AmbientField] link', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const pos = new Float32Array(N * 2);
    const size = new Float32Array(N);
    const phase = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 2] = (Math.random() * 2 - 1) * 0.92;
      pos[i * 2 + 1] = (Math.random() * 2 - 1) * 0.92;
      size[i] = 5 + Math.random() * 11;
      phase[i] = Math.random() * Math.PI * 2;
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
