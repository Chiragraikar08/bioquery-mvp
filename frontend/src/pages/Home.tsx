"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import DNA3DAnimation from "../components/DNA3DAnimation"
import "./Home.css"

export default function Home() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState(0)

  const isLoggedIn = !!localStorage.getItem("token")

  const handleStartExploring = () => {
    if (isLoggedIn) {
      navigate("/dashboard")
    } else {
      navigate("/signup")
    }
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <DNA3DAnimation />
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text"
          >
            <div className="hero-badge">✦ New · AI-Powered Genomics Platform</div>
            <h1 className="hero-title">Welcome to BioQuery</h1>
            <p className="hero-subtitle">AI-Powered Genomic Intelligence</p>
            <p className="hero-description">
              Unlock the secrets of your genome with advanced AI analysis, interactive 3D visualization, and real-time
              insights into genomic sequences.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-buttons"
          >
            <button className="primary-btn" onClick={handleStartExploring}>
              {isLoggedIn ? "Go to Dashboard" : "Start Exploring →"}
            </button>
            <button className="secondary-btn" onClick={() => scrollToSection("features")}>
              Learn More
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hero-stats"
          >
            <div className="hero-stat">
              <div className="hero-stat-value">10K+</div>
              <div className="hero-stat-label">Researchers</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">50M+</div>
              <div className="hero-stat-label">Sequences Analyzed</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">99.9%</div>
              <div className="hero-stat-label">Accuracy</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <h2 className="section-title">Why Choose BioQuery?</h2>
        <p className="section-subtitle">Everything you need to explore, analyze, and understand genomic data — all in one place.</p>

        <div className="features-grid">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="feature-card"
          >
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Analysis</h3>
            <p>Leverage advanced AI algorithms to analyze genomic data and extract meaningful insights in seconds.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="feature-card"
          >
            <div className="feature-icon">🧬</div>
            <h3>3D Visualization</h3>
            <p>
              Explore DNA sequences in stunning 3D with interactive helix visualization and color-coded nucleotides.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="feature-card"
          >
            <div className="feature-icon">⚡</div>
            <h3>Real-Time Processing</h3>
            <p>Query genomic databases instantly and receive comprehensive analysis reports in real-time.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="feature-card"
          >
            <div className="feature-icon">🔒</div>
            <h3>Secure & Private</h3>
            <p>Your genomic data is encrypted and protected with enterprise-grade security measures.</p>
          </motion.div>
        </div>
      </section>

      {/* DNA Explanation Section */}
      <section id="dna-info" className="info-section">
        <div className="info-container">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="info-text"
          >
            <h2>Understanding DNA</h2>
            <p>
              DNA (deoxyribonucleic acid) is the molecule that carries the genetic instructions for all living
              organisms. It consists of four nucleotide bases: Adenine (A), Thymine (T), Guanine (G), and Cytosine (C).
            </p>
            <p>
              The sequence of these bases encodes proteins and other essential molecules. Modern genomics uses advanced
              computational techniques to analyze these sequences and uncover genetic variations, mutations, and
              patterns that can provide insights into disease susceptibility, evolution, and biological function.
            </p>
            <ul className="info-list">
              <li>Adenine (A) - Purine base</li>
              <li>Thymine (T) - Pyrimidine base</li>
              <li>Guanine (G) - Purine base</li>
              <li>Cytosine (C) - Pyrimidine base</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="info-visual"
          >
            <div className="dna-structure">
              <div className="nucleotide a">A</div>
              <div className="nucleotide t">T</div>
              <div className="nucleotide g">G</div>
              <div className="nucleotide c">C</div>
              <div className="nucleotide a">A</div>
              <div className="nucleotide g">G</div>
              <div className="nucleotide t">T</div>
              <div className="nucleotide c">C</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Genomics Section */}
      <section id="genomics" className="genomics-section">
        <h2 className="section-title">Genomics & Bioinformatics</h2>

        <div className="genomics-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="genomics-card"
          >
            <h3>Sequence Analysis</h3>
            <p>
              Analyze DNA sequences to identify genes, promoters, regulatory elements, and other functional regions. Use
              alignment tools to compare sequences across species.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="genomics-card"
          >
            <h3>Variant Detection</h3>
            <p>
              Identify single nucleotide polymorphisms (SNPs), insertions, deletions, and other genetic variations that
              may contribute to disease or phenotypic traits.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="genomics-card"
          >
            <h3>Gene Expression</h3>
            <p>
              Explore how genes are expressed in different tissues and conditions. Understand regulatory mechanisms and
              gene interactions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section id="mission" className="mission-section">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h2 className="section-title">Our Vision & Mission</h2>

          <div className="mission-container">
            <div className="mission-card">
              <h3>Vision</h3>
              <p>
                To democratize genomic research by providing accessible, powerful tools for scientists, researchers, and
                students worldwide to understand and analyze genetic data.
              </p>
            </div>

            <div className="mission-card">
              <h3>Mission</h3>
              <p>
                We aim to bridge the gap between raw genomic data and actionable insights through AI-powered analysis,
                intuitive visualization, and collaborative research platforms.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="cta-content"
        >
          <h2>Ready to Explore <span>Your Genome?</span></h2>
          <p>Join thousands of researchers and scientists using BioQuery to unlock the secrets of genomic data through AI-powered analysis.</p>
          <button className="cta-btn" onClick={handleStartExploring}>
            {isLoggedIn ? "Go to Dashboard →" : "Get Started Free →"}
          </button>
        </motion.div>
      </section>
    </div>
  )
}
