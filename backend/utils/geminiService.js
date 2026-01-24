import { GoogleGenerativeAI } from "@google/generative-ai"

const geminiApiKey = process.env.GEMINI_API_KEY

if (!geminiApiKey) {
  console.warn("Warning: GEMINI_API_KEY environment variable is not set")
}

const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null

// List of model names to try in order (best quality first)
// Pro models are better for accuracy, Flash models are faster
const MODEL_NAMES = [
  "gemini-2.5-pro", // Best quality for complex queries
  "gemini-2.5-flash", // Fast and good quality
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite-001",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-pro",
  "gemini-1.0-pro",
]

// Cache for available models (discovered dynamically)
let availableModelsCache = null

// Helper function to discover available models
const discoverAvailableModels = async () => {
  if (availableModelsCache) {
    return availableModelsCache
  }

  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  try {
    // Try to list models using the API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`,
    )
    const data = await response.json()

    if (data.models && Array.isArray(data.models)) {
      const modelNames = data.models
        .map((model) => model.name?.replace("models/", "") || model.name)
        .filter((name) => name && name.includes("gemini"))

      if (modelNames.length > 0) {
        availableModelsCache = modelNames
        console.log(`Discovered available models: ${modelNames.join(", ")}`)
        return modelNames
      }
    }
  } catch (error) {
    console.warn("Could not discover models via API, using fallback list:", error.message)
  }

  // Fallback to our predefined list
  return MODEL_NAMES
}

// Helper function to try generating content with different models
const tryGenerateContent = async (prompt, generationConfig) => {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  // First, try to discover available models
  let modelsToTry = MODEL_NAMES
  try {
    modelsToTry = await discoverAvailableModels()
  } catch (error) {
    console.warn("Using fallback model list:", error.message)
  }

  let lastError = null
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig,
      })
      const result = await model.generateContent(prompt)
      console.log(`Successfully using model: ${modelName}`)
      return result
    } catch (error) {
      lastError = error
      // If it's a 404, try next model; otherwise throw immediately
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        console.log(`Model ${modelName} not available, trying next...`)
        continue
      }
      // For other errors, throw immediately
      throw error
    }
  }

  throw new Error(
    `No available models found. Tried: ${modelsToTry.join(", ")}. Last error: ${lastError?.message || "Unknown error"}`,
  )
}

export const generateSQLFromQuery = async (userQuery) => {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  if (!userQuery || typeof userQuery !== "string" || userQuery.trim().length === 0) {
    throw new Error("User query is required and must be a non-empty string")
  }

  console.log(`Generating SQL for query: "${userQuery}"`)

  try {
    const prompt = `You are a SQL query generator. Your ONLY job is to convert natural language to SQL.

DATABASE SCHEMA:
Table: genomic_sequences
Columns:
- id (uuid, primary key)
- sequence_name (text, required) - name/identifier of the sequence
- sequence (text, required) - the actual DNA sequence (A, T, G, C nucleotides)
- organism (text, required) - species name
- gene_name (text, optional) - gene name
- chromosome (text, optional) - chromosome identifier
- description (text, optional) - detailed description
- length (int4, optional) - sequence length in base pairs
- gc_content (numeric, optional) - GC content percentage
- created_at (timestamptz, optional) - creation timestamp

RULES:
1. Output ONLY SQL - no text, no explanations, no markdown
2. Only SELECT statements allowed
3. Column names: id, sequence_name, sequence, organism, gene_name, chromosome, description, length, gc_content, created_at
4. Use ILIKE for organism/gene_name/description searches (case-insensitive)
5. Use LIKE for DNA sequence pattern matching in the 'sequence' column
6. Use = for exact matches on sequence_name
7. IMPORTANT: Use single quotes for all string literals (e.g. WHERE organism = 'Human')
8. Always include 'sequence' column in results
9. If you cannot generate a valid query based on the input, produce an empty string. DO NOT guess.

INPUT: "${userQuery}"
OUTPUT:`

    const result = await tryGenerateContent(prompt, {
      temperature: 0,
      maxOutputTokens: 200,
      topP: 0.95,
      topK: 20,
    })

    let sqlQuery = result.response.text().trim()

    // Remove markdown code blocks if present
    sqlQuery = sqlQuery
      .replace(/```sql/gi, "")
      .replace(/```/g, "")
      .trim()

    // Remove any leading/trailing quotes (careful not to remove needed quotes)
    // Only remove if the ENTIRE string is quoted
    if ((sqlQuery.startsWith('"') && sqlQuery.endsWith('"')) || (sqlQuery.startsWith("'") && sqlQuery.endsWith("'"))) {
      sqlQuery = sqlQuery.slice(1, -1)
    }

    // Extract SQL if it's wrapped in explanations - look for SELECT statement
    const sqlMatch = sqlQuery.match(/(SELECT\s+.*?)(?:\s*;|\s*$)/is)
    if (sqlMatch) {
      sqlQuery = sqlMatch[1].trim()
    }

    // If still no SELECT found, try to find it anywhere in the response
    if (!sqlQuery.toLowerCase().startsWith("select")) {
      const anySelect = sqlQuery.match(/SELECT\s+.*/i)
      if (anySelect) {
        sqlQuery = anySelect[0].trim()
      }
    }

    // Remove trailing semicolon
    sqlQuery = sqlQuery.replace(/;+\s*$/, "").trim()

    // Ensure it starts with SELECT
    if (!sqlQuery.toLowerCase().startsWith("select")) {
      console.warn(`AI returned invalid SQL: ${sqlQuery.substring(0, 100)}`)
      throw new Error("Could not generate a valid SQL query from your request. Please try to be more specific.")
    }

    // Validate column names exist in schema
    const validColumns = ["id", "dna_sequence", "gene_name", "organism", "chromosome", "position", "metadata"]
    const columnMatches = sqlQuery.match(/\b(\w+)\b/gi)
    if (columnMatches) {
      const usedColumns = columnMatches.filter(
        (col) =>
          ![
            "select",
            "from",
            "where",
            "and",
            "or",
            "like",
            "ilike",
            "limit",
            "order",
            "by",
            "group",
            "having",
            "genomic_data",
            "as",
            "case",
            "when",
            "then",
            "else",
            "end",
          ].includes(col.toLowerCase()),
      )
      // Check if any invalid columns are used (basic check)
      for (const col of usedColumns) {
        const colLower = col.toLowerCase()
        if (!validColumns.includes(colLower) && !colLower.match(/^['"]/)) {
          console.warn(`Warning: Column '${col}' may not exist in schema`)
        }
      }
    }

    // Basic validation - ensure no dangerous keywords
    const dangerousKeywords = [
      "drop",
      "delete",
      "insert",
      "update",
      "alter",
      "create",
      "truncate",
      "exec",
      "execute",
      "grant",
      "revoke",
    ]
    const lowerQuery = sqlQuery.toLowerCase()
    for (const keyword of dangerousKeywords) {
      // Check for keyword as whole word, not part of another word
      const keywordRegex = new RegExp(`\\b${keyword}\\b`, "i")
      if (keywordRegex.test(lowerQuery)) {
        throw new Error(`Unsafe SQL keyword detected: ${keyword}`)
      }
    }

    // Ensure FROM genomic_sequences is present
    if (!sqlQuery.toLowerCase().includes("from genomic_sequences")) {
      // Try to fix it - replace any table name with genomic_sequences
      if (sqlQuery.toLowerCase().includes("from")) {
        sqlQuery = sqlQuery.replace(/from\s+\w+/i, "FROM genomic_sequences")
      } else {
        sqlQuery = sqlQuery + " FROM genomic_sequences"
      }
    }

    // Ensure 'sequence' column is included for 3D visualization
    if (sqlQuery.toLowerCase().includes("select *")) {
      // Already selecting all columns, including sequence
    } else if (!sqlQuery.toLowerCase().includes("sequence")) {
      // Add sequence column if not present
      const selectMatch = sqlQuery.match(/SELECT\s+(.*?)\s+FROM/i)
      if (selectMatch) {
        const columns = selectMatch[1].trim()
        if (!columns.toLowerCase().includes("sequence")) {
          sqlQuery = sqlQuery.replace(/SELECT\s+(.*?)\s+FROM/i, `SELECT $1, sequence FROM`)
        }
      }
    }

    console.log(`Generated SQL: ${sqlQuery}`)
    return sqlQuery
  } catch (error) {
    console.error("Gemini SQL Error:", error.message)
    throw error
  }
}

export const generateDescription = async (dnaSequence, userQuery) => {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  try {
    const prompt = `You are a bioinformatics expert and geneticist. Analyze the DNA sequence and provide a detailed, accurate scientific explanation based on the user's query.

DNA Sequence:
${dnaSequence}

User Query:
${userQuery}

INSTRUCTIONS:
1. Provide accurate, scientifically sound explanations
2. Use proper biological terminology
3. If analyzing sequences, identify potential genes, regulatory regions, or functional elements
4. Mention sequence length, GC content if relevant
5. If the query is not genomic-related, politely explain that you specialize in genomic analysis
6. Be specific and avoid generic responses
7. If the sequence is too short or invalid, mention this

Provide your analysis:`

    const result = await tryGenerateContent(prompt, {
      temperature: 0.3,
      maxOutputTokens: 500,
    })
    return result.response.text().trim()
  } catch (error) {
    console.error("Gemini Description Error:", error.message)
    throw error
  }
}

// This ensures description is NOT based on full database but ONLY on the specific sequence returned

export const generateDescriptionFromData = async (recordData) => {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  const { sequence, sequenceName, organism, geneName, userQuery } = recordData

  console.log("[v0] Generating description for specific record:")
  console.log("[v0] - Sequence name:", sequenceName)
  console.log("[v0] - Organism:", organism)
  console.log("[v0] - Gene name:", geneName)
  console.log("[v0] - Sequence length:", sequence?.length || 0)

  try {
    // CRITICAL: Use ONLY this specific record's data, not database context
    const prompt = `You are a bioinformatics expert and geneticist. Analyze THIS SPECIFIC DNA sequence and provide a detailed, accurate scientific explanation.

IMPORTANT RULES:
1. Analyze ONLY the sequence provided below
2. Do NOT reference any other sequences or the full database
3. Focus on THIS specific organism: ${organism || "Unknown"}
4. Focus on THIS specific gene: ${geneName || "Unknown"}
5. Use THIS specific sequence provided, not any other

SEQUENCE INFORMATION:
- Sequence Name: ${sequenceName || "Unknown"}
- Organism: ${organism || "Unknown"}
- Gene Name: ${geneName || "Unknown"}
- Sequence Length: ${sequence?.length || 0} base pairs

DNA SEQUENCE (${sequence?.length || 0} bp):
${sequence}

User's Research Question:
${userQuery}

ANALYSIS TASK:
Analyze this specific DNA sequence and provide:
1. Structural features of THIS sequence (GC content, CpG islands, repeats)
2. Functional implications for THIS gene in THIS organism
3. Mutation hotspots or conserved regions in THIS sequence
4. Relevance to the user's research question
5. Any patterns or notable features unique to THIS sequence

Be specific to this sequence only. Do not make general statements. Use scientific terminology.`

    const result = await tryGenerateContent(prompt, {
      temperature: 0.3,
      maxOutputTokens: 600,
    })

    console.log("[v0] Description generated successfully")
    return result.response.text().trim()
  } catch (error) {
    console.error("[v0] Gemini Description Error:", error.message)
    throw error
  }
}
