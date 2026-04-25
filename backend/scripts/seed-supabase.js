import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://vqqvmtgpathkoaujjuqv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_TNVdRdfK3qMXiVliV6a_vQ_kzXPHhYO';

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleData = [
  {
    sequence: "ATGCGTACTGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCGATCG",
    sequence_name: "BRCA1",
    gene_name: "BRCA1",
    organism: "Homo sapiens",
    chromosome: "17",
    description: "Breast cancer type 1 susceptibility protein. Plays a critical role in DNA repair.",
    length: 62,
    gc_content: 50.0
  },
  {
    sequence: "GCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGC",
    sequence_name: "TP53",
    gene_name: "TP53",
    organism: "Homo sapiens",
    chromosome: "17",
    description: "Tumor protein p53, acts as a tumor suppressor in many tumor types.",
    length: 62,
    gc_content: 53.2
  },
  {
    sequence: "ATATATATATATATATATATATATATATATATATATATATATATATATATATATATATATAT",
    sequence_name: "INS",
    gene_name: "INS",
    organism: "Homo sapiens",
    chromosome: "11",
    description: "Insulin, regulates blood glucose levels.",
    length: 62,
    gc_content: 0.0
  }
];

async function seedData() {
  console.log("Connecting to Supabase...");
  
  try {
    const { data, error } = await supabase
      .from('genomic_sequences')
      .insert(sampleData)
      .select();

    if (error) {
      console.error("Error inserting data:", error.message);
      return;
    }

    console.log("Successfully inserted", data.length, "records!");
  } catch (err) {
    console.error("Exception:", err);
  }
}

seedData();
