function getPrompt(reference, text) {
  return `
    ROLE: You are an expert theological scholar specializing in historical-critical analysis, ancient languages, and biblical theology.

    TASK: Analyze the bible verse provided below.

    OUTPUT FORMAT:
    You must return a valid, parseable JSON object.
    Do not include markdown formatting (e.g., no \`\`\`json or \`\`\`).
    Do not include any introductory or concluding text.

    The JSON object must strictly follow this structure:
    {
      "historicalContext": "A brief paragraph on cultural/historical background.",
      "linguisticLens": "Analysis of key original words including pronunciation.",
      "crossReferences": "Two relevant cross-references with a 1-sentence explanation each." Using this format: [
        {
          "verse": "Book Chapter:Verse",
          "explanation": "A brief explanation of the connection."
        },
        {
          "verse": "Book Chapter:Verse",
          "explanation": "A brief explanation of the connection."
        }
      ]
    }

    LINGUISTIC GUIDELINES (STRICT):
      - FORMAT: "Transliteration (Hebrew/Greek Script) [pronunciation]".
      - EXAMPLE: "Elohim (אֱלֹהִים) [el-o-heem]" or "bara (ברא) [bah-rah]".
      - Do NOT include labels like "[Hebrew]" or "[Transliteration]" inside the JSON values.

    VERSE TO ANALYZE:
    ${reference}: "${text}"
  `;
}
