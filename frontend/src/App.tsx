"use client"

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import SignUp from "./pages/Auth/SignUp"
import SignIn from "./pages/Auth/SignIn"
import ForgotPassword from "./pages/Auth/ForgotPassword"
import Dashboard from "./pages/Dashboard"
import AdminDashboard from "./pages/AdminDashboard"
import Contact from "./pages/Contact"
import DNAVisualization from "./pages/DNAVisualization"
import LoadingScreen from "./components/LoadingScreen"
import "./App.css"

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState(null)

  const checkAuth = () => {
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")

    if (token && user) {
      setIsAuthenticated(true)
      const userData = JSON.parse(user)
      setUserRole(userData.role)
    } else {
      setIsAuthenticated(false)
      setUserRole(null)
    }
  }

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      checkAuth()
      setIsLoading(false)
    }, 2000)

    // Listen for auth state changes (dispatched after login/signup)
    const handleAuthChange = () => {
      checkAuth()
    }

    window.addEventListener("authStateChanged", handleAuthChange)

    // Also listen for storage changes (cross-tab)
    window.addEventListener("storage", handleAuthChange)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("authStateChanged", handleAuthChange)
      window.removeEventListener("storage", handleAuthChange)
    }
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <BrowserRouter>
      <Navbar isAuthenticated={isAuthenticated} userRole={userRole} setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={!isAuthenticated ? <SignUp /> : <Navigate to="/dashboard" />} />
        <Route path="/signin" element={!isAuthenticated ? <SignIn /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={isAuthenticated && userRole !== "admin" ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/admin"
          element={isAuthenticated && userRole === "admin" ? <AdminDashboard /> : <Navigate to="/" />}
        />
        <Route path="/contact" element={<Contact />} />
        <Route path="/dna-view/:sequenceId" element={isAuthenticated ? <DNAVisualization /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
