import express from "express"
import { authMiddleware } from "../middleware/auth.js"
import QueryHistory from "../models/QueryHistory.js"
import { generateSQLFromQuery, generateDescriptionFromData } from "../utils/geminiService.js"
import { executeGenomicQuery, getSequenceByName } from "../utils/supabaseService.js"

const router = express.Router()

// Execute genomic query - STEP 1 & 2: Convert query to SQL and execute
router.post("/execute", authMiddleware, async (req, res) => {
  try {
    const { userQuery } = req.body

    if (!userQuery) {
      return res.status(400).json({ error: "Query is required" })
    }

    console.log("[v0] STEP 1: Converting user query to SQL")
    const sqlQuery = await generateSQLFromQuery(userQuery)
    console.log("[v0] Generated SQL:", sqlQuery)

    // Execute the SQL query against Supabase
    let results = []
    try {
      console.log("[v0] STEP 2: Executing SQL against database")
      results = await executeGenomicQuery(sqlQuery)
      console.log(`[v0] Query executed successfully. Found ${results?.length || 0} results`)
    } catch (error) {
      console.error("[v0] Error executing query:", error.message)
      results = []
    }

    const queryHistory = new QueryHistory({
      userId: req.userId,
      userQuery,
      sqlQuery,
      results: results.slice(0, 10),
    })

    await queryHistory.save()

    // CRITICAL: Return results with all data needed for visualization
    res.json({
      userQuery,
      sqlQuery,
      results: results.map((r) => ({
        id: r.id,
        sequence_name: r.sequence_name,
        sequence: r.sequence,
        organism: r.organism,
        gene_name: r.gene_name,
        chromosome: r.chromosome,
        length: r.length,
        gc_content: r.gc_content,
        description: r.description,
      })),
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// STEP 3: Generate description ONLY from database record returned by query
router.post("/get-description", authMiddleware, async (req, res) => {
  try {
    const { sequence, sequenceName, organism, geneName, userQuery } = req.body

    if (!sequence) {
      return res.status(400).json({ error: "Sequence data is required" })
    }

    console.log("[v0] STEP 3: Generating description from ONLY the returned database record")
    console.log("[v0] Sequence name:", sequenceName)
    console.log("[v0] Organism:", organism)
    console.log("[v0] Gene name:", geneName)
    console.log("[v0] Sequence length:", sequence.length)

    // Generate description ONLY from the specific record, not full database
    const description = await generateDescriptionFromData({
      sequence,
      sequenceName,
      organism,
      geneName,
      userQuery,
    })

    res.json({ description })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// STEP 4: Get full sequence data for 3D visualization
router.post("/get-3d-data", authMiddleware, async (req, res) => {
  try {
    const { sequenceName } = req.body

    if (!sequenceName) {
      return res.status(400).json({ error: "Sequence name is required" })
    }

    console.log("[v0] STEP 4: Fetching complete sequence for 3D visualization")
    const sequenceData = await getSequenceByName(sequenceName)

    if (!sequenceData) {
      return res.status(404).json({ error: "Sequence not found" })
    }

    // Return all data needed for 3D visualization
    res.json({
      id: sequenceData.id,
      sequence_name: sequenceData.sequence_name,
      sequence: sequenceData.sequence,
      organism: sequenceData.organism,
      gene_name: sequenceData.gene_name,
      chromosome: sequenceData.chromosome,
      position: sequenceData.position,
      length: sequenceData.length,
      gc_content: sequenceData.gc_content,
      description: sequenceData.description,
      created_at: sequenceData.created_at,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get query history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const history = await QueryHistory.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50)

    res.json(history)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
