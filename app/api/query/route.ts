import { GoogleGenerativeAI } from "@google/generative-ai"
import { runModelInference } from "@/lib/model-inference"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  try {
    const { userPrompt, sequenceName } = await request.json()

    if (!userPrompt || !sequenceName) {
      return Response.json({ error: "userPrompt and sequenceName are required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const sqlPrompt = `You are a genomic SQL query generator. Convert this natural language request into a SQL query for genomic database.

User request: "${userPrompt}"
Database sequence name: "${sequenceName}"

Generate a valid SQL query that would retrieve relevant genomic data. Format the response as:
QUERY: [your SQL query here]

Example queries:
- SELECT * FROM sequences WHERE name = '${sequenceName}' AND mutation_type = 'SNP'
- SELECT * FROM genomic_features WHERE sequence_id = '${sequenceName}' AND feature_type = 'exon'

Provide the SQL query to answer the user's request.`

    const geminiResponse = await model.generateContent(sqlPrompt)
    const sqlQuery = geminiResponse.response.text()

    console.log("[v0] Gemini SQL Query Generated:", sqlQuery)

    const modelPrediction = await runModelInference(sequenceName, userPrompt)
    console.log("[v0] Model Prediction:", modelPrediction)

    return Response.json({
      success: true,
      sequenceName,
      userQuery: userPrompt,
      geminiSQLQuery: sqlQuery,
      modelPrediction: modelPrediction,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Query API Error:", error)
    return Response.json({ error: "Failed to process query" }, { status: 500 })
  }
}
