import { askJainWorld, searchAll, submitAskFeedback } from "./api.js";

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "ask") {
    return;
  }

  const form = document.getElementById("ask-page-form");
  const input = document.getElementById("ask-page-input");
  const params = new URLSearchParams(window.location.search);
  const question = params.get("q") || "";

  if (input) {
    input.value = question;
  }

  if (question) {
    await runAsk(question);
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nextQuestion = String(input?.value || "").trim();
    updateUrl(nextQuestion);
    await runAsk(nextQuestion);
  });
});

async function runAsk(question) {
  const answerRoot = document.getElementById("ask-answer");
  const sourcesRoot = document.getElementById("ask-sources");
  const suggestionsRoot = document.getElementById("ask-suggestions");

  if (!answerRoot || !sourcesRoot || !suggestionsRoot) {
    return;
  }

  if (!question) {
    answerRoot.innerHTML = "";
    sourcesRoot.innerHTML = "";
    suggestionsRoot.innerHTML = "";
    setBanner("Ask a clear question to see a source-based JainWorld answer.", "neutral");
    return;
  }

  answerRoot.innerHTML = `<div class="soft-card p-5"><p class="m-0 text-sm text-stone-600">Asking JainWorld...</p></div>`;
  sourcesRoot.innerHTML = "";
  suggestionsRoot.innerHTML = "";

  try {
    const data = await askJainWorld({ question });
    if (!data?.ok) {
      throw new Error(data?.error || "Ask JainWorld is unavailable right now.");
    }

    renderAskAnswer(data);
    setBanner("Source-based answer ready.", "success");
  } catch (error) {
    await renderFallback(question, error.message || "JainWorld could not generate a verified answer right now.");
  }
}

async function renderFallback(question, message) {
  const answerRoot = document.getElementById("ask-answer");
  const sourcesRoot = document.getElementById("ask-sources");
  const suggestionsRoot = document.getElementById("ask-suggestions");
  const results = await searchAll(question, { limit: 10 }).catch(() => []);

  setBanner("JainWorld found related sources, but could not generate a verified answer right now.", "error");

  if (answerRoot) {
    answerRoot.innerHTML = `
      <div class="soft-card p-5">
        <span class="jw-kicker">Limited answer mode</span>
        <h2 class="mt-3 text-2xl font-semibold text-stone-900">JainWorld found these related sources, but cannot generate a verified answer right now.</h2>
        <p class="m-0 mt-3 text-sm leading-7 text-stone-600">${escapeHtml(message)}</p>
      </div>
    `;
  }

  if (sourcesRoot) {
    sourcesRoot.innerHTML = renderSources(results.slice(0, 5), question);
  }

  if (suggestionsRoot) {
    suggestionsRoot.innerHTML = renderSuggestions([
      { label: "Try JainWorld Search", url: `/search.html?q=${encodeURIComponent(question)}` },
      { label: "Browse Learn Jainism", url: "/education.html" },
      { label: "Explore Resources", url: "/resources.html" }
    ]);
  }
}

function renderAskAnswer(payload) {
  const answerRoot = document.getElementById("ask-answer");
  const sourcesRoot = document.getElementById("ask-sources");
  const suggestionsRoot = document.getElementById("ask-suggestions");
  const confidenceLabel = formatConfidence(payload.confidence);
  const helpfulActions = renderFeedbackActions(payload.ask_query_id, payload.question);

  if (answerRoot) {
    answerRoot.innerHTML = `
      <div class="soft-card p-5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="jw-badge jw-badge--approved">${escapeHtml(confidenceLabel)}</span>
          <span class="jw-badge ${payload.safety_level === "high_review" ? "jw-badge--needs-update" : "jw-badge--verified"}">${escapeHtml(formatSafety(payload.safety_level))}</span>
        </div>
        <h2 class="mt-4 text-2xl font-semibold text-stone-900">Source-based answer</h2>
        <p class="m-0 mt-3 text-sm leading-8 text-stone-700">${escapeHtml(payload.answer || "No answer available.")}</p>
        <div class="jw-page-actions mt-5">${helpfulActions}</div>
      </div>
    `;
  }

  if (sourcesRoot) {
    sourcesRoot.innerHTML = renderSources(payload.sources || [], payload.question);
  }

  if (suggestionsRoot) {
    suggestionsRoot.innerHTML = renderSuggestions(payload.suggestions || []);
  }

  bindFeedbackButtons(payload);
}

function renderSources(sources, question) {
  if (!Array.isArray(sources) || !sources.length) {
    return `
      <div class="soft-card p-5">
        <h3 class="m-0 text-xl font-semibold text-stone-900">Related sources</h3>
        <p class="m-0 mt-3 text-sm leading-7 text-stone-600">JainWorld does not have enough linked sources for this question yet.</p>
        <p class="m-0 mt-3 text-sm"><a href="/search.html?q=${encodeURIComponent(question || "")}" class="text-amber-800 hover:text-amber-900">Open JainWorld Search instead</a></p>
      </div>
    `;
  }

  return `
    <div class="soft-card p-5">
      <h3 class="m-0 text-xl font-semibold text-stone-900">Related sources</h3>
      <div class="jw-list mt-4">
        ${sources
          .map(
            (source) => `
              <article class="jw-card p-5">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="jw-badge">${escapeHtml(formatType(source.type))}</span>
                  ${source.score ? `<span class="jw-badge jw-badge--verified">Score ${escapeHtml(String(source.score))}</span>` : ""}
                </div>
                <h4 class="mt-3 text-lg font-semibold text-stone-900"><a href="${escapeHtml(source.url || "/search.html")}" class="hover:text-amber-800">${escapeHtml(source.title || "Untitled source")}</a></h4>
                <p class="m-0 mt-2 text-sm leading-7 text-stone-600">${escapeHtml(source.summary || "No summary available.")}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderSuggestions(suggestions) {
  if (!Array.isArray(suggestions) || !suggestions.length) {
    return "";
  }

  return `
    <div class="soft-card p-5">
      <h3 class="m-0 text-xl font-semibold text-stone-900">What to explore next</h3>
      <div class="jw-search-suggestions mt-4">
        ${suggestions
          .map((item) => {
            const label = typeof item === "string" ? item : item.label;
            const url = typeof item === "string" ? `/search.html?q=${encodeURIComponent(item)}` : item.url;
            return `<a href="${escapeHtml(url || "/search.html")}" class="topic-chip">${escapeHtml(label || "Explore")}</a>`;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderFeedbackActions(askQueryId, question) {
  return `
    <button type="button" class="jw-btn" data-ask-feedback="helpful" data-ask-query-id="${escapeHtml(askQueryId || "")}" data-ask-question="${escapeHtml(question || "")}">Helpful</button>
    <button type="button" class="jw-btn" data-ask-feedback="not_helpful" data-ask-query-id="${escapeHtml(askQueryId || "")}" data-ask-question="${escapeHtml(question || "")}">Not helpful</button>
    <button type="button" class="jw-btn" data-ask-feedback="needs_correction" data-ask-query-id="${escapeHtml(askQueryId || "")}" data-ask-question="${escapeHtml(question || "")}">Needs correction</button>
  `;
}

function bindFeedbackButtons(payload) {
  document.querySelectorAll("[data-ask-feedback]").forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }

    button.dataset.bound = "true";
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const response = await submitAskFeedback({
          ask_query_id: button.getAttribute("data-ask-query-id"),
          question: button.getAttribute("data-ask-question"),
          feedback: button.getAttribute("data-ask-feedback"),
          notes: ""
        });

        if (!response?.ok) {
          throw new Error(response?.error || "Feedback could not be saved right now.");
        }

        setBanner("Thank you. Your feedback was received.", "success");
      } catch (error) {
        setBanner("Feedback could not be saved right now. Please try again later.", "error");
      } finally {
        button.disabled = false;
      }
    });
  });
}

function setBanner(text, tone = "neutral") {
  const node = document.getElementById("ask-feedback-banner");
  if (!node) {
    return;
  }

  const classes = {
    neutral: "soft-card p-5",
    success: "soft-card p-5 border border-amber-200 bg-amber-50",
    error: "soft-card p-5 border border-red-200 bg-red-50"
  };

  node.className = classes[tone] || classes.neutral;
  node.innerHTML = `<p class="m-0 text-sm text-stone-600">${escapeHtml(text)}</p>`;
}

function updateUrl(question) {
  const url = new URL(window.location.href);
  if (question) {
    url.searchParams.set("q", question);
  } else {
    url.searchParams.delete("q");
  }
  window.history.replaceState({}, "", url);
}

function formatType(type) {
  return String(type || "source")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatConfidence(confidence) {
  const value = String(confidence || "").toLowerCase();
  if (value === "high") {
    return "Strong source coverage";
  }
  if (value === "medium") {
    return "Good source coverage";
  }
  if (value === "low") {
    return "Limited source coverage";
  }
  return "Insufficient source coverage";
}

function formatSafety(level) {
  return level === "high_review" ? "Needs extra verification" : "Normal review level";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
