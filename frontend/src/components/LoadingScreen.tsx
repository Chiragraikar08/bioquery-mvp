"use client"

import { useEffect, useState } from "react"
import "./LoadingScreen.css"

export default function LoadingScreen() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="loading-screen">
      <div className="loader-container">
        <div className="dna-loader">
          <div className="helix helix-1"></div>
          <div className="helix helix-2"></div>
          <div className="helix helix-3"></div>
        </div>
        <h1 className="loading-text">BioQuery</h1>
        <p className="loading-subtext">Initializing AI-Powered Genomic Intelligence</p>
      </div>
    </div>
  )
}
