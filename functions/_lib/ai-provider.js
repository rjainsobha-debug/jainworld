import { normalizeString } from "./http.js";

export function getConfiguredProvider(env = {}) {
  const explicitProvider = normalizeString(env.AI_PROVIDER).toLowerCase();
  const model = normalizeString(env.AI_MODEL);

  if (explicitProvider && hasProviderCredentials(explicitProvider, env)) {
    return {
      provider: explicitProvider,
      model: model || ""
    };
  }

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
    return { provider: "cloudflare-ai", model: model || "" };
  }

  return null;
}

export async function generateGroundedAnswer({ question, sources, safetyLevel, language, env, prompt }) {
  const config = getConfiguredProvider(env);
  if (!config) {
    return null;
  }

  try {
    switch (config.provider) {
      case "openai":
        return await requestOpenAi(config, prompt, env);
      case "openrouter":
        return await requestOpenRouter(config, prompt, env);
      case "gemini":
        return await requestGemini(config, prompt, env);
      case "cloudflare-ai":
        return await requestCloudflareAi(config, prompt, env);
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
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
  if (provider === "cloudflare-ai") {
    return normalizeString(env.CLOUDFLARE_AI_ENABLED).toLowerCase() === "true";
  }
  return false;
}

async function requestOpenAi(config, prompt, env) {
  const apiKey = normalizeString(env.OPENAI_API_KEY);
  const model = config.model;
  if (!apiKey || !model) {
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
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
    return null;
  }

  const data = await response.json().catch(() => ({}));
  return extractResponseText(data);
}

async function requestOpenRouter(config, prompt, env) {
  const apiKey = normalizeString(env.OPENROUTER_API_KEY);
  const model = config.model;
  if (!apiKey || !model) {
    return null;
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
    return null;
  }

  const data = await response.json().catch(() => ({}));
  return normalizeString(data?.choices?.[0]?.message?.content);
}

async function requestGemini(config, prompt, env) {
  const apiKey = normalizeString(env.GEMINI_API_KEY);
  const model = config.model;
  if (!apiKey || !model) {
    return null;
  }

  const response = await fetch(
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
    return null;
  }

  const data = await response.json().catch(() => ({}));
  return normalizeString(data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join(" "));
}

async function requestCloudflareAi(config, prompt, env) {
  const accountId = normalizeString(env.CLOUDFLARE_ACCOUNT_ID);
  const apiToken = normalizeString(env.CLOUDFLARE_API_TOKEN);
  const model = config.model;

  // TODO: Prefer native Workers AI bindings when they are available in this repo's Pages Functions environment.
  if (!accountId || !apiToken || !model) {
    return null;
  }

  const response = await fetch(
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
    return null;
  }

  const data = await response.json().catch(() => ({}));
  return normalizeString(data?.result?.response || data?.result?.text);
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
