const TELEGRAM_API_BASE = "https://api.telegram.org";

function getTelegramConfig(env = process.env) {
  return {
    botToken: String(env.TELEGRAM_BOT_TOKEN || "").trim(),
    chatId: String(env.TELEGRAM_CHAT_ID || "").trim(),
    dryRun: String(env.TELEGRAM_DRY_RUN || "").trim().toLowerCase() === "true"
  };
}

function isConfigured(config = getTelegramConfig()) {
  return Boolean(config.botToken && config.chatId);
}

async function sendTelegramMessage(text, env = process.env) {
  const config = getTelegramConfig(env);
  const message = String(text || "").trim();

  if (!message) {
    return {
      ok: false,
      skipped: true,
      reason: "empty_message"
    };
  }

  if (!isConfigured(config)) {
    return {
      ok: true,
      skipped: true,
      reason: "env_not_configured"
    };
  }

  if (config.dryRun) {
    return {
      ok: true,
      skipped: true,
      reason: "dry_run",
      preview: message
    };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message
      })
    });

    if (!response.ok) {
      return {
        ok: false,
        skipped: false,
        reason: `http_${response.status}`
      };
    }

    const data = await response.json().catch(() => ({}));
    if (data.ok !== true) {
      return {
        ok: false,
        skipped: false,
        reason: "telegram_api_rejected"
      };
    }

    return {
      ok: true,
      skipped: false,
      reason: "sent"
    };
  } catch (error) {
    return {
      ok: false,
      skipped: false,
      reason: "request_failed"
    };
  }
}

module.exports = {
  getTelegramConfig,
  isConfigured,
  sendTelegramMessage
};
