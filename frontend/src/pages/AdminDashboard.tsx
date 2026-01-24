"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import Papa from "papaparse"
import "./AdminDashboard.css"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [uploadMode, setUploadMode] = useState("csv") // csv or prompt
  const [csvData, setCsvData] = useState([])
  const [promptInput, setPromptInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("info") // info, success, error
  const [stats, setStats] = useState({ records: 0, users: 0, queries: 0 })
  const fileInputRef = useRef(null)

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch overview statistics
      const historyRes = await axios.get(`${API_URL}/query/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStats((prev) => ({
        ...prev,
        queries: historyRes.data?.length || 0,
      }))
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          // Filter out empty rows
          const filteredData = results.data.filter((row) => Object.values(row).some((val) => val && String(val).trim()))

          setCsvData(filteredData)
          setMessage(`Loaded ${filteredData.length} records successfully`)
          setMessageType("success")
          console.log("[v0] CSV Data loaded:", filteredData.length, "total records")
        } else {
          setMessage("CSV file is empty or invalid format")
          setMessageType("error")
        }
      },
      error: (error) => {
        setMessage(`Error parsing CSV: ${error.message}`)
        setMessageType("error")
        console.error("[v0] CSV Parse Error:", error)
      },
    })
  }

  const handleCSVUpload = async () => {
    if (csvData.length === 0) {
      setMessage("Please upload a CSV file first")
      setMessageType("error")
      return
    }

    setLoading(true)
    setMessage("Validating and uploading genomic data...")
    setMessageType("info")

    try {
      const mappedData = csvData.map((row) => ({
        sequence: row.dna_sequence || row.sequence, // Maps dna_sequence CSV column to sequence in DB
        sequence_name: row.sequence_name || row.gene_name || "Unknown",
        gene_name: row.gene_name || "Unknown",
        organism: row.organism || "Unknown",
        chromosome: row.chromosome || null,
        description: row.description || null,
        length: row.length ? Number.parseInt(row.length) : null,
        gc_content: row.gc_content ? Number.parseFloat(row.gc_content) : null,
      }))

      const requiredFields = ["sequence", "gene_name", "organism"]
      const missingFields = []

      if (mappedData.length > 0) {
        const firstRow = mappedData[0]
        requiredFields.forEach((field) => {
          if (!firstRow[field] || String(firstRow[field]).trim() === "") {
            missingFields.push(field)
          }
        })
      }

      if (missingFields.length > 0) {
        setMessage(`Missing required CSV columns: ${missingFields.join(", ")}`)
        setMessageType("error")
        setLoading(false)
        return
      }

      console.log("[v0] Uploading CSV data:", mappedData.length, "records with mapped columns")

      const response = await axios.post(
        `${API_URL}/admin/add-genomic-data`,
        { data: mappedData },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setMessage(`Successfully uploaded ${response.data?.count || mappedData.length} records to database`)
      setMessageType("success")
      setCsvData([])
      fileInputRef.current.value = ""

      // Refresh stats
      setTimeout(() => fetchStats(), 1000)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Upload failed"
      setMessage(errorMsg)
      setMessageType("error")
      console.error("[v0] Upload Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handlePromptSubmit = async () => {
    if (!promptInput.trim()) {
      setMessage("Please enter a prompt")
      setMessageType("error")
      return
    }

    setLoading(true)
    setMessage("Processing prompt with AI (Gemini)...")
    setMessageType("info")

    try {
      console.log("[v0] Sending AI prompt:", promptInput)

      const response = await axios.post(
        `${API_URL}/query/execute`,
        { userQuery: promptInput },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      console.log("[v0] AI Prompt Response:", response.data)

      if (response.data?.results && response.data.results.length > 0) {
        setMessage(
          `AI processed prompt and found ${response.data.results.length} results. Data has been added to system.`,
        )
        setMessageType("success")
      } else {
        setMessage("AI processed the prompt successfully but returned no results")
        setMessageType("info")
      }

      setPromptInput("")

      // Refresh stats
      setTimeout(() => fetchStats(), 1000)
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "AI processing failed"
      setMessage(errorMsg)
      setMessageType("error")
      console.error("[v0] AI Prompt Error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage genomic data and system settings</p>
      </div>

      <div className="dashboard-tabs">
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button className={`tab ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")}>
          Upload Data
        </button>
        <button className={`tab ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
          Settings
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tab-content">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Genomic Records</h3>
              <p className="stat-value">{stats.records}</p>
              <p className="stat-label">Records in database</p>
            </div>

            <div className="stat-card">
              <h3>Active Users</h3>
              <p className="stat-value">{stats.users}</p>
              <p className="stat-label">Registered users</p>
            </div>

            <div className="stat-card">
              <h3>Total Queries</h3>
              <p className="stat-value">{stats.queries}</p>
              <p className="stat-label">Executed this month</p>
            </div>

            <div className="stat-card">
              <h3>System Status</h3>
              <p className="stat-value status-active">Active</p>
              <p className="stat-label">All systems operational</p>
            </div>
          </div>

          <div className="recent-activity">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-time">Just now</span>
                <span className="activity-text">System initialized</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upload Data Tab */}
      {activeTab === "upload" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tab-content">
          <div className="upload-container">
            <div className="upload-modes">
              <button
                className={`mode-btn ${uploadMode === "csv" ? "active" : ""}`}
                onClick={() => setUploadMode("csv")}
              >
                CSV Upload
              </button>
              <button
                className={`mode-btn ${uploadMode === "prompt" ? "active" : ""}`}
                onClick={() => setUploadMode("prompt")}
              >
                AI Prompt Input
              </button>
            </div>

            {uploadMode === "csv" && (
              <div className="upload-section">
                <h2>Upload Genomic Data (CSV)</h2>
                <p>CSV must contain: dna_sequence, gene_name, organism (optional: chromosome, position)</p>

                <div className="file-upload">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.txt"
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                  <button className="browse-btn" onClick={() => fileInputRef.current?.click()}>
                    Choose File
                  </button>
                  <span className="file-name">
                    {csvData.length > 0 ? `${csvData.length} records loaded` : "No file selected"}
                  </span>
                </div>

                {csvData.length > 0 && (
                  <div className="preview-section">
                    <h3>Preview Data ({csvData.length} records total)</h3>
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            {csvData.length > 0 && Object.keys(csvData[0]).map((key) => <th key={key}>{key}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.map((row, idx) => (
                            <tr key={idx}>
                              {Object.values(row).map((val, i) => (
                                <td key={i}>{String(val).substring(0, 50) || "—"}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="preview-count">Showing all {csvData.length} records</p>
                  </div>
                )}

                <button className="upload-btn" onClick={handleCSVUpload} disabled={loading || csvData.length === 0}>
                  {loading ? "Uploading..." : "Upload Data"}
                </button>
              </div>
            )}

            {uploadMode === "prompt" && (
              <div className="upload-section">
                <h2>Add Genomic Data via AI</h2>
                <p>Describe genomic sequences to add using natural language. AI will convert to SQL and execute.</p>

                <textarea
                  className="prompt-input"
                  placeholder="Example: Add DNA sequences for BRCA1 and TP53 genes from Homo sapiens on chromosome 17&#10;Or: Find all sequences containing ATGC pattern in the database&#10;Or: Get the first 100 base pairs of human chromosome 1"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  rows={8}
                />

                <div className="prompt-info">
                  <p>AI will understand natural queries like:</p>
                  <ul>
                    <li>"Show me all genes from Homo sapiens"</li>
                    <li>"Find sequences with GC content above 50%"</li>
                    <li>"Get BRCA1 gene information"</li>
                  </ul>
                </div>

                <button className="upload-btn" onClick={handlePromptSubmit} disabled={loading || !promptInput.trim()}>
                  {loading ? "Processing with AI..." : "Process with AI (Gemini)"}
                </button>
              </div>
            )}

            {message && (
              <div className={`message-box message-${messageType}`}>
                <span>{message}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tab-content">
          <div className="settings-container">
            <div className="settings-section">
              <h2>Database Configuration</h2>
              <div className="setting-item">
                <label>Supabase Status</label>
                <span className="status-indicator active">Connected</span>
              </div>
              <div className="setting-item">
                <label>MongoDB Status</label>
                <span className="status-indicator active">Connected</span>
              </div>
            </div>

            <div className="settings-section">
              <h2>API Configuration</h2>
              <div className="setting-item">
                <label>Gemini API Status</label>
                <span className="status-indicator active">Configured</span>
              </div>
              <div className="setting-item">
                <label>Email Service Status</label>
                <span className="status-indicator active">Active</span>
              </div>
            </div>

            <div className="settings-section">
              <h2>Security Settings</h2>
              <div className="setting-item">
                <label>JWT Token Expiry</label>
                <span className="setting-value">24 hours</span>
              </div>
              <div className="setting-item">
                <label>OTP Expiry</label>
                <span className="setting-value">10 minutes</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </main>
  )
}
