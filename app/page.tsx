"use client"

import Link from "next/link"
import { RotatingMolecule } from "@/components/RotatingMolecule"
import "./page.css"

export default function HomePage() {
  return (
    <div className="home-page">
      {/* Navigation */}
      <nav className="nav-bar">
        <div className="nav-content">
          <div className="logo">
            <span className="logo-icon">B</span> BioQuery
          </div>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </div>
          <Link href="/signin" className="btn-nav">
            Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="ai-badge">
              <span className="badge-icon">⚡</span>
              AI-Powered Genomic Intelligence
            </div>
            <h1 className="hero-title">
              Welcome to <span className="text-cyan">BioQuery</span>
            </h1>
            <p className="hero-description">
              Unlock the secrets of the genome with our revolutionary AI-powered query platform and stunning 3D
              visualizations.
            </p>
            <div className="hero-buttons">
              <Link href="/dashboard" className="btn btn-primary">
                Start Exploring <span>↓</span>
              </Link>
              <button className="btn btn-secondary">Learn More</button>
            </div>
          </div>

          <div className="hero-visual">
            <RotatingMolecule />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="scroll-dot"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Powerful Features</h2>
          <p>Everything you need for advanced genomic analysis</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🧬</div>
            <h3>3D Visualization</h3>
            <p>Interactive 3D DNA and molecular structures with full control and real-time rendering</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Analysis</h3>
            <p>Natural language processing for intelligent genomic queries powered by advanced AI</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Data Management</h3>
            <p>Secure storage and comprehensive analytics for genomic datasets</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Enterprise Security</h3>
            <p>Bank-grade security with role-based access control and compliance</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="about-content">
          <h2>Why Choose BioQuery?</h2>
          <div className="about-grid">
            <div className="about-card">
              <h3>Advanced Technology</h3>
              <p>Cutting-edge AI algorithms combined with scientific accuracy for genomic research.</p>
            </div>
            <div className="about-card">
              <h3>Research-Focused</h3>
              <p>Built by researchers, for researchers. Designed for modern genomic workflows.</p>
            </div>
            <div className="about-card">
              <h3>Real-time Insights</h3>
              <p>Get instant analysis and visualization of complex genomic data patterns.</p>
            </div>
            <div className="about-card">
              <h3>Global Community</h3>
              <p>Join thousands of scientists accelerating discovery with AI-powered analysis.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Unlock Genomic Insights?</h2>
        <p>Start analyzing your genomic data with AI-powered intelligence today</p>
        <Link href="/signup" className="btn btn-primary">
          Sign Up Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 BioQuery. Advancing genomic research through AI.</p>
      </footer>
    </div>
  )
}
