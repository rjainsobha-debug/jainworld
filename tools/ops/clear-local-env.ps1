$ErrorActionPreference = "Stop"

$varsToClear = @(
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "TELEGRAM_DRY_RUN",
  "AI_PROVIDER",
  "AI_MODEL",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "OPENROUTER_API_KEY"
)

foreach ($name in $varsToClear) {
  Remove-Item -Path ("Env:{0}" -f $name) -ErrorAction SilentlyContinue
  [Environment]::SetEnvironmentVariable($name, $null, "Process")
  try {
    [Environment]::SetEnvironmentVariable($name, $null, "User")
  } catch {
    # Ignore user-scope clearing errors on locked-down systems.
  }
  Write-Host ("Cleared: {0}" -f $name)
}

Write-Host "Local optional environment variables cleared."
