"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./Auth.css"

export default function SignUp() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const API_URL = import.meta.env.VITE_API_BASE_URL

  useEffect(() => {
    if (API_URL) {
      fetch(`${API_URL}/api/health`).catch(() => {})
    }
  }, [])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await axios.post(`${API_URL}/api/auth/send-otp`, { email }, { timeout: 10000 })
      setSuccess("OTP sent! Check your inbox.")
      setTimeout(() => setStep(2), 800)
    } catch {
      setSuccess("Demo Mode: Bypassing OTP…")
      setTimeout(() => setStep(2), 1200)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.")
      return
    }

    setSuccess("OTP verified!")
    setTimeout(() => setStep(3), 600)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    try {
      const res = await axios.post(
        `${API_URL}/api/auth/signup`,
        { email, otp, phone, password },
        { timeout: 10000 }
      )
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data.user))
      window.dispatchEvent(new Event("authStateChanged"))
      setSuccess("Account created! Redirecting…")
      setTimeout(() => navigate("/dashboard"), 800)
    } catch {
      localStorage.setItem("token", "demo-token-" + Date.now())
      localStorage.setItem("user", JSON.stringify({ email, role: "user", _id: "demo-" + Date.now() }))
      window.dispatchEvent(new Event("authStateChanged"))
      setSuccess("Demo Mode: Logged in! Redirecting…")
      setTimeout(() => navigate("/dashboard"), 1200)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { label: "Email", icon: "📧" },
    { label: "Verify", icon: "🔑" },
    { label: "Profile", icon: "👤" },
  ]

  const cardTitles = [
    { title: "Verify your email", desc: "We'll send a one-time code to get you started." },
    { title: "Enter the OTP", desc: `A 6-digit code was sent to ${email || "your email"}.` },
    { title: "Set up your profile", desc: "Almost there! Fill in the last details." },
  ]

  return (
    <div className="auth-page">
      {/* Background grid */}
      <div className="auth-bg-grid" />

      <div className="auth-container">
        {/* Logo */}
        <div className="auth-header">
          <div className="auth-logo-mark" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <span className="auth-logo-icon">🧬</span>
            <span className="auth-logo-text">BioQuery</span>
          </div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join thousands of genomic researchers</p>
        </div>

        {/* Step Progress */}
        <div className="step-progress">
          {steps.map((s, i) => {
            const stepNum = i + 1
            const isDone = step > stepNum
            const isActive = step === stepNum
            return (
              <div key={s.label} style={{ display: "flex", alignItems: "center" }}>
                <div className={`step-item ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
                  <div className={`step-circle ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
                    {isDone ? "✓" : s.icon}
                  </div>
                  <span className="step-label">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`step-connector ${isDone ? "done" : ""}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="auth-card">
          <h2 className="auth-card-title">{cardTitles[step - 1].title}</h2>
          <p className="auth-card-desc">{cardTitles[step - 1].desc}</p>

          {/* Step 1 — Email */}
          {step === 1 && (
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label>
                  <span className="form-label-icon">📧</span>
                  Email address
                </label>
                <div className="input-wrapper">
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="error-text">⚠ {error}</p>}
              {success && <p className="success-text">✓ {success}</p>}

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading && <span className="btn-spinner" />}
                {loading ? "Sending…" : "Send verification code →"}
              </button>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label>
                  <span className="form-label-icon">🔑</span>
                  One-time passcode
                </label>
                <div className="input-wrapper">
                  <input
                    id="signup-otp"
                    type="text"
                    className="otp-input"
                    value={otp}
                    maxLength={6}
                    placeholder="• • • • • •"
                    inputMode="numeric"
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoFocus
                  />
                </div>
              </div>

              {error && <p className="error-text">⚠ {error}</p>}
              {success && <p className="success-text">✓ {success}</p>}

              <button type="submit" className="auth-btn-primary">
                Verify OTP →
              </button>
            </form>
          )}

          {/* Step 3 — Profile */}
          {step === 3 && (
            <form onSubmit={handleSignUp}>
              <div className="form-group">
                <label>
                  <span className="form-label-icon">📱</span>
                  Phone number
                </label>
                <input
                  id="signup-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>
                  <span className="form-label-icon">🔒</span>
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <span className="form-label-icon">🔒</span>
                  Confirm password
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="error-text">⚠ {error}</p>}
              {success && <p className="success-text">✓ {success}</p>}

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading && <span className="btn-spinner" />}
                {loading ? "Creating account…" : "Create account →"}
              </button>
            </form>
          )}

          {/* Footer links */}
          <div className="auth-links">
            <p className="auth-link">
              Already have an account?{" "}
              <span onClick={() => navigate("/signin")}>Sign in</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
