import { getCalendar } from "./api.js";
import { getLanguage, pickLocalized } from "./language.js";

const calendarState = {
  items: [],
  currentDate: new Date()
};

export async function initCalendarPage() {
  const root = document.getElementById("calendar-app");
  if (!root) {
    return;
  }

  calendarState.items = await getCalendar({ limit: 100 });
  renderCalendar(root);
}

function renderCalendar(root) {
  const current = calendarState.currentDate;
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const monthName = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric"
  }).format(current);

  const offset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((offset + lastDay.getDate()) / 7) * 7;
  const monthEvents = calendarState.items.filter((item) => {
    const eventDate = new Date(item.date_gregorian);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });

  root.innerHTML = `
    <div class="jw-grid-2">
      <section class="jw-card p-5 lg:p-6">
        <div class="flex items-center justify-between gap-3">
          <button type="button" class="jw-btn" id="calendar-prev">Previous</button>
          <h2 class="m-0 text-xl font-semibold text-stone-900">${monthName}</h2>
          <button type="button" class="jw-btn" id="calendar-next">Next</button>
        </div>
        <div class="jw-calendar-grid mt-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>
        <div class="jw-calendar-grid mt-3">
          ${Array.from({ length: totalCells }, (_, index) => {
            const dayNumber = index - offset + 1;
            const inMonth = dayNumber >= 1 && dayNumber <= lastDay.getDate();
            if (!inMonth) {
              return `<div class="jw-calendar-cell is-muted"></div>`;
            }

            const isoDate = toIsoDate(year, month, dayNumber);
            const dayEvents = monthEvents.filter((item) => item.date_gregorian === isoDate);
            const isActive = dayEvents.length > 0;

            return `
              <button type="button" class="jw-calendar-cell ${isActive ? "is-active" : ""} text-left" data-calendar-date="${isoDate}">
                <div class="text-sm font-semibold text-stone-900">${dayNumber}</div>
                ${
                  dayEvents.length
                    ? `<div class="mt-2 space-y-1">${dayEvents
                        .slice(0, 2)
                        .map(
                          (event) =>
                            `<div class="rounded bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900">${escapeHtml(
                              pickLocalized(event, "festival", getLanguage()) || event.festival_en || ""
                            )}</div>`
                        )
                        .join("")}</div>`
                    : ""
                }
              </button>
            `;
          }).join("")}
        </div>
      </section>
      <aside class="jw-card p-5 lg:p-6">
        <h2 class="m-0 text-xl font-semibold text-stone-900">Festival Details</h2>
        <div id="calendar-detail" class="mt-4">${renderEventDetail(monthEvents[0] || null)}</div>
      </aside>
    </div>
  `;

  root.querySelector("#calendar-prev")?.addEventListener("click", () => {
    calendarState.currentDate = new Date(year, month - 1, 1);
    renderCalendar(root);
  });

  root.querySelector("#calendar-next")?.addEventListener("click", () => {
    calendarState.currentDate = new Date(year, month + 1, 1);
    renderCalendar(root);
  });

  root.querySelectorAll("[data-calendar-date]").forEach((button) => {
    button.addEventListener("click", () => {
      const selectedDate = button.getAttribute("data-calendar-date");
      const selectedEvent =
        calendarState.items.find((item) => item.date_gregorian === selectedDate) || null;
      const detail = root.querySelector("#calendar-detail");
      if (detail) {
        detail.innerHTML = renderEventDetail(selectedEvent);
      }
    });
  });
}

function renderEventDetail(item) {
  if (!item) {
    return `<p class="m-0 text-sm leading-7 text-stone-600">Select a date with a highlighted observance to view the tithi, rituals, and significance.</p>`;
  }

  const lang = getLanguage();

  return `
    <article class="space-y-4">
      <div>
        <span class="jw-badge">${escapeHtml(item.category || "Festival")}</span>
        <h3 class="mt-3 text-lg font-semibold text-stone-900">${escapeHtml(
          pickLocalized(item, "festival", lang) || item.festival_en || ""
        )}</h3>
      </div>
      <div class="space-y-2 text-sm leading-7 text-stone-600">
        <p class="m-0"><strong class="text-stone-900">Gregorian Date:</strong> ${escapeHtml(item.date_gregorian || "")}</p>
        <p class="m-0"><strong class="text-stone-900">Tithi:</strong> ${escapeHtml(item.tithi || "")}</p>
        <p class="m-0"><strong class="text-stone-900">Importance:</strong> ${escapeHtml(item.importance_level || "Medium")}</p>
        <p class="m-0"><strong class="text-stone-900">Fasting Required:</strong> ${escapeHtml(item.fasting_required || "Optional")}</p>
        <p class="m-0"><strong class="text-stone-900">Description:</strong> ${escapeHtml(
          pickLocalized(item, "description", lang) || item.description_en || ""
        )}</p>
        <p class="m-0"><strong class="text-stone-900">Rituals:</strong> ${escapeHtml(
          pickLocalized(item, "rituals", lang) || item.rituals_en || ""
        )}</p>
      </div>
    </article>
  `;
}

function toIsoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

