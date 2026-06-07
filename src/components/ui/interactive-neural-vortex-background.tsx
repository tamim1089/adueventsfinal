"use client";

import React, { useEffect, useRef } from "react";

// Typed + recolored to ADU red/black. Renders ONLY the WebGL canvas (the demo's
// hero markup is dropped) so it can be used purely as a page background.
// Honors Reduce Motion (freezes to a single frame).
const InteractiveNeuralVortex = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0, tX: 0, tY: 0 });
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const gl =
      (canvasEl.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvasEl.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const vsSource = `
      precision mediump float;
      attribute vec2 a_position;
      varying vec2 vUv;
      void main() { vUv = .5 * (a_position + 1.); gl_Position = vec4(a_position, 0.0, 1.0); }
    `;
    // ADU palette: deep black base shifting toward red.
    const fsSource = `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_ratio;
      uniform vec2 u_pointer_position;
      vec2 rotate(vec2 uv, float th) { return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv; }
      float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.); vec2 res = vec2(0.); float scale = 8.;
        for (int j = 0; j < 15; j++) {
          uv = rotate(uv, 1.); sine_acc = rotate(sine_acc, 1.);
          vec2 layer = uv * scale + float(j) + sine_acc - t;
          sine_acc += sin(layer) + 2.4 * p;
          res += (.5 + .5 * cos(layer)) / scale; scale *= 1.2;
        }
        return res.x + res.y;
      }
      void main() {
        vec2 uv = .5 * vUv; uv.x *= u_ratio;
        vec2 pointer = vUv - u_pointer_position; pointer.x *= u_ratio;
        float p = clamp(length(pointer), 0., 1.); p = .5 * pow(1. - p, 2.);
        float t = .001 * u_time;
        float noise = neuro_shape(uv, t, p);
        noise = 1.2 * pow(noise, 3.); noise += pow(noise, 10.);
        noise = max(.0, noise - .5); noise *= (1. - length(vUv - .5));
        vec3 color = vec3(0.88, 0.11, 0.18);                 // ADU red
        color = mix(color, vec3(0.55, 0.02, 0.06), 0.5);     // deepen toward crimson/black
        color = color * noise;
        gl_FragColor = vec4(color, noise);
      }
    `;

    const compile = (src: string, type: number) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const vsh = compile(vsSource, gl.VERTEX_SHADER);
    const fsh = compile(fsSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram()!;
    gl.attachShader(program, vsh);
    gl.attachShader(program, fsh);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRatio = gl.getUniformLocation(program, "u_ratio");
    const uPointer = gl.getUniformLocation(program, "u_pointer_position");

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvasEl.width = window.innerWidth * dpr;
      canvasEl.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvasEl.width, canvasEl.height);
      gl.uniform1f(uRatio, canvasEl.width / canvasEl.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const t = reduce ? 8000 : performance.now();
      pointer.current.x += (pointer.current.tX - pointer.current.x) * 0.2;
      pointer.current.y += (pointer.current.tY - pointer.current.y) * 0.2;
      gl.uniform1f(uTime, t);
      gl.uniform2f(
        uPointer,
        pointer.current.x / window.innerWidth,
        1 - pointer.current.y / window.innerHeight,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduce) animationRef.current = requestAnimationFrame(render);
    };
    render();

    const onMove = (e: PointerEvent) => {
      pointer.current.tX = e.clientX;
      pointer.current.tY = e.clientY;
    };
    window.addEventListener("pointermove", onMove);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 -z-10 h-full w-full" aria-hidden="true" />;
};

export default InteractiveNeuralVortex;
