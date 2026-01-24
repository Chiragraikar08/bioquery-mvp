"use client"

import { useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import "./Contact.css"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      await axios.post(`${API_URL}/contact/submit`, formData)
      setMessage("Message sent successfully! We'll get back to you soon.")
      setFormData({ name: "", email: "", phone: "", description: "" })
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="contact-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="contact-container">
        <h1>Contact Us</h1>
        <p className="subtitle">Have questions or feedback? We'd love to hear from you.</p>

        <div className="contact-content">
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <div className="info-item">
              <h3>Email</h3>
              <p>support@bioquery.com</p>
            </div>
            <div className="info-item">
              <h3>Phone</h3>
              <p>+1 (555) 123-4567</p>
            </div>
            <div className="info-item">
              <h3>Address</h3>
              <p>123 Science Street, Research City, RC 12345</p>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Your message..."
                rows={5}
              />
            </div>

            {message && (
              <div className={`message ${message.includes("successfully") ? "success" : "error"}`}>{message}</div>
            )}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  )
}
