"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function RotatingMolecule() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setClearColor(0x000000, 0)
    containerRef.current.appendChild(renderer.domElement)

    camera.position.z = 30

    const moleculeGroup = new THREE.Group()
    const colors = [0x1e90ff, 0xff4757, 0x2ed573, 0xffa502, 0x00d9ff]
    const nodePositions = [
      [0, 10, 0],
      [-8, 5, 0],
      [8, 5, 0],
      [-12, -5, 0],
      [12, -5, 0],
      [0, -12, 0],
      [-6, -15, 0],
      [6, -15, 0],
    ]

    // Create nodes (spheres)
    nodePositions.forEach((pos, i) => {
      const geometry = new THREE.SphereGeometry(2.5, 32, 32)
      const material = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        emissive: colors[i % colors.length],
        emissiveIntensity: 0.6,
        metalness: 0.4,
        roughness: 0.3,
      })
      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(pos[0], pos[1], pos[2])
      sphere.castShadow = true
      moleculeGroup.add(sphere)
    })

    // Create connections (lines)
    const connections = [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 4],
      [3, 5],
      [4, 5],
      [5, 6],
      [5, 7],
    ]

    connections.forEach(([start, end]) => {
      const startPos = nodePositions[start]
      const endPos = nodePositions[end]
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([...startPos, ...endPos]), 3))
      const material = new THREE.LineBasicMaterial({
        color: 0x00d9ff,
        opacity: 0.5,
        transparent: true,
        linewidth: 2,
      })
      const line = new THREE.Line(geometry, material)
      moleculeGroup.add(line)
    })

    scene.add(moleculeGroup)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00d9ff, 1)
    pointLight.position.set(20, 20, 20)
    scene.add(pointLight)

    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      moleculeGroup.rotation.x += 0.005
      moleculeGroup.rotation.y += 0.008
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      if (!containerRef.current) return
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
