"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "./Navbar.css"

interface NavbarProps {
  isAuthenticated: boolean
  userRole: string | null
  setIsAuthenticated: (value: boolean) => void
}

export default function Navbar({ isAuthenticated, userRole, setIsAuthenticated }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    // Dispatch event to update auth state in App component
    window.dispatchEvent(new Event("authStateChanged"))
    navigate("/")
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🧬</span> BioQuery
        </Link>

        <button className="hamburger" onClick={() => setIsOpen(!isOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${isOpen ? "active" : ""}`}>
          <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={userRole === "admin" ? "/admin" : "/dashboard"}
                className="nav-link"
                onClick={() => setIsOpen(false)}
              >
                {userRole === "admin" ? "Admin Panel" : "Dashboard"}
              </Link>
              <Link to="/contact" className="nav-link" onClick={() => setIsOpen(false)}>
                Contact
              </Link>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/contact" className="nav-link" onClick={() => setIsOpen(false)}>
                Contact
              </Link>
              <Link to="/signin" className="nav-link" onClick={() => setIsOpen(false)}>
                Sign In
              </Link>
              <Link to="/signup" className="signup-btn" onClick={() => setIsOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
