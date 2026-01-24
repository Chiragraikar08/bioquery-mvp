import { createClient } from "@supabase/supabase-js"

// ✅ ENV SAFETY CHECK (no logic change)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
}

const supabase = createClient(supabaseUrl, supabaseKey)

// SQL parser to convert SQL to Supabase query builder
const parseSQLToSupabaseQuery = (sqlQuery) => {
  console.log(`\n=== Parsing SQL Query ===`)
  console.log(`SQL: ${sqlQuery}`)

  // Start building query
  let query = supabase.from("genomic_sequences").select("*")

  // Extract WHERE conditions - improved regex to catch all cases
  const whereMatch = sqlQuery.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/is)
  if (!whereMatch) {
    // Check if it's a SELECT * without WHERE - this should return all
    if (sqlQuery.match(/SELECT\s+\*\s+FROM\s+genomic_sequences\s*$/i)) {
      console.log("No WHERE clause found - returning all with limit")
      return query.limit(100)
    }
    // If there's no WHERE but it's not SELECT *, something might be wrong
    console.warn("No WHERE clause found in query")
    return query.limit(100)
  }

  let conditions = whereMatch[1].trim()
  console.log(`Extracted WHERE conditions: ${conditions}`)

  // Handle OR conditions first - Supabase doesn't support OR directly
  if (conditions.includes(" OR ")) {
    const orParts = conditions.split(/\s+OR\s+/i)
    conditions = orParts[0].trim() // Use first OR condition for now
    console.warn("OR conditions detected, using first condition only")
  }

  // Handle AND conditions - split and process each
  const andParts = conditions.split(/\s+AND\s+/i)
  console.log(`Split into ${andParts.length} AND condition(s)`)

  let conditionsApplied = 0

  andParts.forEach((part, index) => {
    part = part.trim()
    if (!part) return

    console.log(`Processing condition part: ${part}`)

    // Parse exact equality (column = 'value')
    const exactEqMatch = part.match(/(\w+)\s*=\s*'([^']+)'/i)
    if (exactEqMatch) {
      const [, column, value] = exactEqMatch
      console.log(`[${index + 1}] Applying exact match: ${column} = '${value}'`)
      query = query.eq(column, value)
      conditionsApplied++
      return
    }

    // Parse ILIKE with wildcards (column ILIKE '%value%')
    const ilikeWildcardMatch = part.match(/(\w+)\s+ILIKE\s+'%([^%]+)%'/i)
    if (ilikeWildcardMatch) {
      const [, column, value] = ilikeWildcardMatch
      console.log(`[${index + 1}] Applying ILIKE wildcard: ${column} ILIKE '%${value}%'`)
      query = query.ilike(column, `%${value}%`)
      conditionsApplied++
      return
    }

    // Parse ILIKE without wildcards (column ILIKE 'value')
    const ilikeMatch = part.match(/(\w+)\s+ILIKE\s+'([^']+)'/i)
    if (ilikeMatch) {
      const [, column, value] = ilikeMatch
      console.log(`[${index + 1}] Applying ILIKE: ${column} ILIKE '${value}'`)
      query = query.ilike(column, value)
      conditionsApplied++
      return
    }

    // Parse LIKE with wildcards (column LIKE '%value%')
    const likeWildcardMatch = part.match(/(\w+)\s+LIKE\s+'%([^%]+)%'/i)
    if (likeWildcardMatch) {
      const [, column, value] = likeWildcardMatch
      console.log(`[${index + 1}] Applying LIKE wildcard: ${column} LIKE '%${value}%'`)
      query = query.like(column, `%${value}%`)
      conditionsApplied++
      return
    }

    // Parse LIKE without wildcards (column LIKE 'value')
    const likeMatch = part.match(/(\w+)\s+LIKE\s+'([^']+)'/i)
    if (likeMatch) {
      const [, column, value] = likeMatch
      console.log(`[${index + 1}] Applying LIKE: ${column} LIKE '${value}'`)
      query = query.like(column, value)
      conditionsApplied++
      return
    }

    // Parse comparison operators (column > 50, column < 100, etc.)
    const comparisonMatch = part.match(/(\w+)\s*(>|<|>=|<=)\s*(\d+\.?\d*)/i)
    if (comparisonMatch) {
      const [, column, operator, value] = comparisonMatch
      const numValue = Number.parseFloat(value)
      console.log(`[${index + 1}] Applying comparison: ${column} ${operator} ${numValue}`)
      if (operator === ">") {
        query = query.gt(column, numValue)
      } else if (operator === "<") {
        query = query.lt(column, numValue)
      } else if (operator === ">=") {
        query = query.gte(column, numValue)
      } else if (operator === "<=") {
        query = query.lte(column, numValue)
      }
      conditionsApplied++
      return
    }

    // Parse IS NOT NULL
    const notNullMatch = part.match(/(\w+)\s+IS\s+NOT\s+NULL/i)
    if (notNullMatch) {
      const [, column] = notNullMatch
      console.log(`[${index + 1}] Applying IS NOT NULL: ${column}`)
      query = query.not(column, "is", null)
      conditionsApplied++
      return
    }

    // Parse IS NULL
    const nullMatch = part.match(/(\w+)\s+IS\s+NULL/i)
    if (nullMatch) {
      const [, column] = nullMatch
      console.log(`[${index + 1}] Applying IS NULL: ${column}`)
      query = query.is(column, null)
      conditionsApplied++
      return
    }

    console.warn(`Could not parse condition: ${part}`)
  })

  console.log(`Applied ${conditionsApplied} condition(s)`)

  if (conditionsApplied === 0 && whereMatch) {
    console.error("WARNING: WHERE clause found but no conditions were applied!")
  }

  // Extract LIMIT
  const limitMatch = sqlQuery.match(/LIMIT\s+(\d+)/i)
  if (limitMatch) {
    const limitValue = Number.parseInt(limitMatch[1])
    console.log(`Applying LIMIT: ${limitValue}`)
    query = query.limit(limitValue)
  } else {
    // For sequence_name exact queries, limit to 1
    if (/sequence_name\s*=\s*'[^']+'/i.test(sqlQuery)) {
      console.log("Applying default LIMIT: 1 (sequence_name exact match)")
      query = query.limit(1)
    } else {
      console.log("Applying default LIMIT: 100")
      query = query.limit(100) // Default limit
    }
  }

  console.log(`Final query built with ${conditionsApplied} condition(s) applied`)
  return query
}

export const executeGenomicQuery = async (sqlQuery) => {
  try {
    console.log(`\n=== Executing SQL Query ===`)
    console.log(`SQL: ${sqlQuery}`)

    // Check if query has WHERE clause
    const hasWhere = /WHERE\s+/i.test(sqlQuery)

    // Parse SQL and convert to Supabase query
    const query = parseSQLToSupabaseQuery(sqlQuery)

    const { data, error } = await query

    if (error) {
      console.error("Supabase query error:", error)
      throw error
    }

    console.log(`Query successful. Returned ${data?.length || 0} result(s)`)
    if (data && data.length > 0 && data.length <= 5) {
      console.log(`Results:`, data.map((r) => r.sequence_name || r.id).join(", "))
    } else if (hasWhere && data && data.length === 0) {
      console.log("No results found matching the query conditions")
    } else if (hasWhere && data && data.length > 100) {
      console.warn(
        `WARNING: Query with WHERE clause returned ${data.length} results. Filters may not be applied correctly.`,
      )
    }

    return data || []
  } catch (error) {
    console.error("Error executing query:", error.message)
    throw new Error(`Query execution failed: ${error.message}`)
  }
}

export const addGenomicData = async (data) => {
  try {
    // Validate that data is an array
    if (!Array.isArray(data)) {
      throw new Error("Data must be an array of genomic sequence objects")
    }

    if (data.length === 0) {
      throw new Error("No data provided to insert")
    }

    console.log(`[v0] Starting insertion of ${data.length} genomic records`)

    const validatedData = data.map((record, index) => {
      const validated = {
        sequence: record.sequence || record.dna_sequence,
        sequence_name: record.sequence_name || record.gene_name || "Unknown",
        gene_name: record.gene_name || "Unknown",
        organism: record.organism || "Unknown",
        chromosome: record.chromosome || null,
        description: record.description || null,
        length: record.length ? Number.parseInt(record.length) : null,
        gc_content: record.gc_content ? Number.parseFloat(record.gc_content) : null,
      }

      // Verify required fields exist
      if (!validated.sequence || !validated.gene_name || !validated.organism) {
        throw new Error(
          `Record ${index + 1} is missing required fields. Found: sequence=${!!validated.sequence}, gene_name=${!!validated.gene_name}, organism=${!!validated.organism}`,
        )
      }

      return validated
    })

    console.log(`[v0] All ${validatedData.length} records validated successfully`)

    const { data: result, error } = await supabase.from("genomic_sequences").insert(validatedData).select() // Added select() to return inserted records

    if (error) {
      console.error(`[v0] Supabase insert error (${error.code}):`, error.message)
      throw new Error(`Failed to insert data into Supabase: ${error.message}`)
    }

    if (!result || result.length === 0) {
      throw new Error("Insert operation completed but no records were returned")
    }

    console.log(`[v0] Successfully inserted ${result.length} records into genomic_sequences table`)
    return result
  } catch (error) {
    console.error(`[v0] addGenomicData error:`, error.message)
    throw error
  }
}

// Get sequence data by sequence_name for 3D visualization
export const getSequenceByName = async (sequenceName) => {
  try {
    const { data, error } = await supabase
      .from("genomic_sequences")
      .select("*")
      .ilike("sequence_name", `%${sequenceName}%`)
      .limit(1)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error fetching sequence by name:", error)
    throw error
  }
}
