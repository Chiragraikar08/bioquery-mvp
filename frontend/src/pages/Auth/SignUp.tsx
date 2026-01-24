"use client"

import { useState } from "react"
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

  // ✅ FIX: correct env variable (NO localhost fallback)
  const API_URL = import.meta.env.VITE_API_BASE_URL

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("[v0] Sending OTP to:", email)

      await axios.post(
        `${API_URL}/api/auth/send-otp`,
        { email },
        { timeout: 60000 }
      )

      setSuccess("OTP sent successfully! Check your email.")
      setTimeout(() => setStep(2), 1000)
    } catch (err: any) {
      console.error("[v0] Send OTP error:", err)
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

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setSuccess("OTP verified! Continue to set your account details.")
    setTimeout(() => setStep(3), 800)
  }

  const handleSignUp = async (e: React.FormEvent) => {
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
      console.log("[v0] Creating account for:", email)

      const response = await axios.post(
        `${API_URL}/api/auth/signup`,
        {
          email,
          otp,
          phone,
          password,
          confirmPassword,
        },
        { timeout: 60000 }
      )

      localStorage.setItem("token", response.data.token)
      localStorage.setItem("user", JSON.stringify(response.data.user))

      window.dispatchEvent(new Event("authStateChanged"))

      setSuccess("Account created successfully! Redirecting...")
      setTimeout(() => {
        if (response.data.user.role === "admin") {
          navigate("/admin")
        } else {
          navigate("/dashboard")
        }
      }, 1000)
    } catch (err: any) {
      console.error("[v0] Sign up error:", err)
      let errorMessage = "Sign up failed"

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
          <p className="auth-subtitle">Create Your Account</p>
        </div>

        <div className="auth-card">
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? "active" : ""}`} />
            <div className={`step ${step >= 2 ? "active" : ""}`} />
            <div className={`step ${step >= 3 ? "active" : ""}`} />
          </div>

          <h2>{step === 1 ? "Verify Email" : step === 2 ? "Verify OTP" : "Set Password"}</h2>

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
                {loading ? "Sending OTP..." : "Send OTP"}
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
                  maxLength={6}
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              {success && <p className="success-text">{success}</p>}
              <button type="submit" className="auth-button">
                Verify OTP
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSignUp}>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="error-text">{error}</p>}
              {success && <p className="success-text">{success}</p>}
              <button type="submit" disabled={loading} className="auth-button">
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
