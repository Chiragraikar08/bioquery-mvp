import express from "express"
import { sendContactEmail } from "../utils/emailService.js"

const router = express.Router()

router.post("/submit", async (req, res) => {
  try {
    const { name, email, phone, description } = req.body

    if (!name || !email || !phone || !description) {
      return res.status(400).json({ error: "All fields are required" })
    }

    await sendContactEmail(name, email, phone, description)

    res.json({ message: "Message sent successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
