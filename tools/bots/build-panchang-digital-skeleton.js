const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..", "..");
const dataDir = path.join(rootDir, "public", "data");
const assetDir = path.join(rootDir, "public", "assets", "calendar", "panchang-2026");

const YEAR = 2026;
const SOURCE_NAME = "Tirthankar Vardhman Jain Panchang 2026";
const SOURCE_URL = "https://www.onlinejainpathshala.com/";
const SOURCE_SITE = "onlinejainpathshala.com";
const PUBLISHER = "Amar Granthalaya / Online Jain Pathshala";
const PDF_URL = "/assets/calendar/panchang-2026/panchang-back-page-2026.pdf";

const MONTHS = [
  { number: 1, en: "January", hi: "जनवरी", slug: "january" },
  { number: 2, en: "February", hi: "फरवरी", slug: "february" },
  { number: 3, en: "March", hi: "मार्च", slug: "march" },
  { number: 4, en: "April", hi: "अप्रैल", slug: "april" },
  { number: 5, en: "May", hi: "मई", slug: "may" },
  { number: 6, en: "June", hi: "जून", slug: "june" },
  { number: 7, en: "July", hi: "जुलाई", slug: "july" },
  { number: 8, en: "August", hi: "अगस्त", slug: "august" },
  { number: 9, en: "September", hi: "सितंबर", slug: "september" },
  { number: 10, en: "October", hi: "अक्टूबर", slug: "october" },
  { number: 11, en: "November", hi: "नवंबर", slug: "november" },
  { number: 12, en: "December", hi: "दिसंबर", slug: "december" }
];

const WEEKDAYS = [
  { en: "Sunday", hi: "रविवार" },
  { en: "Monday", hi: "सोमवार" },
  { en: "Tuesday", hi: "मंगलवार" },
  { en: "Wednesday", hi: "बुधवार" },
  { en: "Thursday", hi: "गुरुवार" },
  { en: "Friday", hi: "शुक्रवार" },
  { en: "Saturday", hi: "शनिवार" }
];

function main() {
  ensureDir(dataDir);

  const months = MONTHS.map((month) => buildMonth(month));
  const digital = {
    id: "panchang-digital-2026",
    year: YEAR,
    title: "Digital Jain Panchang 2026",
    title_hi: "डिजिटल जैन पंचांग 2026",
    summary: "A review-first digital calendar shell for the 2026 Jain Panchang scans. Exact observance details remain pending manual extraction.",
    summary_hi: "2026 जैन पंचांग स्कैन के लिए समीक्षा-प्रथम डिजिटल कैलेंडर ढांचा। सटीक पालन विवरण अभी मैन्युअल निकासी पर लंबित हैं।",
    source_name: SOURCE_NAME,
    source_url: SOURCE_URL,
    source_site: SOURCE_SITE,
    publisher: PUBLISHER,
    credit_text: `Source: ${SOURCE_NAME} / ${PUBLISHER}.`,
    attribution_text: `Source: ${SOURCE_NAME} / ${PUBLISHER}. Please keep credits visible.`,
    permission_status: "needs_documented_confirmation",
    license_status: "source_provided",
    hosting_allowed: false,
    external_link_only: false,
    review_status: "pending_review",
    last_checked_at: "2026-06-02",
    caution_note: "Dates may vary by panchang, location, tradition, and local sangh verification.",
    caution_note_hi: "तिथियाँ पंचांग, स्थान, परंपरा और स्थानीय संघ सत्यापन के अनुसार भिन्न हो सकती हैं।",
    source_note: "Source-provided archive reference only. Manual extraction and verification required before any date is treated as final.",
    source_note_hi: "केवल स्रोत-आधारित अभिलेख संदर्भ। किसी भी तिथि को अंतिम मानने से पहले मैन्युअल निकासी और सत्यापन आवश्यक है।",
    months
  };

  fs.writeFileSync(path.join(dataDir, "panchang-digital-2026.json"), JSON.stringify(digital, null, 2), "utf8");
  fs.writeFileSync(path.join(dataDir, "review-panchang-manual-extraction.json"), JSON.stringify(buildManualQueue(months), null, 2), "utf8");
  if (!fs.existsSync(path.join(dataDir, "review-panchang-ocr-extraction.json"))) {
    fs.writeFileSync(path.join(dataDir, "review-panchang-ocr-extraction.json"), JSON.stringify(buildOcrQueue(months), null, 2), "utf8");
  }

  console.log(`Wrote ${relativePath(path.join(dataDir, "panchang-digital-2026.json"))}`);
  console.log(`Wrote ${relativePath(path.join(dataDir, "review-panchang-manual-extraction.json"))}`);
  console.log(`Wrote ${relativePath(path.join(dataDir, "review-panchang-ocr-extraction.json"))}`);
}

function buildMonth(month) {
  const daysInMonth = new Date(YEAR, month.number, 0).getDate();
  const monthImage = `/assets/calendar/panchang-2026/${month.slug}-2026.jpg`;
  const days = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(YEAR, month.number - 1, day);
    const weekday = WEEKDAYS[date.getDay()];
    const gregorianDate = toDateString(date);
    const dayRecord = {
      id: `panchang-digital-${gregorianDate}`,
      gregorian_date: gregorianDate,
      date_display: formatDateDisplay(day, month.en, YEAR),
      date_display_hi: formatDateDisplay(day, month.hi, YEAR),
      year: YEAR,
      month_number: month.number,
      month_name: month.en,
      month_name_hi: month.hi,
      month_slug: month.slug,
      day_number: day,
      weekday: weekday.en,
      weekday_hi: weekday.hi,
      title: `${weekday.en}, ${formatDateDisplay(day, month.en, YEAR)}`,
      title_hi: `${weekday.hi}, ${formatDateDisplay(day, month.hi, YEAR)}`,
      event_type: "local_event",
      date_confidence: "needs_review",
      extraction_status: "pending_manual_extraction",
      review_status: "pending_review",
      source_name: SOURCE_NAME,
      source_url: SOURCE_URL,
      source_site: SOURCE_SITE,
      source_image: monthImage,
      source_pdf: PDF_URL,
      source_note: "Monthly scan reference. Exact observance details require manual extraction.",
      source_note_hi: "मासिक स्कैन संदर्भ। सटीक पालन विवरण के लिए मैन्युअल निकासी आवश्यक है।",
      permission_status: "needs_documented_confirmation",
      license_status: "source_provided",
      hosting_allowed: false,
      external_link_only: false,
      review_status_note: "pending_review",
      lunar_month: null,
      lunar_month_hi: null,
      paksha: "needs_review",
      paksha_hi: "समीक्षा आवश्यक",
      lunar_tithi: null,
      lunar_tithi_hi: null,
      nakshatra: null,
      nakshatra_hi: null,
      hora: null,
      hora_hi: null,
      muhurat: {
        sunrise: null,
        sunset: null,
        navkarsi: null,
        porshi: null,
        sadha_porshi: null,
        purimaddha: null,
        avaddha: null
      },
      chips: [
        { label: "Pending review", label_hi: "समीक्षा लंबित", type: "review" },
        { label: month.en, label_hi: month.hi, type: "month" }
      ],
      caution_note: "Exact dates and details need manual review against the scanned Panchang page.",
      caution_note_hi: "सटीक तिथियाँ और विवरण स्कैन किए गए पंचांग पृष्ठ से मैन्युअल रूप से जाँचे जाने चाहिए।",
      source_credit: `Source: ${SOURCE_NAME} / ${PUBLISHER}.`,
      source_action: "view-source"
    };

    days.push(dayRecord);
  }

  return {
    id: `panchang-digital-2026-${String(month.number).padStart(2, "0")}`,
    year: YEAR,
    month_number: month.number,
    month_name: month.en,
    month_name_hi: month.hi,
    month_slug: month.slug,
    title: `${month.en} 2026 Digital Panchang`,
    title_hi: `${month.hi} 2026 डिजिटल पंचांग`,
    image_url: `/assets/calendar/panchang-2026/${month.slug}-2026.jpg`,
    pdf_url: PDF_URL,
    source_name: SOURCE_NAME,
    source_url: SOURCE_URL,
    source_site: SOURCE_SITE,
    publisher: PUBLISHER,
    credit_text: `Source: ${SOURCE_NAME} / ${PUBLISHER}.`,
    attribution_text: `Source: ${SOURCE_NAME} / ${PUBLISHER}. Keep visible credits on all display views.`,
    permission_status: "needs_documented_confirmation",
    license_status: "source_provided",
    hosting_allowed: false,
    external_link_only: false,
    date_confidence: "source_provided",
    review_status: "pending_review",
    last_checked_at: "2026-06-02",
    notes: "Source-provided scan reference for manual extraction and review-first calendar work.",
    notes_hi: "मैन्युअल निकासी और समीक्षा-प्रथम कैलेंडर कार्य के लिए स्रोत-आधारित स्कैन संदर्भ।",
    caution_note: "Month image is a reference scan. Do not treat any date as final without review.",
    caution_note_hi: "मासिक छवि केवल संदर्भ स्कैन है। समीक्षा के बिना किसी तिथि को अंतिम न मानें।",
    source_note: "Use the monthly scan as a source reference for manual extraction.",
    source_note_hi: "मासिक स्कैन का उपयोग मैन्युअल निकासी के स्रोत संदर्भ के रूप में करें।",
    source_image: `/assets/calendar/panchang-2026/${month.slug}-2026.jpg`,
    source_pdf: PDF_URL,
    days
  };
}

function buildManualQueue(months) {
  const queue = months.map((month, index) => ({
    id: `extract-panchang-${YEAR}-${String(month.number).padStart(2, "0")}`,
    source_month: `${month.en} ${YEAR}`,
    source_image: `/assets/calendar/panchang-2026/${month.slug}-2026.jpg`,
    source_pdf: index === months.length - 1 ? PDF_URL : null,
    status: "pending_manual_extraction",
    priority: [3, 4, 8, 9, 10, 11].includes(month.number) ? "high" : "medium",
    target_events_to_extract: buildTargets(month.number),
    notes: "Do not OCR dense Panchang dates automatically. Use the scan only as a manual extraction source.",
    notes_hi: "घनी पंचांग तिथियों का स्वतः OCR न करें। स्कैन का उपयोग केवल मैन्युअल निकासी स्रोत के रूप में करें।",
    review_status: "pending_review"
  }));

  queue.push({
    id: "extract-panchang-back-page-2026",
    source_month: "Back Pages 2026",
    source_image: null,
    source_pdf: PDF_URL,
    status: "pending_manual_extraction",
    priority: "high",
    target_events_to_extract: ["important muhurat where appropriate", "monthly vrat", "annual observance notes", "supporting festival references"],
    notes: "Use back pages for reference context only. Do not auto-convert dense tables into verified dates.",
    notes_hi: "पीछे के पृष्ठों का उपयोग केवल संदर्भ के लिए करें। घनी तालिकाओं को स्वतः सत्यापित तिथियों में न बदलें।",
    review_status: "pending_review"
  });

  return queue;
}

function buildOcrQueue(months) {
  return months.map((month) => ({
    id: `ocr-panchang-${YEAR}-${String(month.number).padStart(2, "0")}`,
    source_month: `${month.en} ${YEAR}`,
    source_image: `/assets/calendar/panchang-2026/${month.slug}-2026.jpg`,
    source_pdf: month.number === 12 ? PDF_URL : null,
    ocr_status: "not_run",
    review_status: "pending_review",
    notes: "OCR review queue placeholder. Run the OCR assist tool only if a local engine is available.",
    notes_hi: "OCR समीक्षा कतार स्थानधारी। स्थानीय OCR इंजन उपलब्ध हो तभी OCR सहायता उपकरण चलाएँ।"
  }));
}

function buildTargets(monthNumber) {
  const common = ["monthly vrat", "Ekadashi", "Dwadashi", "Chaudas / Paksha"];
  if ([8, 9].includes(monthNumber)) {
    return ["Paryushan", "Samvatsari", "Das Lakshan", ...common];
  }
  if ([10, 11].includes(monthNumber)) {
    return ["Ayambil Oli", "Diwali / Mahavir Nirvan", "Kartik Purnima", ...common];
  }
  if ([3, 4].includes(monthNumber)) {
    return ["Mahavir Jayanti", "Akshaya Tritiya", "Ayambil Oli", ...common];
  }
  if ([1, 2].includes(monthNumber)) {
    return ["Mahavir Jayanti", "Rohini Vrat", "Maun Ekadashi", ...common];
  }
  return ["Rohini Vrat", "monthly vrat", "Ekadashi", "Dwadashi", "Chaudas / Paksha"];
}

function formatDateDisplay(day, monthName, year) {
  return `${day} ${monthName} ${year}`;
}

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function relativePath(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

main();
