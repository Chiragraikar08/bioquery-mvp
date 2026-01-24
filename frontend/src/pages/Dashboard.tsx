"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import "./Dashboard.css"
import SequenceVisualizationModal from "../components/SequenceVisualizationModal"

interface QueryResult {
  id: string
  userQuery: string
  sqlQuery: string
  results: any[]
  createdAt: string
  error?: string
}

export default function Dashboard() {
  const [userQuery, setUserQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<QueryResult[]>([])
  const [history, setHistory] = useState<QueryResult[]>([])
  const [activeView, setActiveView] = useState("chat") // chat or history
  const [selectedResult, setSelectedResult] = useState<QueryResult | null>(null)
  const [selectedDescription, setSelectedDescription] = useState<string>("")
  const [showVisualization, setShowVisualization] = useState(false)
  const chatEndRef = useRef(null)

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  const token = localStorage.getItem("token")

  useEffect(() => {
    fetchQueryHistory()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [results])

  const fetchQueryHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/query/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setHistory(response.data)
    } catch (err) {
      console.error("Failed to fetch history:", err)
    }
  }

  const handleSubmitQuery = async (e) => {
    e.preventDefault()
    if (!userQuery.trim()) return

    setLoading(true)
    const currentQuery = userQuery
    setUserQuery("")

    try {
      const response = await axios.post(
        `${API_URL}/query/execute`,
        { userQuery: currentQuery },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      let newResult: QueryResult
      if (!response.data.results || response.data.results.length === 0) {
        newResult = {
          id: Date.now().toString(),
          userQuery: currentQuery,
          sqlQuery: response.data.sqlQuery,
          results: [],
          createdAt: new Date().toISOString(),
          error: "This data is not found. Please contact admin then they will add this.",
        }
      } else {
        newResult = {
          id: Date.now().toString(),
          userQuery: currentQuery,
          sqlQuery: response.data.sqlQuery,
          results: response.data.results,
          createdAt: new Date().toISOString(),
        }
      }

      setResults([...results, newResult])
      setHistory([newResult, ...history])
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Query execution failed"
      console.error("[v0] Query error:", errorMsg)
      setResults([
        ...results,
        {
          id: Date.now().toString(),
          userQuery: currentQuery,
          sqlQuery: "",
          results: [],
          createdAt: new Date().toISOString(),
          error: errorMsg,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleVisualizationClick = async (result: QueryResult, selectedIndex?: number) => {
    if (!result.results || result.results.length === 0) {
      alert("No data found for this sequence. Please contact admin.")
      return
    }

    const index = selectedIndex !== undefined ? selectedIndex : 0
    const specificResult = result.results[index]

    console.log("[v0] Opening visualization for specific result:", {
      sequence_name: specificResult.sequence_name,
      organism: specificResult.organism,
      index: index,
      totalResults: result.results.length,
    })

    setShowVisualization(true)
    setSelectedResult(null)

    setTimeout(() => {
      setSelectedResult({
        ...result,
        results: [specificResult],
        selectedIndex: index,
      })
    }, 0)

    if (specificResult && specificResult.sequence) {
      try {
        console.log("[v0] Fetching description for sequence:", specificResult.sequence_name)
        const descResponse = await axios.post(
          `${API_URL}/query/get-description`,
          {
            sequence: specificResult.sequence,
            sequenceName: specificResult.sequence_name,
            organism: specificResult.organism,
            geneName: specificResult.gene_name,
            userQuery: result.userQuery,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        setSelectedDescription(descResponse.data.description)
        console.log("[v0] Description fetched successfully for:", specificResult.sequence_name)
      } catch (err) {
        console.error("[v0] Failed to fetch description:", err)
        setSelectedDescription("Failed to generate description for this sequence")
      }
    }
  }

  const handleResultClick = (result: QueryResult, index: number) => {
    handleVisualizationClick(result, index)
  }

  const getDescription = async (result: QueryResult) => {
    if (!result.results || result.results.length === 0) {
      alert("No data found for this sequence.")
      return
    }

    setLoading(true)
    try {
      const dnaSequence = result.results[0]?.sequence || ""

      const response = await axios.post(
        `${API_URL}/query/get-description`,
        {
          sequence: dnaSequence,
          sequenceName: result.results[0].sequence_name,
          organism: result.results[0].organism,
          geneName: result.results[0].gene_name,
          userQuery: result.userQuery,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setSelectedDescription(response.data.description)
    } catch (err) {
      alert(err.response?.data?.error || "Failed to get description")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="dashboard">
      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>Query History</h2>
            <button className="new-chat-btn" onClick={() => setResults([])}>
              New Chat
            </button>
          </div>

          <div className="history-list">
            {history.length === 0 ? (
              <p className="empty-history">No queries yet</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  className="history-item"
                  onClick={() => setResults([item])}
                  title={item.userQuery}
                >
                  <span className="history-icon">🔬</span>
                  <span className="history-text">{item.userQuery.substring(0, 40)}...</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="main-content">
          <div className="chat-header">
            <div className="header-content">
              <h1>AI Genomic Query Interface</h1>
              <p>Ask questions about genomic data using natural language</p>
            </div>
            <div className="view-toggle">
              <button
                className={`toggle-btn ${activeView === "chat" ? "active" : ""}`}
                onClick={() => setActiveView("chat")}
              >
                Chat
              </button>
              <button
                className={`toggle-btn ${activeView === "history" ? "active" : ""}`}
                onClick={() => setActiveView("history")}
              >
                History
              </button>
            </div>
          </div>

          {activeView === "chat" && (
            <div className="chat-container">
              {results.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🧬</div>
                  <h2>Welcome to BioQuery</h2>
                  <p>Ask questions about genomic sequences using natural language</p>
                  <div className="example-queries">
                    <p className="example-title">Try asking:</p>
                    <button className="example-btn" onClick={() => setUserQuery("Show me BRCA1 exon sequences")}>
                      BRCA1 exon sequences
                    </button>
                    <button className="example-btn" onClick={() => setUserQuery("Find DNA sequences for Homo sapiens")}>
                      Human DNA sequences
                    </button>
                    <button className="example-btn" onClick={() => setUserQuery("Find all mitochondrial genes")}>
                      Mitochondrial genes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="results-container">
                  <AnimatePresence>
                    {results.map((result, idx) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="result-group"
                      >
                        <div className="query-message">
                          <div className="message-avatar">U</div>
                          <div className="message-content">
                            <p className="message-text">{result.userQuery}</p>
                            <span className="message-time">{new Date(result.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        <div className="response-message">
                          <div className="message-avatar ai">AI</div>
                          <div className="message-content">
                            <div className="sql-query">
                              <span className="sql-label">Generated SQL:</span>
                              <code>{result.sqlQuery}</code>
                            </div>

                            {result.error ? (
                              <div className="error-message">
                                <p>{result.error}</p>
                              </div>
                            ) : result.results.length > 0 ? (
                              <div className="results-display">
                                <p className="results-count">Found {result.results.length} result(s)</p>
                                <div className="results-list">
                                  {result.results.map((item, i) => (
                                    <div key={i} className="result-item">
                                      <div className="result-data">
                                        {Object.entries(item).map(([key, value]) => (
                                          <div key={key} className="data-row">
                                            <span className="data-key">{key}:</span>
                                            <span className="data-value">
                                              {String(value).substring(0, 50)}
                                              {String(value).length > 50 ? "..." : ""}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="result-actions">
                                        {item.sequence && (
                                          <>
                                            <button
                                              className="action-btn"
                                              onClick={() => handleVisualizationClick(result, i)}
                                            >
                                              View 3D
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="no-results">No results found for this query</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={chatEndRef} />
                </div>
              )}

              <form className="input-form" onSubmit={handleSubmitQuery}>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Ask a genomic question... e.g., 'Find BRCA1 sequences'"
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading || !userQuery.trim()}>
                    {loading ? "Processing..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeView === "history" && (
            <div className="history-view">
              {history.length === 0 ? (
                <div className="empty-state">
                  <p>No query history yet</p>
                </div>
              ) : (
                <div className="history-grid">
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="history-card"
                    >
                      <h3>{item.userQuery.substring(0, 50)}</h3>
                      <p className="history-time">{new Date(item.createdAt).toLocaleString()}</p>
                      <p className="history-sql">SQL: {item.sqlQuery.substring(0, 60)}...</p>
                      <button className="view-btn" onClick={() => setResults([item])}>
                        View Details
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedResult && (
            <SequenceVisualizationModal
              data={selectedResult.results[0]}
              description={selectedDescription}
              isOpen={showVisualization}
              onClose={() => setShowVisualization(false)}
            />
          )}
        </div>
      </div>
    </main>
  )
}
