"use client"

import { useState, useEffect, useRef } from "react"
import * as THREE from "three"
import { motion, AnimatePresence } from "framer-motion"
import "./SequenceVisualizationModal.css"

interface SequenceData {
  sequence_name: string
  sequence: string
  organism: string
  gene_name: string
  chromosome: string
  description: string
  length: number
  gc_content: number
  created_at: string
}

interface VisualizationModalProps {
  data: any
  description: string
  isOpen: boolean
  onClose: () => void
}

export default function SequenceVisualizationModal({ data, description, isOpen, onClose }: VisualizationModalProps) {
  const [activeTab, setActiveTab] = useState<"3d" | "chart" | "description">("3d")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [helixView, setHelixView] = useState<"single" | "double">("double")
  const [dnaSequence, setDnaSequence] = useState(data?.sequence || "")
  const containerRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)

  const nucleotideColors = {
    A: { color: 0xff4757, name: "Adenine", hex: "#ff4757" },
    T: { color: 0x2ed573, name: "Thymine", hex: "#2ed573" },
    G: { color: 0x1e90ff, name: "Guanine", hex: "#1e90ff" },
    C: { color: 0xffa502, name: "Cytosine", hex: "#ffa502" },
  }

  const [localDescription, setLocalDescription] = useState(description)
  const [baseComposition, setBaseComposition] = useState({
    A: 0,
    T: 0,
    G: 0,
    C: 0,
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && data?.sequence) {
      setDnaSequence(data.sequence || "")
      setActiveTab("3d")
      setHelixView("double")
      setIsFullscreen(false)
      console.log("[v0] Modal opened with data:", {
        name: data.sequence_name,
        length: data.sequence?.length || 0,
        organism: data.organism,
      })
    }
  }, [data, isOpen])

  useEffect(() => {
    if (dnaSequence) {
      const seq = dnaSequence.toUpperCase()
      const composition = {
        A: (seq.match(/A/g) || []).length,
        T: (seq.match(/T/g) || []).length,
        G: (seq.match(/G/g) || []).length,
        C: (seq.match(/C/g) || []).length,
      }
      setBaseComposition(composition)
      console.log("[v0] Base composition calculated:", composition)
    }
  }, [dnaSequence])

  useEffect(() => {
    if (isOpen && data?.sequence) {
      setLoading(true)
      const fetchDescription = async () => {
        try {
          const token = localStorage.getItem("token")
          if (!token) {
            console.warn("[v0] No auth token found")
            return
          }

          console.log("[v0] Fetching Gemini description for:", {
            name: data.sequence_name,
            organism: data.organism,
            gene: data.gene_name,
          })

          const response = await fetch("http://localhost:5000/api/query/get-description", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sequence: data.sequence,
              sequenceName: data.sequence_name,
              organism: data.organism,
              geneName: data.gene_name,
              userQuery: "Analyze this DNA sequence",
            }),
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()
          setLocalDescription(result.description)
          console.log("[v0] Description fetched successfully for:", data.sequence_name)
        } catch (err) {
          console.error("[v0] Failed to fetch description:", err)
          setLocalDescription("Failed to generate description for this sequence")
        } finally {
          setLoading(false)
        }
      }

      fetchDescription()
    }
  }, [isOpen, data])

  useEffect(() => {
    if (!isOpen || activeTab !== "3d" || !containerRef.current) return

    // Clean up previous renderer
    if (rendererRef.current && containerRef.current) {
      containerRef.current.innerHTML = ""
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    )
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setClearColor(0x0a0e27, 0.1)
    renderer.shadowMap.enabled = true
    containerRef.current.appendChild(renderer.domElement)

    sceneRef.current = scene
    rendererRef.current = renderer
    camera.position.z = 120

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x00d9ff, 1.2)
    pointLight1.position.set(150, 100, 150)
    pointLight1.castShadow = true
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xff4757, 0.9)
    pointLight2.position.set(-150, -100, 150)
    pointLight2.castShadow = true
    scene.add(pointLight2)

    const group = new THREE.Group()
    const nucleotides = dnaSequence.toUpperCase().split("")

    if (helixView === "single") {
      const totalSpacing = nucleotides.length * 4
      nucleotides.forEach((nucleotide, i) => {
        // Position in straight line centered horizontally
        const x = -totalSpacing / 2 + i * 4
        const y = 0
        const z = 0

        const colorData = nucleotideColors[nucleotide as keyof typeof nucleotideColors] || nucleotideColors.A
        const geometry = new THREE.SphereGeometry(3.5, 32, 32)
        const material = new THREE.MeshStandardMaterial({
          color: colorData.color,
          metalness: 0.4,
          roughness: 0.3,
          emissive: colorData.color,
          emissiveIntensity: 0.4,
        })

        const sphere = new THREE.Mesh(geometry, material)
        sphere.position.set(x, y, z)
        sphere.castShadow = true
        sphere.receiveShadow = true
        sphere.userData = { nucleotide, index: i }

        group.add(sphere)

        // Connect adjacent nucleotides with tube-like backbone
        if (i > 0) {
          const prevX = -totalSpacing / 2 + (i - 1) * 4
          const lineGeometry = new THREE.BufferGeometry()
          lineGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array([prevX, 0, 0, x, 0, 0]), 3))
          const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00d9ff,
            linewidth: 3,
            transparent: true,
            opacity: 0.8,
          })
          const line = new THREE.Line(lineGeometry, lineMaterial)
          group.add(line)
        }
      })
    } else {
      const helixRadius = 25
      const verticalSpacing = 4
      const rotations = Math.max(2, Math.ceil(nucleotides.length / 20))

      const getComplementaryBase = (base: string): string => {
        const complement: { [key: string]: string } = { A: "T", T: "A", G: "C", C: "G" }
        return complement[base] || "N"
      }

      const verticalRange = nucleotides.length * verticalSpacing
      const nucleotideSpheres: any[] = []

      nucleotides.forEach((nucleotide, i) => {
        // Calculate position in helix
        const angle = (i / nucleotides.length) * Math.PI * 2 * rotations
        const y = -verticalRange / 2 + i * verticalSpacing

        // Strand 1 - Strand A (front left)
        const x1 = Math.cos(angle) * helixRadius
        const z1 = Math.sin(angle) * helixRadius

        const colorData1 = nucleotideColors[nucleotide as keyof typeof nucleotideColors] || nucleotideColors.A
        const geometry1 = new THREE.SphereGeometry(3.2, 32, 32)
        const material1 = new THREE.MeshStandardMaterial({
          color: colorData1.color,
          metalness: 0.4,
          roughness: 0.3,
          emissive: colorData1.color,
          emissiveIntensity: 0.35,
        })

        const sphere1 = new THREE.Mesh(geometry1, material1)
        sphere1.position.set(x1, y, z1)
        sphere1.castShadow = true
        sphere1.receiveShadow = true
        sphere1.userData = { nucleotide, index: i, strand: 1 }

        group.add(sphere1)
        nucleotideSpheres.push({ position: new THREE.Vector3(x1, y, z1), nucleotide, sphere: sphere1 })

        // Strand 2 - Complementary strand (back right)
        const complementary = getComplementaryBase(nucleotide)
        const angle2 = angle + Math.PI
        const x2 = Math.cos(angle2) * helixRadius
        const z2 = Math.sin(angle2) * helixRadius

        const colorData2 = nucleotideColors[complementary as keyof typeof nucleotideColors] || nucleotideColors.A
        const geometry2 = new THREE.SphereGeometry(3.2, 32, 32)
        const material2 = new THREE.MeshStandardMaterial({
          color: colorData2.color,
          metalness: 0.4,
          roughness: 0.3,
          emissive: colorData2.color,
          emissiveIntensity: 0.35,
        })

        const sphere2 = new THREE.Mesh(geometry2, material2)
        sphere2.position.set(x2, y, z2)
        sphere2.castShadow = true
        sphere2.receiveShadow = true
        sphere2.userData = { nucleotide: complementary, index: i, strand: 2 }

        group.add(sphere2)
        nucleotideSpheres.push({ position: new THREE.Vector3(x2, y, z2), nucleotide: complementary, sphere: sphere2 })

        // Base pair hydrogen bonds (connection lines)
        const connectionLineGeometry = new THREE.BufferGeometry()
        connectionLineGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(new Float32Array([x1, y, z1, x2, y, z2]), 3),
        )
        const connectionLineMaterial = new THREE.LineBasicMaterial({
          color: 0x00d9ff,
          linewidth: 2,
          transparent: true,
          opacity: 0.5,
        })
        const connectionLine = new THREE.Line(connectionLineGeometry, connectionLineMaterial)
        group.add(connectionLine)
      })

      // Create smooth backbone curves for both strands
      const createBackboneCurve = (strand: number) => {
        const positions: number[] = []
        nucleotides.forEach((_, i) => {
          const angle =
            strand === 1
              ? (i / nucleotides.length) * Math.PI * 2 * rotations
              : (i / nucleotides.length) * Math.PI * 2 * rotations + Math.PI
          const y = -verticalRange / 2 + i * verticalSpacing
          const x = Math.cos(angle) * helixRadius
          const z = Math.sin(angle) * helixRadius
          positions.push(x, y, z)
        })

        const lineGeometry = new THREE.BufferGeometry()
        lineGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3))
        const lineMaterial = new THREE.LineBasicMaterial({
          color: strand === 1 ? 0x00d9ff : 0xff00ff,
          linewidth: 4,
          transparent: true,
          opacity: 0.7,
        })
        const line = new THREE.Line(lineGeometry, lineMaterial)
        group.add(line)
      }

      createBackboneCurve(1)
      createBackboneCurve(2)
    }

    scene.add(group)

    // Animation
    let animationFrameId: number

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // Auto-rotate at slower speed
      group.rotation.y += 0.002

      // Pulsing effect on nucleotides
      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const index = child.userData?.index || 0
          const pulse = Math.sin(Date.now() * 0.002 + index * 0.1) * 0.15 + 1
          child.scale.set(pulse, pulse, pulse)
        }
      })

      renderer.render(scene, camera)
    }

    animate()

    // Mouse interaction
    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      previousMousePosition = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x
        const deltaY = e.clientY - previousMousePosition.y

        group.rotation.x += deltaY * 0.005
        group.rotation.y += deltaX * 0.005

        previousMousePosition = { x: e.clientX, y: e.clientY }
      }
    }

    const onMouseUp = () => {
      isDragging = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      camera.position.z += e.deltaY * 0.1
      camera.position.z = Math.max(60, Math.min(250, camera.position.z))
    }

    renderer.domElement.addEventListener("mousedown", onMouseDown)
    renderer.domElement.addEventListener("mousemove", onMouseMove)
    renderer.domElement.addEventListener("mouseup", onMouseUp)
    renderer.domElement.addEventListener("wheel", onWheel)

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
      renderer.domElement.removeEventListener("mousedown", onMouseDown)
      renderer.domElement.removeEventListener("mousemove", onMouseMove)
      renderer.domElement.removeEventListener("mouseup", onMouseUp)
      renderer.domElement.removeEventListener("wheel", onWheel)
      cancelAnimationFrame(animationFrameId)
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [isOpen, activeTab, dnaSequence, helixView])

  const displayDescription = localDescription || description

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`modal-overlay ${isFullscreen ? "fullscreen-modal" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isFullscreen ? undefined : onClose}
        >
          <motion.div
            className={`modal-content ${isFullscreen ? "fullscreen-content" : ""}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="header-info">
                <h2>{data?.sequence_name || "DNA Sequence"}</h2>
                <p>
                  {data?.organism || ""} • {data?.gene_name || ""} • Chromosome {data?.chromosome || ""}
                </p>
              </div>
              <div className="header-controls">
                {activeTab === "3d" && (
                  <button
                    className="fullscreen-btn"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? "⊡ Exit" : "⛶ Fullscreen"}
                  </button>
                )}
                <button className="close-btn" onClick={onClose}>
                  ✕
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button className={`tab ${activeTab === "3d" ? "active" : ""}`} onClick={() => setActiveTab("3d")}>
                🧬 3D Visualization
              </button>
              <button className={`tab ${activeTab === "chart" ? "active" : ""}`} onClick={() => setActiveTab("chart")}>
                📊 Base Composition
              </button>
              <button
                className={`tab ${activeTab === "description" ? "active" : ""}`}
                onClick={() => setActiveTab("description")}
              >
                📄 Description
              </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              {activeTab === "3d" && (
                <div className="tab-3d-container">
                  {helixView === "double" && (
                    <div className="helix-controls">
                      <button
                        className={`helix-btn ${helixView === "single" ? "" : "active"}`}
                        onClick={() => setHelixView("double")}
                      >
                        Double Helix
                      </button>
                      <button
                        className={`helix-btn ${helixView === "single" ? "active" : ""}`}
                        onClick={() => setHelixView("single")}
                      >
                        Single Strand
                      </button>
                    </div>
                  )}
                  <div className="canvas-container" ref={containerRef} />
                </div>
              )}
              {activeTab === "chart" && (
                <div className="chart-content">
                  <h3>Base Composition Analysis</h3>
                  <p style={{ color: "#888", fontSize: "14px" }}>Total bases: {dnaSequence.length}</p>

                  <div className="composition-grid">
                    {[
                      { base: "A", name: "Adenine", color: nucleotideColors.A.hex },
                      { base: "T", name: "Thymine", color: nucleotideColors.T.hex },
                      { base: "G", name: "Guanine", color: nucleotideColors.G.hex },
                      { base: "C", name: "Cytosine", color: nucleotideColors.C.hex },
                    ].map(({ base, name, color }) => {
                      const count = baseComposition[base as keyof typeof baseComposition]
                      const percentage = dnaSequence.length > 0 ? ((count / dnaSequence.length) * 100).toFixed(1) : 0
                      return (
                        <div key={base} className="composition-card">
                          <div className="composition-header">
                            <div
                              className="composition-icon"
                              style={{
                                backgroundColor: color,
                              }}
                            >
                              {base}
                            </div>
                            <span className="composition-name">{name}</span>
                          </div>
                          <div className="composition-bar-container">
                            <div
                              className="composition-bar"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <div className="composition-stats">
                            <span className="stat-label">COUNT:</span>
                            <span className="stat-value" style={{ color }}>
                              {count}
                            </span>
                            <span className="stat-label">PERCENTAGE:</span>
                            <span className="stat-value" style={{ color }}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {(() => {
                    const gcCount = baseComposition.G + baseComposition.C
                    const atCount = baseComposition.A + baseComposition.T
                    const total = dnaSequence.length
                    const gcPercentage = total > 0 ? ((gcCount / total) * 100).toFixed(1) : 0
                    const atPercentage = total > 0 ? ((atCount / total) * 100).toFixed(1) : 0

                    return (
                      <div className="gc-content-analysis">
                        <h4>GC Content Analysis</h4>
                        <div className="gc-stats">
                          <div className="gc-stat-card">
                            <span className="gc-label">Total GC</span>
                            <span className="gc-value" style={{ color: "#00d9ff" }}>
                              {gcPercentage}%
                            </span>
                          </div>
                          <div className="gc-stat-card">
                            <span className="gc-label">Total AT</span>
                            <span className="gc-value" style={{ color: "#2ed573" }}>
                              {atPercentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Description Tab */}
              {activeTab === "description" && (
                <div className="description-content">
                  <h3>Sequence Description</h3>
                  {loading && <p style={{ color: "#888" }}>Loading description from AI...</p>}
                  <div className="description-text">{displayDescription}</div>

                  {data && (
                    <div className="metadata-section">
                      <h4>Sequence Metadata</h4>
                      <div className="metadata-grid">
                        <div className="metadata-item">
                          <span className="metadata-label">Sequence Name:</span>
                          <span className="metadata-value">{data.sequence_name}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Organism:</span>
                          <span className="metadata-value">{data.organism}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Gene:</span>
                          <span className="metadata-value">{data.gene_name || "N/A"}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Chromosome:</span>
                          <span className="metadata-value">{data.chromosome || "N/A"}</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Length:</span>
                          <span className="metadata-value">{data.length} bp</span>
                        </div>
                        <div className="metadata-item">
                          <span className="metadata-label">Created:</span>
                          <span className="metadata-value">{new Date(data.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="sequence-display">
                        <h4>Full Sequence</h4>
                        <div className="sequence-text">{dnaSequence}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
