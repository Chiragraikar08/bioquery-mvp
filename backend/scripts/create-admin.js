import "dotenv/config"
import mongoose from "mongoose"
import User from "../models/User.js"

const createAdminUser = async () => {
  try {
    console.log("Connecting to MongoDB...")
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("✓ MongoDB connected")

    const adminEmail = "bioquery@gmail.com"
    const adminPassword = "BioQuery@123"

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail })
    if (existingAdmin) {
      console.log(`✓ Admin user already exists: ${adminEmail}`)
      await mongoose.disconnect()
      return
    }

    // Create admin user
    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      phone: "N/A",
      role: "admin",
      isVerified: true,
    })

    await admin.save()
    console.log(`✓ Admin user created successfully`)
    console.log(`  Email: ${adminEmail}`)
    console.log(`  Password: ${adminPassword}`)
    console.log(`  Role: admin`)

    await mongoose.disconnect()
  } catch (error) {
    console.error("✗ Error creating admin user:", error.message)
    process.exit(1)
  }
}

createAdminUser()
