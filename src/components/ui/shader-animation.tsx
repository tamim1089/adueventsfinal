"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    camera: THREE.Camera
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    uniforms: Record<string, { value: unknown }>
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    const vertexShader = `void main() { gl_Position = vec4(position, 1.0); }`

    // Calmer shader: fewer lines, monochrome red/dark palette, slower movement.
    // uBlackout drives the random "dark screen" moments (0 = lit, 1 = black).
    const fragmentShader = `
      precision highp float;
      uniform vec2  resolution;
      uniform float time;
      uniform float uBlackout;

      float rand(float n){ return fract(sin(n) * 43758.5453); }

      void main() {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t  = time * 0.022;           // slow — was 0.06
        float lw = 0.0018;

        // Single colour channel (red-tinted monochrome) — replaces the RGB rainbow.
        float blade = 0.0;
        for (int i = 0; i < 6; i++) {     // 6 lines instead of 24
          float r     = rand(float(i) * 1.93 + 0.71);
          float speed = 0.3 + 0.6 * r;
          float phase = t * speed + r * 6.2831;
          float gap   = 4.0 + 3.0 * rand(float(i) + 5.0);
          blade += lw * float(i * i) / abs(fract(phase) * gap - length(uv) + mod(uv.x + uv.y, 0.25));
        }

        // ADU palette: dark navy base, red-tinted blades
        vec3 col = vec3(blade * 0.55, blade * 0.05, blade * 0.10);

        // Blackout: multiply to zero for dark-flash moments
        col *= (1.0 - uBlackout);

        gl_FragColor = vec4(col, 1.0);
      }
    `

    const camera = new THREE.Camera()
    camera.position.z = 1
    const scene  = new THREE.Scene()
    const geo    = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      time:        { value: 1.0 },
      resolution:  { value: new THREE.Vector2() },
      uBlackout:   { value: 0.0 },
    }
    const mat  = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    scene.add(new THREE.Mesh(geo, mat))

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(renderer.domElement)

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight
      renderer.setSize(w, h)
      ;(uniforms.resolution.value as THREE.Vector2).set(renderer.domElement.width, renderer.domElement.height)
    }
    onResize()
    window.addEventListener("resize", onResize, false)

    // ------- dark-flash scheduler -------
    // Every 4-9 s a random blade flash:  ~2 s black, then fade back in.
    let blackout = 0.0        // current value (smooth lerp target)
    let isBlack  = false
    let flashTimer: ReturnType<typeof setTimeout>

    const scheduleNext = () => {
      const wait = 4000 + Math.random() * 5000   // 4–9 s between flashes
      flashTimer = setTimeout(() => {
        isBlack = true
        // after 1.8–2.2 s, return to blades
        setTimeout(() => { isBlack = false; scheduleNext() }, 1800 + Math.random() * 400)
      }, wait)
    }
    scheduleNext()

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 }

    const animate = () => {
      const id = requestAnimationFrame(animate)
      if (sceneRef.current) sceneRef.current.animationId = id

      // Lerp blackout smoothly
      const target = isBlack ? 1.0 : 0.0
      blackout += (target - blackout) * 0.06
      uniforms.uBlackout.value = blackout
      uniforms.time.value      += 0.04   // slower tick

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      clearTimeout(flashTimer)
      window.removeEventListener("resize", onResize)
      if (sceneRef.current) cancelAnimationFrame(sceneRef.current.animationId)
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      renderer.dispose()
      geo.dispose()
      mat.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-screen"
      style={{ background: "#000", overflow: "hidden" }}
    />
  )
}
