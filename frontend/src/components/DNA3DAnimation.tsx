"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import "./DNA3DAnimation.css"

export default function DNA3DAnimation() {
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clean up old renderer if it exists
    if (rendererRef.current && containerRef.current?.contains(rendererRef.current.domElement)) {
      containerRef.current.removeChild(rendererRef.current.domElement)
    }

    // Scene setup with proper dimensions
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x08111f, 0)
    renderer.shadowMap.enabled = true
    containerRef.current.appendChild(renderer.domElement)

    sceneRef.current = scene
    rendererRef.current = renderer

    camera.position.z = 60

    // Create DNA Helix Group
    const group = new THREE.Group()

    const nucleotideColors = {
      A: 0xff4757, // Vibrant Red
      T: 0x2ed573, // Vibrant Green
      G: 0x1e90ff, // Vibrant Blue
      C: 0xffa502, // Vibrant Orange
    }

    const nucleotides = ["A", "T", "G", "C"]
    const spheres = []

    // Create main DNA helix with proper geometry
    const numBases = 150
    const helixRadius = 20
    const verticalSpacing = 0.8

    for (let i = 0; i < numBases; i++) {
      const angle = (i / numBases) * Math.PI * 12
      const x = Math.cos(angle) * helixRadius
      const y = i * verticalSpacing - (numBases * verticalSpacing) / 2
      const z = Math.sin(angle) * helixRadius

      const nucleotide = nucleotides[i % 4]
      const geometry = new THREE.SphereGeometry(2.8, 32, 32)
      const material = new THREE.MeshStandardMaterial({
        color: nucleotideColors[nucleotide as keyof typeof nucleotideColors],
        emissive: nucleotideColors[nucleotide as keyof typeof nucleotideColors],
        emissiveIntensity: 0.6,
        metalness: 0.4,
        roughness: 0.3,
      })

      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(x, y, z)
      sphere.castShadow = true
      sphere.receiveShadow = true
      sphere.userData = { angle, index: i, nucleotide }

      group.add(sphere)
      spheres.push(sphere)
    }

    // Add backbone lines
    const lineGeometry = new THREE.BufferGeometry()
    const positions = []

    for (let i = 0; i < numBases; i++) {
      const angle = (i / numBases) * Math.PI * 12
      const x = Math.cos(angle) * helixRadius
      const y = i * verticalSpacing - (numBases * verticalSpacing) / 2
      const z = Math.sin(angle) * helixRadius
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
    group.add(line)

    scene.add(group)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x00d9ff, 1.8)
    pointLight1.position.set(80, 50, 80)
    pointLight1.castShadow = true
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff4757, 1)
    pointLight2.position.set(-80, -50, 80)
    scene.add(pointLight2)

    // Animation loop
    let animationId: number
    let mouseX = 0
    let mouseY = 0

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Auto-rotate with subtle mouse interaction
      group.rotation.x += 0.001 + mouseY * 0.0001
      group.rotation.y += 0.003 + mouseX * 0.0001

      // Pulsing effect on nucleotides
      spheres.forEach((sphere, i) => {
        const pulse = Math.sin(Date.now() * 0.004 + i * 0.08) * 0.3 + 1
        sphere.scale.set(pulse, pulse, pulse)
      })

      renderer.render(scene, camera)
    }

    animate()

    // Mouse interaction
    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener("mousemove", onMouseMove)

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight

      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="dna-animation-container" />
}
