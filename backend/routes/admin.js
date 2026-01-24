import express from "express"
import { authMiddleware, adminMiddleware } from "../middleware/auth.js"
import { addGenomicData } from "../utils/supabaseService.js"

const router = express.Router()

// Add genomic data
router.post("/add-genomic-data", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data } = req.body

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ error: "Data must be an array" })
    }

    console.log(`[v0] Received ${data.length} records for insertion`)

    const validData = data.every((record) => {
      const hasSequence = record.sequence || record.dna_sequence
      const hasGeneName = record.gene_name || record.sequence_name
      const hasOrganism = record.organism
      return hasSequence && hasGeneName && hasOrganism
    })

    if (!validData) {
      const invalidRecords = data.filter((r) => {
        const hasSequence = r.sequence || r.dna_sequence
        const hasGeneName = r.gene_name || r.sequence_name
        const hasOrganism = r.organism
        return !hasSequence || !hasGeneName || !hasOrganism
      })
      console.error(`[v0] Invalid records found: ${invalidRecords.length}`)
      return res.status(400).json({
        error: "Missing required fields in CSV. Required: sequence/dna_sequence, gene_name/sequence_name, organism",
        invalidCount: invalidRecords.length,
      })
    }

    console.log(`[v0] All ${data.length} records passed initial validation`)
    const result = await addGenomicData(data)

    console.log(`[v0] Successfully inserted ${result.length || data.length} records`)
    res.json({
      message: "Data added successfully",
      count: result ? result.length : data.length,
      details: `${result ? result.length : data.length} genomic sequences inserted into database`,
    })
  } catch (error) {
    console.error(`[v0] Admin upload error: ${error.message}`)
    res.status(500).json({
      error: error.message,
      details: "Check server logs for detailed error information",
    })
  }
})

export default router
