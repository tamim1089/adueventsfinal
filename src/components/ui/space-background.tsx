"use client"

import { useEffect, useRef } from "react"

interface Particle {
  color: string
  radius: number
  x: number
  y: number
  ring: number
  move: number
  random: number
}

export function SpaceBackground({
  particleCount = 450,
  particleColor = "rgba(99,102,241,0.85)",
  backgroundColor = "transparent",
  moveSpeed = 1,
  className = "",
}: {
  particleCount?: number
  particleColor?: string
  backgroundColor?: string
  moveSpeed?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animRef   = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let ratio = window.innerHeight < 400 ? 0.6 : 1
    const state = { particles: [] as Particle[], r: 120, counter: 0 }

    const setup = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      ctx.setTransform(ratio, 0, 0, -ratio, canvas.width / 2, canvas.height / 2)
    }
    setup()

    for (let i = 0; i < particleCount; i++) {
      state.particles.push({
        color:  particleColor,
        radius: Math.random() * 5,
        x: Math.cos(Math.random() * 7 + Math.PI) * state.r,
        y: Math.sin(Math.random() * 7 + Math.PI) * state.r,
        ring:   Math.random() * state.r * 3,
        move:   ((Math.random() * 4 + 1) / 500) * moveSpeed,
        random: Math.random() * 7,
      })
    }

    const loop = () => {
      ctx.clearRect(-canvas.width, -canvas.height, canvas.width * 2, canvas.height * 2)
      if (state.counter < state.particles.length) state.counter++
      for (let i = 0; i < state.counter; i++) {
        const p = state.particles[i]
        if (p.radius < 0.8) { p.ring = Math.random() * state.r * 3; p.radius = Math.random() * 5 }
        p.radius *= 0.994
        p.ring = Math.max(p.ring - (1 * moveSpeed), state.r)
        p.random += p.move
        p.x = Math.cos(p.random + Math.PI) * p.ring
        p.y = Math.sin(p.random + Math.PI) * p.ring
        ctx.beginPath()
        ctx.fillStyle = p.color
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      }
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    const onResize = () => { ratio = window.innerHeight < 400 ? 0.6 : 1; setup() }
    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [particleCount, particleColor, moveSpeed])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute", top: 0, left: 0,
        display: "block", width: "100%", height: "100%",
        background: backgroundColor, pointerEvents: "none",
      }}
    />
  )
}
