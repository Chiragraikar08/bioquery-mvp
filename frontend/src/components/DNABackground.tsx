"use client"

import { useEffect, useRef } from "react"
import "./DNABackground.css"

export default function DNABackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    let animationFrameId
    let time = 0

    const drawDNAHelix = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = 0.15

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const radius = 40
      const spacing = 15

      for (let z = -300; z < 300; z += spacing) {
        const x = centerX + Math.cos(time * 0.005 + z * 0.02) * radius
        const y = centerY + Math.sin(time * 0.005 + z * 0.02) * radius
        const size = 2 + Math.sin(z * 0.01 + time * 0.002) * 1.5

        // Draw DNA helix points
        ctx.fillStyle = `hsl(${(z + 300 + time * 0.1) % 360}, 70%, 60%)`
        ctx.fillRect(x, y, size, size)
      }

      ctx.globalAlpha = 1
      time++
      animationFrameId = requestAnimationFrame(drawDNAHelix)
    }

    drawDNAHelix()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="dna-background" />
}
