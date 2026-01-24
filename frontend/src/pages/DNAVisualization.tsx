"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import * as THREE from "three"
import "./DNAVisualization.css"

export default function DNAVisualization() {
  const { sequenceId } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [dnaSequence, setDnaSequence] = useState("ATGCGTAATCGATGCGTAAT")
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [showLegend, setShowLegend] = useState(true)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)

  const nucleotideColors = {
    A: { color: 0xff0000, name: "Adenine", r: 1, g: 0, b: 0 },
    T: { color: 0x0066ff, name: "Thymine", r: 0, g: 0.4, b: 1 },
    G: { color: 0x00cc00, name: "Guanine", r: 0, g: 0.8, b: 0 },
    C: { color: 0xffff00, name: "Cytosine", r: 1, g: 1, b: 0 },
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Three.js scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x0a0e27, 0.1)
    renderer.shadowMap.enabled = true
    containerRef.current.appendChild(renderer.domElement)

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    camera.position.z = 60

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00d9ff, 1)
    pointLight.position.set(50, 50, 50)
    pointLight.castShadow = true
    scene.add(pointLight)

    // Create DNA Helix from sequence
    const group = new THREE.Group()
    const helixRadius = 20
    const spacing = 8
    const nucleotides = dnaSequence.split("")

    const spheres = []

    nucleotides.forEach((nucleotide, i) => {
      const angle = (i / nucleotides.length) * Math.PI * 4
      const x = Math.cos(angle) * helixRadius
      const y = i * spacing - (nucleotides.length * spacing) / 2
      const z = Math.sin(angle) * helixRadius

      const colorData = nucleotideColors[nucleotide] || nucleotideColors.A

      // Create sphere for nucleotide
      const geometry = new THREE.SphereGeometry(3, 32, 32)
      const material = new THREE.MeshStandardMaterial({
        color: colorData.color,
        metalness: 0.3,
        roughness: 0.4,
        emissive: colorData.color,
        emissiveIntensity: 0.3,
      })

      const sphere = new THREE.Mesh(geometry, material)
      sphere.position.set(x, y, z)
      sphere.castShadow = true
      sphere.receiveShadow = true
      sphere.userData = { nucleotide, index: i }

      group.add(sphere)
      spheres.push({ sphere, angle, index: i })
    })

    // Add connecting lines (sugar-phosphate backbone)
    const lineGeometry = new THREE.BufferGeometry()
    const positions = []

    nucleotides.forEach((_, i) => {
      const angle = (i / nucleotides.length) * Math.PI * 4
      const x = Math.cos(angle) * helixRadius
      const y = i * spacing - (nucleotides.length * spacing) / 2
      const z = Math.sin(angle) * helixRadius
      positions.push(x, y, z)
    })

    lineGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3))

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00d9ff, linewidth: 2, transparent: true, opacity: 0.3 })
    const line = new THREE.Line(lineGeometry, lineMaterial)
    group.add(line)

    scene.add(group)

    // Animation loop
    let animationFrameId
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      group.rotation.x = rotation.x
      group.rotation.y = rotation.y

      // Pulsing effect on spheres
      spheres.forEach(({ sphere, index }) => {
        const pulse = Math.sin(Date.now() * 0.003 + index * 0.2) * 0.3 + 1
        sphere.scale.set(pulse, pulse, pulse)
      })

      renderer.render(scene, camera)
    }

    animate()

    // Mouse interaction
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }

    renderer.domElement.addEventListener("mousedown", (e) => {
      isDragging = true
      previousMousePosition = { x: e.clientX, y: e.clientY }
    })

    renderer.domElement.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x
        const deltaY = e.clientY - previousMousePosition.y

        setRotation((prev) => ({
          x: prev.x + deltaY * 0.005,
          y: prev.y + deltaX * 0.005,
        }))

        previousMousePosition = { x: e.clientX, y: e.clientY }
      }
    })

    renderer.domElement.addEventListener("mouseup", () => {
      isDragging = false
    })

    // Zoom with scroll
    renderer.domElement.addEventListener("wheel", (e) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.1
      camera.position.z = Math.max(30, Math.min(150, camera.position.z))
    })

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      renderer.domElement.removeEventListener("mousedown", () => {})
      renderer.domElement.removeEventListener("mousemove", () => {})
      renderer.domElement.removeEventListener("mouseup", () => {})
      renderer.domElement.removeEventListener("wheel", () => {})
      cancelAnimationFrame(animationFrameId)
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [dnaSequence, rotation])

  const toggleLegend = () => setShowLegend(!showLegend)

  const resetRotation = () => setRotation({ x: 0, y: 0 })

  return (
    <div className="dna-visualization">
      <div ref={containerRef} className="visualization-canvas" />

      {/* Top-left Back Button */}
      <button className="back-btn" onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>

      {/* Controls */}
      <div className="controls-panel">
        <div className="control-item">
          <label>DNA Sequence:</label>
          <input
            type="text"
            value={dnaSequence}
            onChange={(e) => setDnaSequence(e.target.value.toUpperCase().replace(/[^ATGC]/g, ""))}
            placeholder="Enter DNA sequence (A, T, G, C)"
            maxLength="100"
          />
        </div>

        <button className="reset-btn" onClick={resetRotation}>
          Reset View
        </button>

        <button className="legend-btn" onClick={toggleLegend}>
          {showLegend ? "Hide" : "Show"} Legend
        </button>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="legend">
          <h3>Nucleotide Colors</h3>
          <div className="legend-items">
            {Object.entries(nucleotideColors).map(([key, { color, name }]) => (
              <div key={key} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: `#${color.toString(16).padStart(6, "0")}` }} />
                <div className="legend-label">
                  <span className="nucleotide-letter">{key}</span>
                  <span className="nucleotide-name">{name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="info-panel">
        <h3>DNA Sequence Visualization</h3>
        <div className="info-item">
          <span className="info-label">Sequence Length:</span>
          <span className="info-value">{dnaSequence.length} bp</span>
        </div>
        <div className="info-item">
          <span className="info-label">Base Composition:</span>
          <div className="composition">
            {Object.keys(nucleotideColors).map((base) => {
              const count = dnaSequence.split("").filter((n) => n === base).length
              const percentage = ((count / dnaSequence.length) * 100).toFixed(1)
              return (
                <div key={base} className="composition-item">
                  <span className="base-letter">{base}:</span>
                  <span className="base-count">
                    {count} ({percentage}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <p className="instructions">Drag to rotate • Scroll to zoom</p>
      </div>
    </div>
  )
}
