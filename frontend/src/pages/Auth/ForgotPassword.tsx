"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./Auth.css"

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("[v0] Sending password reset OTP to:", email)
      await axios.post(`${API_URL}/auth/forgot-password`, { email }, { timeout: 10000 })
      setSuccess("OTP sent to your email. Check your inbox!")
      setTimeout(() => setStep(2), 1000)
    } catch (err) {
      console.error("[v0] Forgot password error:", err)
      let errorMessage = "Failed to send OTP"
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Connection timeout. Please try again."
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }
    setSuccess("OTP verified! Set your new password.")
    setTimeout(() => setStep(3), 800)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    try {
      console.log("[v0] Resetting password for:", email)
      await axios.post(
        `${API_URL}/auth/reset-password`,
        {
          email,
          otp,
          password,
          confirmPassword,
        },
        { timeout: 10000 },
      )

      console.log("[v0] Password reset successful")
      setSuccess("Password reset successfully! Redirecting to login...")
      setTimeout(() => navigate("/signin"), 1500)
    } catch (err) {
      console.error("[v0] Password reset error:", err)
      let errorMessage = "Password reset failed"
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.code === "ECONNABORTED") {
        errorMessage = "Connection timeout. Please try again."
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
          <p className="auth-subtitle">Reset Your Password</p>
        </div>

        <div className="auth-card">
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? "active" : ""}`} />
            <div className={`step ${step >= 2 ? "active" : ""}`} />
            <div className={`step ${step >= 3 ? "active" : ""}`} />
          </div>

          <h2>{step === 1 ? "Enter Email" : step === 2 ? "Verify OTP" : "New Password"}</h2>

          {step === 1 && (
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              {success && <p className="success-text">{success}</p>}
              <button type="submit" disabled={loading} className="auth-button">
                {loading ? "Sending..." : "Send OTP"}
              </button>
              <button type="button" onClick={() => navigate("/signin")} className="secondary-btn">
                Back to Sign In
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label>Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  inputMode="numeric"
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              {success && <p className="success-text">{success}</p>}
              <button type="submit" className="auth-button">
                Verify OTP
              </button>
              <button type="button" onClick={() => setStep(1)} className="secondary-btn">
                Back
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              {success && <p className="success-text">{success}</p>}
              <button type="submit" disabled={loading} className="auth-button">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              <button type="button" onClick={() => setStep(2)} className="secondary-btn" disabled={loading}>
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
