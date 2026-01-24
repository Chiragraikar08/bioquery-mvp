"use client"

import type React from "react"

import { useState } from "react"
import { RotatingMolecule } from "@/components/RotatingMolecule"
import "./dashboard.css"

interface ModelPrediction {
  sequenceName: string
  prediction: string | number
  confidence: number
  features: Record<string, number>
  analysisType: string
}

interface QueryResult {
  success: boolean
  sequenceName: string
  userQuery: string
  geminiSQLQuery: string
  modelPrediction: ModelPrediction
  timestamp: string
}

export default function DashboardPage() {
  const [sequenceName, setSequenceName] = useState("")
  const [userPrompt, setUserPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<QueryResult | null>(null)
  const [error, setError] = useState("")

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt,
          sequenceName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to process query")
        return
      }

      setResults(data)
      setUserPrompt("")
    } catch (err) {
      setError("Error connecting to server")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>BioQuery Dashboard</h1>
          <p>Analyze genomic sequences with AI-powered intelligence</p>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Left: Query Interface */}
        <div className="query-panel">
          <div className="query-card">
            <h2>Genomic Query Interface</h2>

            <form onSubmit={handleSubmitQuery} className="query-form">
              <div className="form-group">
                <label htmlFor="sequence">DNA Sequence Name</label>
                <input
                  id="sequence"
                  type="text"
                  placeholder="e.g., BRCA1_variant_2024"
                  value={sequenceName}
                  onChange={(e) => setSequenceName(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="prompt">Your Query</label>
                <textarea
                  id="prompt"
                  placeholder="Ask about the sequence... e.g., 'Analyze mutations in this sequence' or 'Find regulatory regions'"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  required
                  className="form-textarea"
                  rows={4}
                />
              </div>

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? "Processing..." : "Analyze Sequence"}
              </button>
            </form>

            {error && <div className="error-message">{error}</div>}

            {results && (
              <div className="results-section">
                <h3>Analysis Results</h3>

                <div className="result-card">
                  <div className="result-header">
                    <span className="result-label">Sequence:</span>
                    <span className="result-value">{results.sequenceName}</span>
                  </div>

                  <div className="result-card">
                    <span className="result-label">Your Query:</span>
                    <p className="result-text">{results.userQuery}</p>
                  </div>

                  {/* Gemini SQL Query */}
                  <div className="result-card">
                    <span className="result-label">Gemini Generated SQL Query:</span>
                    <div className="result-analysis sql-query">{results.geminiSQLQuery}</div>
                  </div>

                  {/* ML Model Predictions */}
                  <div className="result-card">
                    <span className="result-label">ML Model Prediction:</span>
                    <div className="model-results">
                      <div className="prediction-item">
                        <strong>Analysis Type:</strong> {results.modelPrediction.analysisType}
                      </div>
                      <div className="prediction-item">
                        <strong>Prediction:</strong> {results.modelPrediction.prediction}
                      </div>
                      <div className="prediction-item">
                        <strong>Confidence:</strong> {(results.modelPrediction.confidence * 100).toFixed(1)}%
                      </div>

                      <div className="features-grid">
                        <strong>Genomic Features:</strong>
                        {Object.entries(results.modelPrediction.features).map(([key, value]) => (
                          <div key={key} className="feature-item">
                            <span className="feature-name">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                            <span className="feature-value">
                              {typeof value === "number" ? value.toFixed(2) : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="result-footer">
                    <small>Processed: {new Date(results.timestamp).toLocaleString()}</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: 3D DNA Visualization */}
        <div className="visualization-panel">
          <div className="visualization-card">
            <h2>3D Molecular Visualization</h2>
            <div className="dna-container">
              <RotatingMolecule />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
