const verseInput = document.getElementById("verseInput");
const searchBtn = document.getElementById("searchBtn");
const resultsArea = document.getElementById("resultsArea");

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

const renderResults = (reference, text) => {
  let html = `
      <div class="verse-display">
          <p class="verse-text">"${text.trim()}"</p>
          <p class="verse-ref">${reference}</p>
      </div>
      <article class="analysis-card">
          <div class="card-header">
              <h3>Historical Context</h3>
          </div>
          <div class="card-content"><p>Example historical context</p></div>
      </article>
      <article class="analysis-card">
          <div class="card-header">
              <h3>Linguistic Lens</h3>
          </div>
          <div class="card-content"><p>Example linguistic lens</p></div>
      </article>
      <article class="analysis-card">
          <div class="card-header">
              <h3>Cross-References</h3>
          </div>
          <div class="card-content"><p>Example cross-reference</p></div>
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

  try {
    const bibleData = await fetchVerseData(verseQuery);
    renderResults(bibleData.reference, bibleData.text);
  } catch (error) {
    resultsArea.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    resultsArea.classList.add("visible");
  } finally {
    searchBtn.disabled = false;
  }
};

verseInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") performAnalysis();
});
searchBtn.addEventListener("click", performAnalysis);
