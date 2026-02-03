const verseInput = document.getElementById("verseInput");
const searchBtn = document.getElementById("searchBtn");
const resultsArea = document.getElementById("resultsArea");
const loader = document.getElementById("loader");
const loaderText = document.getElementById("loaderText");

// fetchWithRetry: A wrapper around fetch to retry requests on failure.
//                 Retries 3 times with a 1-second delay by default.
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      // If the response is OK, or if it's a client error (4xx) that we shouldn't retry, return it.
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      throw new Error(`Request failed with status ${response.status}`);
    } catch (error) {
      const isLastAttempt = i === retries - 1;
      if (isLastAttempt) throw error;

      console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// fetchVerseData: This function uses the free bible-api.com api to
//                 fetch and return a JSON object containing the verse
//                 reference and text. Uses the default World English
//                 Bible translation.
const fetchVerseData = async (verseQuery) => {
  const response = await fetch(
    `https://bible-api.com/${encodeURIComponent(verseQuery)}`,
  );
  if (!response.ok)
    throw new Error("Verse not found. Please check your verse input.");
  return await response.json();
};

// generateTheology: Call the AI model using the OpenRouter API with
//                   the prompt. Return a JSON object containing the
//                   historical context, linguistic lens, and
//                   two cross references for the bible verse.
const generateTheology = async (reference, text) => {
  // Check if API key exists
  if (typeof CONFIG === "undefined" || !CONFIG.OPENROUTER_API_KEY) {
    throw new Error("API key missing. Check js/config.js.");
  }

  const prompt = getPrompt(reference, text);

  const response = await fetchWithRetry(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href,
        "X-Title": "Logos Bible Study",
      },
      body: JSON.stringify({
        model: CONFIG.OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    console.log(error);
    throw new Error("AI Analysis failed. Try again.");
  }

  const data = await response.json();
  // console.log(data);
  let content = data.choices[0].message.content.trim();

  // Extract JSON object by finding the first '{' and last '}'
  const startIndex = content.indexOf("{");
  const endIndex = content.lastIndexOf("}");

  if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(startIndex, endIndex + 1);
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Analysis Failed:", error);
    throw new Error("Failed to parse AI response. Try again.");
  }
};

// getCrossReferences: Handle cases where the cross references
//                     returned by the AI model are in the form
//                     of an array of objects.
const getCrossReferences = (analysis) => {
  let crossRefContent = "";

  if (Array.isArray(analysis.crossReferences)) {
    crossRefContent = analysis.crossReferences
      .map((item) => {
        const ref = item.reference || item.verse || item.ref;
        const exp = item.explanation || item.description || item.text;
        return `<p><strong>${ref}:</strong> ${exp}</p>`;
      })
      .join("");
  } else {
    // Fallback for strings
    crossRefContent = `<p>${analysis.crossReferences || "No references found."}</p>`;
  }

  return crossRefContent;
};

// renderResults: Generate the HTML content of the results
//                area section. Using the data provided by the
//                bible-api.com API and the AI model analysis.
const renderResults = (reference, text, analysis) => {
  loader.style.display = "none";

  let crossRefHtml = getCrossReferences(analysis);

  let html = `
      <div class="verse-display">
          <p class="verse-text">"${text.trim()}"</p>
          <p class="verse-ref">${reference}</p>
      </div>
      <article class="analysis-card">
          <div class="card-header">
              <h3>Historical Context</h3>
          </div>
          <div class="card-content"><p>${analysis.historicalContext}</p></div>
      </article>
      <article class="analysis-card">
          <div class="card-header">
              <h3>Linguistic Lens</h3>
          </div>
          <div class="card-content"><p>${analysis.linguisticLens}</p></div>
      </article>
      <article class="analysis-card">
          <div class="card-header">
              <h3>Cross-References</h3>
          </div>
          <div class="card-content"><p>${crossRefHtml}</p></div>
      </article>
  `;

  resultsArea.innerHTML = html;

  setTimeout(() => {
    resultsArea.classList.add("visible");
  }, 50);
};

const performAnalysis = async () => {
  const verseQuery = verseInput.value.trim();
  if (!verseQuery) return;

  // Disable analysis button and reset previous value of the results area.
  searchBtn.disabled = true;
  resultsArea.innerHTML = "";
  resultsArea.classList.remove("visible");
  loader.style.display = "block";

  try {
    const bibleData = await fetchVerseData(verseQuery);
    loaderText.innerText = "Generating Analysis, Please Wait...";
    const theologyData = await generateTheology(
      bibleData.reference,
      bibleData.text,
    );
    renderResults(bibleData.reference, bibleData.text, theologyData);
  } catch (error) {
    console.log(error);
    loader.style.display = "none";
    resultsArea.innerHTML = `<div class="error-message">Error: Failed to generate analysis. Try again.</div>`;
    resultsArea.classList.add("visible");
  } finally {
    searchBtn.disabled = false;
  }
};

verseInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") performAnalysis();
});
searchBtn.addEventListener("click", performAnalysis);
