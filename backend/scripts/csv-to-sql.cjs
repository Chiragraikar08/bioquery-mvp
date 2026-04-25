const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\CHIRAG.C\\Bioquery1\\bioquery-mvp\\Bioquery_files\\genomic_data.csv');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;
  const sqlStatements = [];
  
  // Create a massive batched insert statement for efficiency
  sqlStatements.push('INSERT INTO public.genomic_sequences (id, sequence_name, sequence, organism, gene_name, chromosome, description, length, gc_content, created_at) VALUES');

  const values = [];

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    
    if (!line.trim()) continue;

    // A simple split by comma won't work well if descriptions have commas.
    // Assuming this specific CSV doesn't have escaped commas based on the sample, 
    // but just in case, we'll do a basic parse or use papaparse.
    // The backend package.json has 'papaparse'. Let's use it or just split since it's simple.
    
    // Format: id,sequence_name,sequence,organism,gene_name,chromosome,description,length,gc_content,created_at
    const parts = line.split(',');
    
    // In case description has commas, re-join the middle parts
    const id = parts[0];
    const sequence_name = parts[1].replace(/'/g, "''");
    const sequence = parts[2];
    const organism = parts[3].replace(/'/g, "''");
    const gene_name = parts[4].replace(/'/g, "''");
    const chromosome = parts[5];
    
    const lengthStr = parts[parts.length - 3];
    const gc_contentStr = parts[parts.length - 2];
    const created_atStr = parts[parts.length - 1];
    
    const descParts = parts.slice(6, parts.length - 3);
    const description = descParts.join(',').replace(/'/g, "''");
    
    values.push(`('${id}', '${sequence_name}', '${sequence}', '${organism}', '${gene_name}', '${chromosome}', '${description}', ${lengthStr}, ${gc_contentStr}, '${created_atStr}')`);
  }

  // Join values with comma
  const finalSql = sqlStatements[0] + '\n' + values.join(',\n') + ';';
  
  fs.writeFileSync('C:\\Users\\CHIRAG.C\\Bioquery1\\bioquery-mvp\\insert_data.sql', finalSql);
  console.log('Successfully created insert_data.sql! Total rows:', values.length);
}

processLineByLine();
