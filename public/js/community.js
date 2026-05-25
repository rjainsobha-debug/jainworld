import { submitCommunity } from "./api.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^[0-9+\-\s]{7,20}$/;

export function initCommunityForm() {
  const form = document.getElementById("community-form");
  const message = document.getElementById("community-message");

  if (!form || form.dataset.bound === "true") {
    return;
  }

  form.dataset.bound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (String(payload.website || "").trim()) {
      showMessage(
        message,
        "Thank you. Your request has been received. The JainWorld team will review it and contact you if more details are needed.",
        "success"
      );
      form.reset();
      return;
    }

    trimPayload(payload);
    if (!payload.interest_category && payload.join_as) {
      payload.interest_category = payload.join_as;
    }
    const validationError = validatePayload(payload);

    if (validationError) {
      showMessage(message, validationError, "error");
      return;
    }

    payload.verification_status = "pending";
    payload.created_at = new Date().toISOString();
    payload.whatsapp_group_preference = payload.whatsapp_updates ? "Yes" : "No";

    showMessage(message, "Sending your request...", "neutral");

    const response = await submitCommunity(payload);

    if (!response.success && response.ok !== true) {
      showMessage(
        message,
        response.error || "We could not send your request right now. Please try again in a few minutes.",
        "error"
      );
      return;
    }

    showMessage(
      message,
      response.message ||
        "Thank you. Your request has been received. The JainWorld team will review it and contact you if more details are needed.",
      "success"
    );
    form.reset();
  });
}

function trimPayload(payload) {
  Object.keys(payload).forEach((key) => {
    if (typeof payload[key] === "string") {
      payload[key] = payload[key].trim();
    }
  });
}

function validatePayload(payload) {
  if (!String(payload.name || "").trim()) {
    return "Please enter your full name.";
  }

  if (!MOBILE_PATTERN.test(String(payload.mobile || "").trim())) {
    return "Please enter a valid mobile number.";
  }

  if (!EMAIL_PATTERN.test(String(payload.email || "").trim())) {
    return "Please enter a valid email address.";
  }

  if (!String(payload.city || "").trim()) {
    return "Please enter your city.";
  }

  if (!String(payload.country || "").trim()) {
    return "Please enter your country.";
  }

  if (!String(payload.join_as || "").trim()) {
    return "Please choose how you would like to join JainWorld.";
  }

  if (!String(payload.preferred_language || "").trim()) {
    return "Please select your preferred language.";
  }

  if (!String(payload.privacy_consent || "").trim()) {
    return "Please agree to the Privacy Policy and Terms of Use.";
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
