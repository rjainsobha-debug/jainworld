import { submitCorrection } from "./api.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page !== "corrections") {
    return;
  }

  const form = document.getElementById("corrections-form");
  const message = document.getElementById("corrections-message");

  if (!form || form.dataset.bound === "true") {
    return;
  }

  form.dataset.bound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = Object.fromEntries(new FormData(form).entries());
    trimPayload(payload);

    const validationError = validatePayload(payload);
    if (validationError) {
      showMessage(message, validationError, "error");
      return;
    }

    showMessage(message, "Sending your correction...", "neutral");
    const response = await submitCorrection(payload);

    if (response.ok !== true && response.success !== true) {
      showMessage(message, response.error || "We could not submit right now. Please try again later.", "error");
      return;
    }

    showMessage(message, response.message || "Your correction has been received for review.", "success");
    form.reset();
  });
});

function trimPayload(payload) {
  Object.keys(payload).forEach((key) => {
    if (typeof payload[key] === "string") {
      payload[key] = payload[key].trim();
    }
  });
}

function validatePayload(payload) {
  if (!String(payload.correction_type || "").trim()) {
    return "Please choose a correction category.";
  }

  if (!String(payload.related_page || "").trim() && !String(payload.related_slug || "").trim()) {
    return "Please provide the page URL or related slug.";
  }

  if (!String(payload.description || "").trim()) {
    return "Please describe the correction clearly.";
  }

  if (payload.submitted_by_email && !EMAIL_PATTERN.test(String(payload.submitted_by_email).trim())) {
    return "Please enter a valid email address or leave it blank.";
  }

  if (!String(payload.privacy_consent || "").trim()) {
    return "Please agree before sending your correction.";
  }

  return "";
}

function showMessage(node, text, tone = "neutral") {
  if (!node) {
    return;
  }

  const styles = {
    neutral: "mt-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600",
    success: "mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",
    error: "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
  };

  node.textContent = text;
  node.className = styles[tone] || styles.neutral;
}
