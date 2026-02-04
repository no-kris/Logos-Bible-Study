function getPrompt(reference, text) {
  return `
    ROLE: You are an expert theological scholar specializing in historical-critical analysis, ancient languages, and biblical theology.

    TASK: Analyze the bible verse provided below. Provide a COMPREHENSIVE and DETAILED response.

    OUTPUT FORMAT:
    You must return a valid, parseable JSON object.
    Do not include markdown formatting (e.g., no \`\`\`json or \`\`\`).
    Do not include any introductory or concluding text.

    The JSON object must strictly follow this structure:
    {
      "historicalContext": "A comprehensive and detailed paragraph (at least 4-5 sentences) exploring the cultural, historical, and situational background of the verse.",
      "linguisticLens": "A detailed analysis of multiple key original words (Hebrew/Greek). Explain their nuance, root meaning, and significance in this context. Include pronunciation.",
      "crossReferences": "Two relevant cross-references with a detailed explanation (2-3 sentences) for each." Using this format: [
        {
          "verse": "Book Chapter:Verse",
          "explanation": "A detailed explanation of the theological or thematic connection."
        },
        {
          "verse": "Book Chapter:Verse",
          "explanation": "A detailed explanation of the theological or thematic connection."
        }
      ]
    }

    LINGUISTIC GUIDELINES (STRICT):
      - FORMAT: "Transliteration (Hebrew/Greek Script) [pronunciation] - definition/nuance".
      - EXAMPLE: "Elohim (אֱלֹהִים) [el-o-heem] - God, focusing on His power and creativity."
      - Do NOT include labels like "[Hebrew]" or "[Transliteration]" inside the JSON values.

    VERSE TO ANALYZE:
    ${reference}: "${text}"
  `;
}
