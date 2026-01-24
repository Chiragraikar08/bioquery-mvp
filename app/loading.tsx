"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import "./loading.css"

export default function LoadingPage() {
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
    renderer.setClearColor(0x0a0e1a, 0)
    containerRef.current.appendChild(renderer.domElement)

    camera.position.z = 50

    // Create DNA Helix Group
    const dnaGroup = new THREE.Group()

    const nucleotideColors = {
      A: 0xff4757, // Red
      T: 0x2ed573, // Green
      G: 0x1e90ff, // Blue
      C: 0xffa502, // Orange
    }

    const nucleotides = ["A", "T", "G", "C"]
    const spheres = []

    // Create main DNA helix with better geometry
    for (let i = 0; i < 250; i++) {
      const angle = (i / 250) * Math.PI * 10
      const x = Math.cos(angle) * 22
      const y = i * 0.6 - 75
      const z = Math.sin(angle) * 22

      const nucleotide = nucleotides[i % 4]
      const geometry = new THREE.SphereGeometry(2.8, 32, 32)
      const material = new THREE.MeshStandardMaterial({
        color: nucleotideColors[nucleotide],
        emissive: nucleotideColors[nucleotide],
        emissiveIntensity: 0.7,
        metalness: 0.3,
        roughness: 0.3,
      })

      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(x, y, z)
      sphere.castShadow = true
      sphere.receiveShadow = true
      sphere.userData = { angle, index: i, nucleotide }

      dnaGroup.add(sphere)
      spheres.push(sphere)
    }

    // Add backbone lines for DNA structure
    const lineGeometry = new THREE.BufferGeometry()
    const positions = []

    for (let i = 0; i < 250; i++) {
      const angle = (i / 250) * Math.PI * 10
      const x = Math.cos(angle) * 22
      const y = i * 0.6 - 75
      const z = Math.sin(angle) * 22
      positions.push(x, y, z)
    }

    lineGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3))
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00d9ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.4,
    })
    const line = new THREE.Line(lineGeometry, lineMaterial)
    dnaGroup.add(line)

    scene.add(dnaGroup)

    // Enhanced Lighting for better visual effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x00d9ff, 2)
    pointLight1.position.set(60, 40, 80)
    pointLight1.castShadow = true
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff4757, 1.2)
    pointLight2.position.set(-60, -40, 60)
    scene.add(pointLight2)

    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Continuous smooth rotation
      dnaGroup.rotation.x += 0.001
      dnaGroup.rotation.y += 0.002

      // Pulsing effect on nucleotides
      spheres.forEach((sphere, i) => {
        const pulse = Math.sin(Date.now() * 0.004 + i * 0.08) * 0.3 + 1
        sphere.scale.set(pulse, pulse, pulse)
      })

      renderer.render(scene, camera)
    }

    animate()

    // Handle window resize
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
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="loading-container">
      <div ref={containerRef} className="loading-canvas" />

      <div className="loading-content">
        <h1 className="loading-title">Welcome to BioQuery</h1>
        <p className="loading-subtitle">Exploring the Language of Life</p>

        <div className="loading-spinner">
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
          <div className="spinner-dot"></div>
          <span className="spinner-text">Initializing...</span>
        </div>
      </div>
    </div>
  )
}
