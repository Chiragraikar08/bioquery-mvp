"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./Auth.css"

export default function SignIn() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required")
      setLoading(false)
      return
    }

    try {
      console.log("[v0] Attempting sign in with email:", email)
      const response = await axios.post(
        `${API_URL}/auth/signin`,
        {
          email: email.toLowerCase().trim(),
          password,
        },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      console.log("[v0] Sign in successful. Role:", response.data.user.role)
      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))

      // Dispatch event to update auth state in App component
      window.dispatchEvent(new Event("authStateChanged"))

      // Redirect based on user role
      if (response.data.user.role === "admin") {
        console.log("[v0] Redirecting admin to /admin")
        navigate("/admin")
      } else {
        console.log("[v0] Redirecting user to /dashboard")
        navigate("/dashboard")
      }
    } catch (err) {
      console.error("[v0] Sign in error:", err.response || err)

      let errorMessage = "Sign in failed"
      if (err.response?.status === 401) {
        errorMessage = "Invalid email or password"
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Connection timeout - Backend not responding. Check if backend server is running on port 5000."
      } else if (err.message === "Network Error") {
        errorMessage = "Network error - Cannot reach backend. Check your internet and backend URL."
      } else if (!err.response) {
        errorMessage = "Cannot connect to server. Ensure backend is running at " + API_URL
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">BioQuery</h1>
          <p className="auth-subtitle">AI-Powered Genomic Analysis</p>
        </div>

        <div className="auth-card">
          <h2>Sign In</h2>
          <form onSubmit={handleSignIn}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="bioquery@gmail.com"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <button type="submit" disabled={loading} className="auth-button">
              {loading ? "Signing In..." : "Sign In"}
            </button>
            <div className="auth-links">
              <p className="auth-link">
                Don't have an account? <a onClick={() => navigate("/signup")}>Sign Up</a>
              </p>
              <p className="auth-link">
                <a onClick={() => navigate("/forgot-password")}>Forgot Password?</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
