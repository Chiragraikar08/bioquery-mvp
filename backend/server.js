import "dotenv/config"
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import authRoutes from "./routes/auth.js"
import adminRoutes from "./routes/admin.js"
import queryRoutes from "./routes/query.js"
import contactRoutes from "./routes/contact.js"
import { errorHandler } from "./middleware/errorHandler.js"
import User from "./models/User.js"

dotenv.config()

const app = express()

if (!process.env.MONGODB_URI) {
  console.error("CRITICAL: MONGODB_URI is not set. Please add it to .env file")
  process.exit(1)
}

if (!process.env.JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET is not set. Please add it to .env file")
  process.exit(1)
}

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

let mongoRetries = 0
const maxRetries = 5

const seedDefaultAdmin = async () => {
  try {
    const adminEmail = "bioquery@gmail.com"
    const existingAdmin = await User.findOne({ email: adminEmail })

    if (!existingAdmin) {
      const adminUser = new User({
        email: adminEmail,
        password: "BioQuery@123",
        phone: "+1-800-BIOQUERY",
        role: "admin",
        isVerified: true,
      })
      await adminUser.save()
      console.log("✓ Default admin user created: bioquery@gmail.com")
    } else {
      console.log("✓ Admin user already exists")
    }
  } catch (error) {
    console.error("Error seeding admin user:", error.message)
  }
}

const connectMongoDB = () => {
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("✓ MongoDB connected successfully")
      mongoRetries = 0
      seedDefaultAdmin()
    })
    .catch((err) => {
      mongoRetries++
      console.error(`✗ MongoDB connection error (Attempt ${mongoRetries}/${maxRetries}):`, err.message)

      if (mongoRetries < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, mongoRetries), 10000)
        console.log(`Retrying in ${retryDelay}ms...`)
        setTimeout(connectMongoDB, retryDelay)
      } else {
        console.error("CRITICAL: Failed to connect to MongoDB after multiple retries")
        process.exit(1)
      }
    })
}

connectMongoDB()

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/query", queryRoutes)
app.use("/api/contact", contactRoutes)

app.get("/api/health", (req, res) => {
  const mongooseConnected = mongoose.connection.readyState === 1
  res.json({
    status: "ok",
    mongodb: mongooseConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  })
})

// Error Handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check available at http://localhost:${PORT}/api/health`)
})
