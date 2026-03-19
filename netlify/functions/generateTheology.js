/**
 * Creates a standardized HTTP response object.
 *
 * @param {number} statusCode - The HTTP status code (e.g., 200, 400, 500).
 * @param {Object|string} bodyData - The data to serialize into the response body.
 * @returns {Object} A response object containing statusCode, headers, and body.
 */
function createResponse(statusCode, bodyData) {
  const isString = typeof bodyData === "string";
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: isString ? bodyData : JSON.stringify(bodyData),
  };
}

/**
 * Validates the incoming request method and extracts the prompt from the body.
 *
 * @param {Object} event - The Netlify event object containing the request details.
 * @returns {Object} An object containing either the extracted `prompt` or an `errorResponse` object if validation fails.
 */
function validateRequest(event) {
  // Ensure the endpoint is only accessed via POST
  if (event.httpMethod !== "POST") {
    return {
      errorResponse: createResponse(405, { error: "Method Not Allowed" }),
    };
  }

  try {
    // Safely parse the JSON body
    const body = event.body ? JSON.parse(event.body) : {};
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return {
        errorResponse: createResponse(400, {
          error: "Missing or invalid prompt in request body",
        }),
      };
    }

    return { prompt };
  } catch (error) {
    return {
      errorResponse: createResponse(400, {
        error: "Invalid JSON format in request body",
      }),
    };
  }
}

/**
 * Calls the OpenRouter API to generate a chat completion based on the provided prompt.
 *
 * @param {string} prompt - The user's input prompt to send to the model.
 * @param {string} apiKey - The API key for authentication.
 * @param {string} model - The identifier for the model to use.
 * @returns {Promise<Object>} A promise that resolves to the parsed JSON response from the API.
 * @throws {Error} Throws a custom error object containing the status and body if the API request fails.
 */
async function callOpenRouterAPI(prompt, apiKey, model, url) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://logos-bible-study.com/",
      "X-Title": "Logos Bible Study",
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API Error Response:", errorText);

    // Attach status and body to the error so the handler can forward it
    const error = new Error(
      `OpenRouter API responded with status: ${response.status}`,
    );
    error.status = response.status;
    error.body = errorText;
    throw error;
  }

  return response.json();
}

/**
 * Main entry point for the Netlify Function.
 *
 * @param {Object} event - The Netlify event object.
 * @returns {Promise<Object>} A promise that resolves to the final HTTP response sent back to the client.
 */
exports.handler = async function (event) {
  try {
    const validation = validateRequest(event);
    if (validation.errorResponse) {
      return validation.errorResponse;
    }
    const { prompt } = validation;

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL;
    const BASE_URL = process.env.BASE_URL;

    if (!OPENROUTER_API_KEY) {
      console.error(
        "Critical Error: API_KEY is missing from environment variables.",
      );
      return createResponse(500, { error: "Server Configuration Error" });
    }

    if (!OPENROUTER_MODEL) {
      console.warn(
        "Warning: MODEL is not set. The API call may fail if a default is not configured on OpenRouter.",
      );
    }

    const data = await callOpenRouterAPI(
      prompt,
      OPENROUTER_API_KEY,
      OPENROUTER_MODEL,
      BASE_URL,
    );

    return createResponse(200, data);
  } catch (error) {
    console.error("Function Handler Error:", error);

    // If the error originated from the OpenRouter API call, forward its status and body
    if (error.status && error.body) {
      return createResponse(error.status, error.body);
    }

    return createResponse(500, { error: "Internal Server Error" });
  }
};
