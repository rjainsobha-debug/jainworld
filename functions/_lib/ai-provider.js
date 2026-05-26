import { normalizeString } from "./http.js";

const REQUEST_TIMEOUT_MS = 18000;
const MAX_PROMPT_CHARS = 12000;

export function getConfiguredProvider(env = {}) {
  const explicitProvider = normalizeString(env.AI_PROVIDER).toLowerCase();
  const model = normalizeString(env.AI_MODEL);

  if (explicitProvider === "none") {
    return null;
  }

  if (!explicitProvider) {
    return inferProviderFromCredentials(env, model);
  }

  if (!hasProviderCredentials(explicitProvider, env)) {
    return null;
  }

  return {
    provider: explicitProvider,
    model: model || ""
  };
}

export async function generateGroundedAnswer({ question, sources, safetyLevel, language, env, prompt }) {
  const config = getConfiguredProvider(env);
  if (!config) {
    return {
      ok: false,
      answer: "",
      provider_used: "",
      model_used: "",
      raw_error_safe: ""
    };
  }

  const trimmedPrompt = normalizePrompt(prompt, sources);
  if (!trimmedPrompt) {
    return {
      ok: false,
      answer: "",
      provider_used: config.provider,
      model_used: config.model || "",
      raw_error_safe: "empty_prompt"
    };
  }

  try {
    switch (config.provider) {
      case "openai":
        return await requestOpenAi(config, trimmedPrompt, env);
      case "openrouter":
        return await requestOpenRouter(config, trimmedPrompt, env);
      case "gemini":
        return await requestGemini(config, trimmedPrompt, env);
      case "cloudflare":
      case "cloudflare-ai":
        return await requestCloudflareAi(config, trimmedPrompt, env);
      default:
        return {
          ok: false,
          answer: "",
          provider_used: "",
          model_used: "",
          raw_error_safe: "unsupported_provider"
        };
    }
  } catch (error) {
    return {
      ok: false,
      answer: "",
      provider_used: config.provider,
      model_used: config.model || "",
      raw_error_safe: sanitizeProviderError(error)
    };
  }
}

function inferProviderFromCredentials(env, model) {
  if (normalizeString(env.OPENAI_API_KEY)) {
    return { provider: "openai", model: model || "" };
  }

  if (normalizeString(env.GEMINI_API_KEY)) {
    return { provider: "gemini", model: model || "" };
  }

  if (normalizeString(env.OPENROUTER_API_KEY)) {
    return { provider: "openrouter", model: model || "" };
  }

  if (normalizeString(env.CLOUDFLARE_AI_ENABLED).toLowerCase() === "true") {
    return { provider: "cloudflare", model: model || "" };
  }

  return null;
}

function hasProviderCredentials(provider, env) {
  if (provider === "openai") {
    return Boolean(normalizeString(env.OPENAI_API_KEY));
  }
  if (provider === "gemini") {
    return Boolean(normalizeString(env.GEMINI_API_KEY));
  }
  if (provider === "openrouter") {
    return Boolean(normalizeString(env.OPENROUTER_API_KEY));
  }
  if (provider === "cloudflare" || provider === "cloudflare-ai") {
    return normalizeString(env.CLOUDFLARE_AI_ENABLED).toLowerCase() === "true";
  }
  return false;
}

function normalizePrompt(prompt, sources = []) {
  const sourceText = Array.isArray(sources)
    ? sources
        .slice(0, 5)
        .map((source) =>
          [normalizeString(source.title), normalizeString(source.summary), normalizeString(source.url)]
            .filter(Boolean)
            .join(" | ")
        )
        .join("\n")
    : "";

  const value = normalizeString(prompt || `${sourceText}`);
  if (!value) {
    return "";
  }

  return value.slice(0, MAX_PROMPT_CHARS);
}

async function requestOpenAi(config, prompt, env) {
  const apiKey = normalizeString(env.OPENAI_API_KEY);
  const model = normalizeString(config.model);
  if (!apiKey || !model) {
    return buildFailure(config.provider, model, "missing_credentials_or_model");
  }

  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  if (!response.ok) {
    return buildFailure(config.provider, model, `http_${response.status}`);
  }

  const data = await response.json().catch(() => ({}));
  return buildSuccess(config.provider, model, extractResponseText(data));
}

async function requestOpenRouter(config, prompt, env) {
  const apiKey = normalizeString(env.OPENROUTER_API_KEY);
  const model = normalizeString(config.model);
  if (!apiKey || !model) {
    return buildFailure(config.provider, model, "missing_credentials_or_model");
  }

  const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    return buildFailure(config.provider, model, `http_${response.status}`);
  }

  const data = await response.json().catch(() => ({}));
  return buildSuccess(config.provider, model, normalizeString(data?.choices?.[0]?.message?.content));
}

async function requestGemini(config, prompt, env) {
  const apiKey = normalizeString(env.GEMINI_API_KEY);
  const model = normalizeString(config.model);
  if (!apiKey || !model) {
    return buildFailure(config.provider, model, "missing_credentials_or_model");
  }

  const response = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    return buildFailure(config.provider, model, `http_${response.status}`);
  }

  const data = await response.json().catch(() => ({}));
  const answer = normalizeString(
    data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join(" ")
  );
  return buildSuccess(config.provider, model, answer);
}

async function requestCloudflareAi(config, prompt, env) {
  const accountId = normalizeString(env.CLOUDFLARE_ACCOUNT_ID);
  const apiToken = normalizeString(env.CLOUDFLARE_API_TOKEN);
  const model = normalizeString(config.model);

  // TODO: Prefer native Workers AI bindings when they are available for Pages Functions in this repo.
  if (!accountId || !apiToken || !model) {
    return buildFailure(config.provider, model, "missing_credentials_or_model");
  }

  const response = await fetchWithTimeout(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${encodeURIComponent(model)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }]
      })
    }
  );

  if (!response.ok) {
    return buildFailure(config.provider, model, `http_${response.status}`);
  }

  const data = await response.json().catch(() => ({}));
  const answer = normalizeString(data?.result?.response || data?.result?.text);
  return buildSuccess(config.provider, model, answer);
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildSuccess(provider, model, answer) {
  const normalizedAnswer = normalizeString(answer);
  if (!normalizedAnswer) {
    return buildFailure(provider, model, "empty_answer");
  }

  return {
    ok: true,
    answer: normalizedAnswer,
    provider_used: provider,
    model_used: model || "",
    raw_error_safe: ""
  };
}

function buildFailure(provider, model, code) {
  return {
    ok: false,
    answer: "",
    provider_used: provider || "",
    model_used: model || "",
    raw_error_safe: code || "provider_failed"
  };
}

function extractResponseText(data) {
  const direct = normalizeString(data?.output_text);
  if (direct) {
    return direct;
  }

  const content = Array.isArray(data?.output)
    ? data.output
        .flatMap((entry) => entry?.content || [])
        .map((entry) => entry?.text || "")
        .join(" ")
    : "";

  return normalizeString(content);
}

function sanitizeProviderError(error) {
  const raw = normalizeString(error?.name || error?.message || "provider_failed")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 80);

  if (!raw) {
    return "provider_failed";
  }

  if (raw.includes("abort")) {
    return "timeout";
  }

  return raw;
}
