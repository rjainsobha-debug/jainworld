const LANGUAGE_KEY = "lang";
const LEGACY_LANGUAGE_KEY = "jainworld-language";
const DEFAULT_LANGUAGE = "en";
const MOJIBAKE_PATTERN = /(?:\u00E0\u00A4|\u00E0\u00A5|\u00E2\u0080\u00A2|\u00C2\u00A9|\u00E2\u0080\u0094|\u00E2\u0080\u0093)/;

const TRANSLATIONS = {
  home: { en: "Home", hi: "होम" },
  learn: { en: "Learn", hi: "सीखें" },
  temples: { en: "Temples", hi: "मंदिर" },
  temple: { en: "Temple", hi: "मंदिर" },
  food: { en: "Food", hi: "भोजन" },
  calendar: { en: "Calendar", hi: "कैलेंडर" },
  resources: { en: "Resources", hi: "संसाधन" },
  directory: { en: "Directory", hi: "निर्देशिका" },
  ask: { en: "Ask", hi: "पूछें" },
  ask_jainworld: { en: "Ask JainWorld", hi: "जैनवर्ल्ड से पूछें" },
  search: { en: "Search", hi: "खोजें" },
  search_jainworld: { en: "Search JainWorld", hi: "जैनवर्ल्ड में खोजें" },
  start_learning: { en: "Start Learning", hi: "सीखना शुरू करें" },
  find_temples: { en: "Find Temples", hi: "मंदिर खोजें" },
  contact: { en: "Contact", hi: "संपर्क करें" },
  contribute: { en: "Contribute", hi: "योगदान दें" },
  privacy: { en: "Privacy", hi: "गोपनीयता" },
  terms: { en: "Terms", hi: "शर्तें" },
  article: { en: "Article", hi: "लेख" },
  audio: { en: "Audio", hi: "ऑडियो" },
  literature: { en: "Literature", hi: "साहित्य" },
  education: { en: "Education", hi: "शिक्षा" },
  course: { en: "Course", hi: "पाठ्यक्रम" },
  community: { en: "Community", hi: "समुदाय" },
  children: { en: "Children", hi: "बच्चे" },
  kids: { en: "Kids", hi: "बच्चे" },
  parents: { en: "Parents", hi: "माता-पिता" },
  teachers: { en: "Teachers", hi: "शिक्षक" },
  family: { en: "Family", hi: "परिवार" },
  source: { en: "Source", hi: "स्रोत" },
  sources: { en: "Sources", hi: "स्रोत" },
  sources_used: { en: "Sources used", hi: "उपयोग किए गए स्रोत" },
  verified: { en: "Verified", hi: "सत्यापित" },
  curated: { en: "Curated", hi: "चयनित" },
  reviewed: { en: "Reviewed", hi: "समीक्षित" },
  reviewed_by: { en: "Reviewed by", hi: "समीक्षा" },
  reviewed_by_editorial: { en: "Reviewed by JainWorld Editorial", hi: "जैनवर्ल्ड संपादकीय द्वारा समीक्षा की गई" },
  last_updated: { en: "Last updated", hi: "अंतिम अपडेट" },
  related_content: { en: "Related content", hi: "संबंधित सामग्री" },
  faq: { en: "FAQ", hi: "सामान्य प्रश्न" },
  no_results_found: { en: "No results found", hi: "कोई परिणाम नहीं मिला" },
  try_another_search: { en: "Try another search", hi: "दूसरी खोज करें" },
  popular_searches: { en: "Popular searches", hi: "लोकप्रिय खोजें" },
  suggested_questions: { en: "Suggested questions", hi: "सुझाए गए प्रश्न" },
  answer: { en: "Answer", hi: "उत्तर" },
  confidence: { en: "Confidence", hi: "भरोसा स्तर" },
  limited_source_coverage: { en: "Limited source coverage", hi: "सीमित स्रोत उपलब्धता" },
  source_based_answer: { en: "Source-based answer", hi: "स्रोत-आधारित उत्तर" },
  ai_assisted: { en: "AI-assisted from JainWorld sources", hi: "जैनवर्ल्ड स्रोतों से AI-सहायता प्राप्त उत्तर" },
  helpful: { en: "Helpful", hi: "उपयोगी" },
  not_helpful: { en: "Not helpful", hi: "उपयोगी नहीं" },
  needs_correction: { en: "Needs correction", hi: "सुधार चाहिए" },
  missing_source: { en: "Missing source", hi: "स्रोत उपलब्ध नहीं" },
  verify_important_details: { en: "Verify important details", hi: "महत्वपूर्ण जानकारी सत्यापित करें" },
  not_available_yet: { en: "Not available yet", hi: "अभी उपलब्ध नहीं" },
  report_correction: { en: "Report correction", hi: "सुधार भेजें" },
  suggest_improvement: { en: "Suggest improvement", hi: "सुधार सुझाएँ" },
  contribute_information: { en: "Contribute information", hi: "जानकारी जोड़ें" },
  read_more: { en: "Read more", hi: "और पढ़ें" },
  view_details: { en: "View details", hi: "विवरण देखें" },
  view_result: { en: "View result", hi: "परिणाम देखें" },
  explore: { en: "Explore", hi: "देखें" },
  beginner: { en: "Beginner", hi: "प्रारंभिक" },
  intermediate: { en: "Intermediate", hi: "मध्यम" },
  advanced: { en: "Advanced", hi: "उन्नत" },
  overview: { en: "Overview", hi: "परिचय" },
  guide: { en: "Guide", hi: "मार्गदर्शिका" },
  learning_path: { en: "Learning path", hi: "सीखने का मार्ग" },
  daily_practice: { en: "Daily practice", hi: "दैनिक अभ्यास" },
  scripture: { en: "Scripture", hi: "शास्त्र" },
  scriptures: { en: "Scriptures", hi: "शास्त्र" },
  story: { en: "Story", hi: "कथा" },
  stories: { en: "Stories", hi: "कथाएँ" },
  sutra: { en: "Sutra", hi: "सूत्र" },
  sutras: { en: "Sutras", hi: "सूत्र" },
  poems: { en: "Poems", hi: "कविताएँ" },
  bhajan: { en: "Bhajan", hi: "भजन" },
  bhajans: { en: "Bhajans", hi: "भजन" },
  aarti: { en: "Aarti", hi: "आरती" },
  aartis: { en: "Aartis", hi: "आरती" },
  stavan: { en: "Stavan", hi: "स्तवन" },
  pravachan: { en: "Pravachan", hi: "प्रवचन" },
  meditation: { en: "Meditation", hi: "ध्यान" },
  festival_special: { en: "Festival Special", hi: "पर्व विशेष" },
  kids_audio: { en: "Kids Audio", hi: "बच्चों का ऑडियो" },
  philosophy: { en: "Philosophy", hi: "दर्शन" },
  classical_text: { en: "Classical Text", hi: "पारंपरिक ग्रंथ" },
  devotional: { en: "Devotional", hi: "भक्ति" },
  jain_dharma: { en: "Jain Dharma", hi: "जैन धर्म" },
  jain_principles: { en: "Jain principles", hi: "जैन सिद्धांत" },
  jain_sects: { en: "Jain sects", hi: "जैन पंथ" },
  tirthankars: { en: "Tirthankars", hi: "तीर्थंकर" },
  monks_and_nuns: { en: "Monks and nuns", hi: "साधु-साध्वी" },
  pooja_and_worship: { en: "Pooja and worship", hi: "पूजा और आराधना" },
  samayik_and_pratikraman: { en: "Samayik and Pratikraman", hi: "सामायिक और प्रतिक्रमण" },
  jain_agams: { en: "Jain Agams", hi: "जैन आगम" },
  jain_history: { en: "Jain history", hi: "जैन इतिहास" },
  jain_periodicals: { en: "Jain periodicals", hi: "जैन पत्रिकाएँ" },
  jain_dictionary: { en: "Jain dictionary", hi: "जैन शब्दकोश" },
  jain_books: { en: "Jain books", hi: "जैन पुस्तकें" },
  childrens_books: { en: "Children's books", hi: "बच्चों की पुस्तकें" },
  jain_education_material: { en: "Jain education material", hi: "जैन शिक्षा सामग्री" },
  research_institutions: { en: "Research institutions", hi: "शोध संस्थान" },
  universities_and_foundations: { en: "Universities and foundations", hi: "विश्वविद्यालय और संस्थान" },
  scholarship_programs: { en: "Scholarship Programs", hi: "छात्रवृत्ति कार्यक्रम" },
  temple_directory: { en: "Temple directory", hi: "मंदिर निर्देशिका" },
  pilgrimage_guides: { en: "Pilgrimage guides", hi: "तीर्थ यात्रा मार्गदर्शिका" },
  devotional_audio_video: { en: "Devotional Audio and Video", hi: "भक्ति ऑडियो और वीडियो" },
  saint_scholar_lectures: { en: "Saint/scholar lectures", hi: "संत और विद्वानों के प्रवचन" },
  global_jain_events: { en: "Global Jain Events", hi: "वैश्विक जैन कार्यक्रम" },
  jain_sanghs: { en: "Jain sanghs", hi: "जैन संघ" },
  societies_and_centers: { en: "Societies and centers", hi: "संस्थाएँ और केंद्र" },
  jain_boys_and_girls_names: { en: "Jain boys and girls names", hi: "जैन लड़के और लड़कियों के नाम" },
  jain_recipes: { en: "Jain recipes", hi: "जैन रेसिपी" },
  government_minority_schemes: { en: "Government/minority schemes", hi: "सरकारी/अल्पसंख्यक योजनाएँ" },
  document_checklist: { en: "Document checklist", hi: "दस्तावेज़ सूची" },
  student_support: { en: "Student support", hi: "छात्र सहायता" },
  family_support: { en: "Family support", hi: "परिवार सहायता" },
  suggest_a_resource: { en: "Suggest a resource", hi: "संसाधन सुझाएँ" },
  names: { en: "Names", hi: "जैन नाम" },
  speakers: { en: "Speakers", hi: "वक्ता" },
  mega_directory: { en: "Mega Jain Directory", hi: "विस्तृत जैन निर्देशिका" },
  read_with_confidence: { en: "Read with confidence", hi: "श्रद्धा के साथ पढ़ें" },
  literature_intro: { en: "Scriptures, stories, sutras, poems, and devotional reading", hi: "शास्त्र, कथाएँ, सूत्र, कविताएँ और भक्ति पाठ" },
  literature_starting_point: { en: "Use these entries as a starting point for personal study, family learning, and deeper reflection.", hi: "व्यक्तिगत अध्ययन, पारिवारिक सीख और गहरे मनन के लिए इन पाठों से शुरुआत करें।" },
  agamas: { en: "Agamas", hi: "आगम" },
  tattvartha_sutra: { en: "Tattvartha Sutra", hi: "तत्त्वार्थ सूत्र" },
  samayasara: { en: "Samayasara", hi: "समयसार" },
  purana_stories: { en: "Purana stories", hi: "पुराण कथाएँ" },
  kids_stories: { en: "Kids stories", hi: "बच्चों की कथाएँ" },
  start_with_basics: { en: "Start with basics", hi: "मूल बातों से शुरू करें" },
  sacred_texts: { en: "Sacred texts", hi: "पवित्र ग्रंथ" },
  sutras_and_meanings: { en: "Sutras and meanings", hi: "सूत्र और अर्थ" },
  stories_and_values: { en: "Stories and values", hi: "कथाएँ और संस्कार" },
  for_children: { en: "For children", hi: "बच्चों के लिए" },
  advanced_study: { en: "Advanced study", hi: "उन्नत अध्ययन" },
  jain_calendar: { en: "Jain Calendar", hi: "जैन कैलेंडर" },
  festivals: { en: "Festivals", hi: "पर्व" },
  tithi: { en: "Tithi", hi: "तिथि" },
  fasting_days: { en: "Fasting Days", hi: "उपवास दिवस" },
  festival_learning: { en: "Festival Learning", hi: "पर्व ज्ञान" },
  today: { en: "Today", hi: "आज" },
  this_month: { en: "This Month", hi: "इस माह" },
  view_calendar: { en: "View Calendar", hi: "कैलेंडर देखें" },
  learn_more: { en: "Learn More", hi: "और जानें" },
  plan_your_day: { en: "Plan your day", hi: "दिन की योजना बनाएं" },
  temple_visit: { en: "Temple visit", hi: "मंदिर दर्शन" },
  prayer: { en: "Prayer", hi: "प्रार्थना" },
  fasting: { en: "Fasting", hi: "उपवास" },
  reflection: { en: "Reflection", hi: "मनन" },
  forgiveness: { en: "Forgiveness", hi: "क्षमा" },
  discipline: { en: "Discipline", hi: "अनुशासन" },
  paryushan: { en: "Paryushan", hi: "पर्युषण" },
  samvatsari: { en: "Samvatsari", hi: "संवत्सरी" },
  das_lakshan: { en: "Das Lakshan", hi: "दशलक्षण" },
  mahavir_jayanti: { en: "Mahavir Jayanti", hi: "महावीर जयंती" },
  ayambil_oli: { en: "Ayambil Oli", hi: "आयंबिल ओली" },
  kartik_purnima: { en: "Kartik Purnima", hi: "कार्तिक पूर्णिमा" },
  pilgrimage: { en: "Pilgrimage", hi: "तीर्थयात्रा" },
  tirth: { en: "Tirth", hi: "तीर्थ" },
  general: { en: "General", hi: "सामान्य" },
  shwetambar: { en: "Shwetambar", hi: "श्वेतांबर" },
  digambar: { en: "Digambar", hi: "दिगंबर" },
  diaspora_temple: { en: "Diaspora Temple", hi: "प्रवासी जैन मंदिर" },
  historic_temple: { en: "Historic Temple", hi: "ऐतिहासिक मंदिर" },
  tirthankar_nirvana_sites: { en: "Tirthankar nirvana sites", hi: "तीर्थंकर निर्वाण स्थल" },
  adinath_bhagwan: { en: "Adinath Bhagwan", hi: "आदिनाथ भगवान" },
  neminath_bhagwan: { en: "Neminath Bhagwan", hi: "नेमिनाथ भगवान" },
  shantinath_bhagwan: { en: "Shantinath Bhagwan", hi: "शांतिनाथ भगवान" },
  multiple_shrines: { en: "Multiple shrines", hi: "अनेक जिनालय" },
  multiple_temple_shrines: { en: "Multiple temple shrines", hi: "अनेक जिनालय" },
  community_temple: { en: "Community temple", hi: "सामुदायिक मंदिर" },
  bahubali: { en: "Bahubali", hi: "बाहुबली" },
  dharamshala: { en: "Dharamshala", hi: "धर्मशाला" },
  bhojanshala: { en: "Bhojanshala", hi: "भोजनशाला" },
  map: { en: "Map", hi: "मानचित्र" },
  address: { en: "Address", hi: "पता" },
  timings: { en: "Timings", hi: "समय" },
  contact_label: { en: "Contact", hi: "संपर्क" },
  website_label: { en: "Website", hi: "वेबसाइट" },
  parking: { en: "Parking", hi: "पार्किंग" },
  accessibility: { en: "Accessibility", hi: "सुविधा" },
  last_verified: { en: "Last verified", hi: "अंतिम सत्यापन" },
  before_you_visit: { en: "Before you visit", hi: "दर्शन से पहले" },
  respectful_visit_reminder: { en: "Respectful visit reminder", hi: "सम्मानपूर्वक दर्शन की याद" },
  best_time_to_visit: { en: "Best time to visit", hi: "दर्शन का उपयुक्त समय" },
  history: { en: "History", hi: "इतिहास" },
  rituals: { en: "Rituals", hi: "विधि और परंपरा" },
  city: { en: "City", hi: "शहर" },
  state: { en: "State", hi: "राज्य" },
  country: { en: "Country", hi: "देश" },
  verified_by: { en: "Verified by", hi: "सत्यापित द्वारा" },
  palitana: { en: "Palitana", hi: "पालिताना" },
  shikharji: { en: "Shikharji", hi: "शिखरजी" },
  ranakpur: { en: "Ranakpur", hi: "रणकपुर" },
  shankheshwar: { en: "Shankheshwar", hi: "शंखेश्वर" },
  hastinapur: { en: "Hastinapur", hi: "हस्तिनापुर" },
  ladnun: { en: "Ladnun", hi: "लाडनूं" },
  palitana_shatrunjaya: { en: "Palitana Shatrunjaya", hi: "पालिताना शत्रुंजय" },
  sammed_shikharji: { en: "Sammed Shikharji", hi: "सम्मेद शिखरजी" },
  girnar_jain_temples: { en: "Girnar Jain Temples", hi: "गिरनार जैन मंदिर" },
  ranakpur_jain_temple: { en: "Ranakpur Jain Temple", hi: "रणकपुर जैन मंदिर" },
  hastinapur_jain_temples: { en: "Hastinapur Jain Temples", hi: "हस्तिनापुर जैन मंदिर" },
  ladnun_jain_temple: { en: "Ladnun Jain Temple", hi: "लाडनूं जैन मंदिर" },
  dilwara_temples: { en: "Dilwara Temples", hi: "दिलवाड़ा मंदिर" },
  shravanabelagola: { en: "Shravanabelagola", hi: "श्रवणबेलगोला" },
  london_jain_temple: { en: "London Jain Temple", hi: "लंदन जैन मंदिर" },
  food_rules_explained: { en: "Food rules explained simply", hi: "भोजन नियम सरल भाषा में" },
  food_values_heading: { en: "The values behind Jain food discipline", hi: "जैन भोजन अनुशासन के मूल्य" },
  ahimsa_in_food: { en: "Ahimsa in food", hi: "भोजन में अहिंसा" },
  avoiding_root_vegetables: { en: "Avoiding root vegetables", hi: "कंद-मूल से परहेज" },
  eating_before_sunset: { en: "Eating before sunset", hi: "सूर्यास्त से पहले भोजन" },
  fasting_self_control: { en: "Fasting and self-control", hi: "उपवास और आत्मसंयम" },
  travel_food_guidance: { en: "Travel food guidance", hi: "यात्रा में भोजन मार्गदर्शन" },
  festival_food_guidance: { en: "Festival food guidance", hi: "पर्व भोजन मार्गदर्शन" },
  what_not_to_eat: { en: "What not to eat", hi: "क्या न खाएँ" },
  daily_discipline: { en: "Daily discipline", hi: "दैनिक अनुशासन" },
  daily_diet: { en: "Daily diet", hi: "दैनिक आहार" },
  practical: { en: "Practical", hi: "व्यवहारिक" },
  alternative: { en: "Alternative", hi: "विकल्प" },
  spiritual: { en: "Spiritual", hi: "आध्यात्मिक" },
  travel_guidance: { en: "Travel guidance", hi: "यात्रा मार्गदर्शन" },
  fasting_and_festivals: { en: "Fasting and festivals", hi: "उपवास और पर्व" },
  useful_guides: { en: "Useful guides", hi: "उपयोगी मार्गदर्शिकाएँ" },
  helpful_food_entries: { en: "Helpful food and lifestyle entries", hi: "उपयोगी भोजन और जीवनशैली प्रविष्टियाँ" },
  plan_ahead_food: { en: "Plan ahead with simple Jain food choices", hi: "सरल जैन भोजन विकल्पों के साथ पहले से योजना बनाएं" },
  stay_gentle_food: { en: "Stay gentle with festival food decisions", hi: "पर्व भोजन निर्णयों में संयम रखें" },
  why_jains_avoid_root_vegetables: { en: "Why Jains avoid root vegetables", hi: "जैन कंद-मूल से परहेज क्यों करते हैं" },
  why_jains_avoid_honey: { en: "Why Jains avoid honey", hi: "जैन शहद से परहेज क्यों करते हैं" },
  boiled_water_in_jain_tradition: { en: "Boiled water in Jain tradition", hi: "जैन परंपरा में उबला पानी" },
  jain_breakfast_ideas: { en: "Jain breakfast ideas", hi: "जैन नाश्ते के विचार" },
  jain_fasting_recipes: { en: "Jain fasting recipes", hi: "जैन उपवास व्यंजन" },
  jain_travel_food_guide: { en: "Jain travel food guide", hi: "जैन यात्रा भोजन मार्गदर्शिका" },
  no_onion_no_garlic_daily_thali: { en: "No onion no garlic daily thali", hi: "बिना प्याज-लहसुन की दैनिक थाली" },
  why_jains_avoid_food_after_sunset: { en: "Why Jains avoid food after sunset", hi: "जैन सूर्यास्त के बाद भोजन से परहेज क्यों करते हैं" },
  jain_kids_tiffin_ideas: { en: "Jain kids tiffin ideas", hi: "जैन बच्चों के टिफिन के विचार" },
  jain_restaurant_ordering_guide: { en: "Jain restaurant ordering guide", hi: "जैन रेस्तरां ऑर्डर मार्गदर्शिका" },
  travel_food: { en: "Travel food", hi: "यात्रा भोजन" },
  kids_food: { en: "Kids food", hi: "बच्चों का भोजन" },
  dining_out: { en: "Dining out", hi: "बाहर भोजन" },
  avoided: { en: "Avoided", hi: "परहेज" },
  allowed: { en: "Allowed", hi: "अनुमेय" },
  allowed_with_care: { en: "Allowed with care", hi: "सावधानी के साथ अनुमेय" },
  recipe_guide: { en: "Recipe Guide", hi: "व्यंजन मार्गदर्शिका" },
  duration: { en: "Duration", hi: "अवधि" },
  language: { en: "Language", hi: "भाषा" },
  singer: { en: "Singer", hi: "गायक" },
  speaker: { en: "Speaker", hi: "प्रवचनकर्ता" },
  permission_status: { en: "Permission status", hi: "अनुमति स्थिति" },
  meaning: { en: "Meaning", hi: "अर्थ" },
  related_audio: { en: "Related audio", hi: "संबंधित ऑडियो" },
  source_details_reviewed: { en: "Source details are being reviewed", hi: "स्रोत विवरण की समीक्षा जारी है" },
  source_details_are_being_reviewed: { en: "Source details are being reviewed.", hi: "स्रोत विवरण की समीक्षा जारी है।" },
  open_external_source: { en: "Open external source", hi: "बाहरी स्रोत खोलें" },
  official_link_external: { en: "Official link (external)", hi: "आधिकारिक लिंक (बाहरी)" },
  official_link_pending: { en: "Official link will be added after verification.", hi: "सत्यापन के बाद आधिकारिक लिंक जोड़ा जाएगा।" },
  suggest_correction: { en: "Suggest correction", hi: "सुधार सुझाएँ" },
  read_with_care: { en: "Read with care", hi: "अध्ययन करते समय ध्यान रखें" },
  ask_topic_cta: { en: "Have a question about this topic? Ask JainWorld.", hi: "क्या इस विषय पर आपका कोई प्रश्न है? जैनवर्ल्ड से पूछें।" },
  no_article_found: { en: "The requested article could not be found.", hi: "मांगा गया लेख नहीं मिला।" },
  no_audio_found: { en: "The requested audio entry could not be found.", hi: "मांगी गई ऑडियो प्रविष्टि नहीं मिली।" },
  no_temple_found: { en: "The requested temple could not be found.", hi: "मांगा गया मंदिर नहीं मिला।" },
  no_course_found: { en: "The requested lesson could not be found.", hi: "मांगा गया पाठ नहीं मिला।" },
  search_suggestion: { en: "Try JainWorld Search or open the related section below.", hi: "जैनवर्ल्ड खोज आज़माएँ या नीचे संबंधित अनुभाग खोलें।" },
  lesson: { en: "Lesson", hi: "पाठ" },
  family_learning_note: { en: "Learn with family", hi: "परिवार के साथ सीखें" },
  eligibility: { en: "Eligibility", hi: "पात्रता" },
  published: { en: "Published", hi: "प्रकाशित" },
  author: { en: "Author", hi: "लेखक" },
  external_source: { en: "External source", hi: "बाहरी स्रोत" },
  curated_by_jainworld: { en: "Curated by JainWorld", hi: "जैनवर्ल्ड द्वारा चयनित" },
  permission_received: { en: "Permission received", hi: "अनुमति प्राप्त" },
  public_domain: { en: "Public domain", hi: "सार्वजनिक डोमेन" },
  embedded: { en: "Embedded", hi: "एम्बेडेड" },
  pending_review: { en: "Pending review", hi: "समीक्षा लंबित" },
  rejected: { en: "Rejected", hi: "अस्वीकृत" },
  needs_update: { en: "Needs update", hi: "अद्यतन आवश्यक" },
  available: { en: "Available", hi: "उपलब्ध" },
  not_listed: { en: "Not listed", hi: "सूचीबद्ध नहीं" },
  not_available: { en: "Not available", hi: "उपलब्ध नहीं" },
  please_verify_locally: { en: "Please verify locally", hi: "कृपया स्थानीय रूप से पुष्टि करें" },
  ingredients: { en: "Ingredients", hi: "सामग्री" },
  method: { en: "Method", hi: "विधि" },
  spiritual_reason: { en: "Spiritual reason", hi: "आध्यात्मिक कारण" },
  scientific_reason: { en: "Scientific or practical reason", hi: "वैज्ञानिक या व्यवहारिक कारण" },
  transcript: { en: "Transcript", hi: "लिप्यंतरण" },
  lesson_prompts: { en: "Lesson prompts", hi: "पाठ संकेत" },
  history: { en: "History", hi: "इतिहास" },
  rituals: { en: "Rituals", hi: "विधि और परंपरा" }
};

Object.assign(TRANSLATIONS, {
  jain_calendar_and_festivals: { en: "Jain Calendar and Festivals", hi: "जैन कैलेंडर और पर्व" },
  dates_may_vary: { en: "Dates may vary", hi: "तिथियाँ भिन्न हो सकती हैं" },
  verify_with_local_sangh: { en: "Verify with local sangh", hi: "स्थानीय संघ से सत्यापित करें" },
  tithi_vrat: { en: "Tithi / Vrat", hi: "तिथि / व्रत" },
  ayambil: { en: "Ayambil", hi: "आयंबिल" },
  needs_review: { en: "Needs Review", hi: "समीक्षा आवश्यक" },
  educational_overview: { en: "Educational overview", hi: "शैक्षणिक जानकारी" },
  date_confidence: { en: "Date confidence", hi: "तिथि भरोसा स्तर" },
  source_provided: { en: "Source provided", hi: "स्रोत-आधारित" },
  verified_date: { en: "Verified date", hi: "सत्यापित तिथि" },
  local_verification_required: { en: "Local verification required", hi: "स्थानीय सत्यापन आवश्यक" },
  report_calendar_correction: { en: "Report calendar correction", hi: "कैलेंडर सुधार भेजें" },
  tradition_scope: { en: "Tradition scope", hi: "परंपरा क्षेत्र" },
  location_scope: { en: "Location scope", hi: "स्थान क्षेत्र" },
  lunar_month: { en: "Lunar month", hi: "चंद्र मास" },
  lunar_tithi: { en: "Lunar tithi", hi: "चंद्र तिथि" },
  all: { en: "All", hi: "सभी" },
  festival: { en: "Festival", hi: "पर्व" },
  vrat: { en: "Vrat", hi: "व्रत" },
  event: { en: "Event", hi: "कार्यक्रम" },
  learning: { en: "Learning", hi: "शैक्षणिक जानकारी" }
});

Object.assign(TRANSLATIONS, {
  books: { en: "Books", hi: "पुस्तकें" },
  book: { en: "Book", hi: "पुस्तक" },
  author: { en: "Author", hi: "लेखक" },
  publisher: { en: "Publisher", hi: "प्रकाशक" },
  source: { en: "Source", hi: "स्रोत" },
  license: { en: "License", hi: "लाइसेंस" },
  credit: { en: "Credit", hi: "श्रेय" },
  attribution: { en: "Attribution", hi: "श्रेय विवरण" },
  open_source: { en: "Open source", hi: "स्रोत खोलें" },
  external_link_only: { en: "External link only", hi: "केवल बाहरी लिंक" },
  permission_review_needed: { en: "Permission review needed", hi: "अनुमति समीक्षा आवश्यक" },
  hosting_not_allowed: { en: "Hosting not allowed", hi: "होस्टिंग की अनुमति नहीं" },
  public_domain: { en: "Public domain", hi: "सार्वजनिक डोमेन" },
  creative_commons: { en: "Creative Commons", hi: "क्रिएटिव कॉमन्स" },
  permission_received: { en: "Permission received", hi: "अनुमति प्राप्त" },
  metadata_only: { en: "Metadata only", hi: "केवल जानकारी" },
  report_copyright_concern: { en: "Report copyright concern", hi: "कॉपीराइट समस्या बताएं" },
  suggest_book_resource: { en: "Suggest book/resource", hi: "पुस्तक/संसाधन सुझाएँ" }
});

Object.assign(TRANSLATIONS, {
  jain_calendar_and_panchang: { en: "Jain Calendar and Panchang", hi: "जैन कैलेंडर और पंचांग" },
  festivals: { en: "Festivals", hi: "पर्व" },
  tithi_vrat: { en: "Tithi / Vrat", hi: "तिथि / व्रत" },
  ayambil: { en: "Ayambil", hi: "आयंबिल" },
  ekadashi: { en: "Ekadashi", hi: "एकादशी" },
  dwadashi: { en: "Dwadashi", hi: "द्वादशी" },
  chaudas: { en: "Chaudas", hi: "चौदस" },
  month_view: { en: "Month view", hi: "मासिक दृश्य" },
  list_view: { en: "List view", hi: "सूची दृश्य" },
  date_needs_review: { en: "Date needs review", hi: "तिथि समीक्षा आवश्यक" },
  verified_date: { en: "Verified date", hi: "सत्यापित तिथि" },
  source_provided: { en: "Source provided", hi: "स्रोत आधारित" },
  educational_overview: { en: "Educational overview", hi: "शैक्षणिक जानकारी" },
  local_verification_required: { en: "Local verification required", hi: "स्थानीय सत्यापन आवश्यक" },
  dates_may_vary: { en: "Dates may vary", hi: "तिथियाँ भिन्न हो सकती हैं" },
  verify_with_local_sangh: { en: "Verify with local sangh", hi: "स्थानीय संघ से सत्यापित करें" },
  report_calendar_correction: { en: "Report calendar correction", hi: "कैलेंडर सुधार भेजें" },
  year: { en: "Year", hi: "वर्ष" },
  month: { en: "Month", hi: "माह" },
  all: { en: "All", hi: "सभी" },
  today: { en: "Today", hi: "आज" },
  no_calendar_records_found: { en: "No calendar records found", hi: "कोई कैलेंडर रिकॉर्ड नहीं मिला" },
  tradition_scope: { en: "Tradition scope", hi: "परंपरा क्षेत्र" },
  location_scope: { en: "Location scope", hi: "स्थान क्षेत्र" },
  lunar_month: { en: "Lunar month", hi: "चंद्र मास" },
  lunar_tithi: { en: "Lunar tithi", hi: "चंद्र तिथि" },
  general: { en: "General", hi: "सामान्य" },
  local_event: { en: "Local event", hi: "स्थानीय कार्यक्रम" },
  learning: { en: "Learning", hi: "शैक्षणिक जानकारी" },
  krishna: { en: "Krishna", hi: "कृष्ण" },
  shukla: { en: "Shukla", hi: "शुक्ल" },
  sud: { en: "Sud", hi: "सुद" },
  vad: { en: "Vad", hi: "वद" }
});

Object.assign(TRANSLATIONS, {
  beginner_path: { en: "Beginner Path", hi: "प्रारंभिक मार्ग" },
  intermediate_path: { en: "Intermediate Path", hi: "मध्यम मार्ग" },
  advanced_path: { en: "Advanced Path", hi: "उन्नत मार्ग" },
  start_here: { en: "Start here", hi: "यहाँ से शुरू करें" },
  foundations: { en: "Foundations", hi: "मूल बातें" },
  values: { en: "Values", hi: "मूल्य" },
  practice: { en: "Practice", hi: "अभ्यास" },
  daily_practice: { en: "Daily Practice", hi: "दैनिक अभ्यास" },
  childrens_learning: { en: "Children's Learning", hi: "बच्चों की शिक्षा" },
  family_learning: { en: "Family Learning", hi: "पारिवारिक शिक्षा" },
  thought: { en: "Thought", hi: "विचार" },
  word: { en: "Word", hi: "वचन" },
  action: { en: "Action", hi: "कर्म" },
  read: { en: "Read", hi: "पढ़ें" },
  reflect: { en: "Reflect", hi: "मनन करें" },
  practice_today: { en: "Practice Today", hi: "आज अभ्यास करें" }
});

Object.assign(TRANSLATIONS, {
  online_jain_pathshala: { en: "Online Jain Pathshala", hi: "ऑनलाइन जैन पाठशाला" },
  amar_granthalaya: { en: "Amar Granthalaya", hi: "अमर ग्रंथालय" },
  source_archive: { en: "Source Archive", hi: "स्रोत संग्रह" },
  source_credit: { en: "Source Credit", hi: "स्रोत श्रेय" },
  open_original_source: { en: "Open Original Source", hi: "मूल स्रोत खोलें" },
  permission_pending: { en: "Permission pending", hi: "अनुमति लंबित" },
  permission_documented: { en: "Permission documented", hi: "अनुमति दर्ज" },
  manual_review_required: { en: "Manual review required", hi: "मैन्युअल समीक्षा आवश्यक" },
  panchang_archive: { en: "Panchang Archive", hi: "पंचांग संग्रह" },
  jain_panchang_source_archive: { en: "Jain Panchang Source Archive", hi: "जैन पंचांग स्रोत संग्रह" },
  view_panchang_page: { en: "View Panchang Page", hi: "पंचांग पृष्ठ देखें" },
  open_full_image: { en: "Open full image", hi: "पूरी छवि खोलें" },
  open_panchang_back_pages: { en: "Open Panchang Back Pages", hi: "पंचांग के पीछे के पृष्ठ खोलें" },
  manual_extraction_pending: { en: "Manual extraction pending", hi: "मैन्युअल तिथि निकासी लंबित" },
  source_provided_reference: { en: "Source-provided reference", hi: "स्रोत-आधारित संदर्भ" },
  do_not_publish_without_review: { en: "Do not publish without review", hi: "समीक्षा के बिना प्रकाशित न करें" },
  report_source_concern: { en: "Report source concern", hi: "स्रोत संबंधी समस्या बताएं" },
  previous: { en: "Previous", hi: "पिछला" },
  next: { en: "Next", hi: "अगला" }
});

function normalizeLabelKey(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[.,:;!?()[\]{}"']/g, "")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ");
}

const LABEL_KEY_MAP = Object.fromEntries(
  Object.entries(TRANSLATIONS).flatMap(([key, value]) => {
    const values = [value.en, value.hi].filter(Boolean);
    return values.map((entry) => [normalizeLabelKey(entry), key]);
  })
);

function isUsableLocalizedText(value) {
  return typeof value === "string" && value.trim() && !MOJIBAKE_PATTERN.test(value);
}

function getSafeLocalizedValue(value, fallback = "", lang = getLanguage()) {
  if (isUsableLocalizedText(value)) {
    return value.trim();
  }

  if (lang === "hi" && typeof fallback === "string" && fallback.trim()) {
    return translateLabel(fallback, fallback).trim();
  }

  if (typeof fallback === "string" && fallback.trim()) {
    return fallback.trim();
  }

  return "";
}

export function getLanguage() {
  const saved = window.localStorage.getItem(LANGUAGE_KEY) || window.localStorage.getItem(LEGACY_LANGUAGE_KEY);
  return saved === "hi" ? "hi" : DEFAULT_LANGUAGE;
}

export function currentLanguage() {
  return getLanguage();
}

export function translate(key, fallback = "") {
  const entry = TRANSLATIONS[key];
  if (!entry) {
    return fallback || key;
  }

  const lang = getLanguage();
  return entry[lang] || entry.en || fallback || key;
}

export function translateLabel(label, fallback = "") {
  const normalized = normalizeLabelKey(label);
  const key = LABEL_KEY_MAP[normalized];
  if (!key) {
    return fallback || label || "";
  }
  return translate(key, fallback || label);
}

export function pickLocalized(item, base, lang = getLanguage()) {
  if (!item || !base) {
    return "";
  }

  const keys = [
    `${base}_${lang}`,
    `${base}${lang === "hi" ? "Hi" : "En"}`,
    base,
    `${base}_${lang === "hi" ? "en" : "hi"}`,
    `${base}${lang === "hi" ? "En" : "Hi"}`
  ];

  for (const key of keys) {
    const value = item[key];
    if (isUsableLocalizedText(value)) {
      return value.trim();
    }
  }

  if (lang === "hi") {
    const fallback = item[`${base}_en`] || item[`${base}En`] || item[base];
    return translateLabel(fallback, fallback);
  }

  return item[`${base}_en`] || item[`${base}En`] || item[base] || "";
}

function syncLanguageButtons() {
  const activeLanguage = getLanguage();
  document.querySelectorAll("[data-lang-toggle] button[data-lang]").forEach((button) => {
    const isActive = button.dataset.lang === activeLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

export function updateLanguageDOM(lang = getLanguage()) {
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-hi][data-en]").forEach((node) => {
    const nextText = getSafeLocalizedValue(node.dataset[lang], node.dataset.en, lang);
    if (nextText) {
      node.textContent = nextText;
    }
  });

  document.querySelectorAll("[data-placeholder-hi][data-placeholder-en]").forEach((node) => {
    const nextPlaceholder = getSafeLocalizedValue(
      node.dataset[`placeholder${lang === "hi" ? "Hi" : "En"}`],
      node.dataset.placeholderEn,
      lang
    );
    if (nextPlaceholder) {
      node.setAttribute("placeholder", nextPlaceholder);
    }
  });

  document.querySelectorAll("[data-title-hi][data-title-en]").forEach((node) => {
    const nextTitle = getSafeLocalizedValue(
      node.dataset[`title${lang === "hi" ? "Hi" : "En"}`],
      node.dataset.titleEn,
      lang
    );
    if (nextTitle) {
      node.setAttribute("title", nextTitle);
    }
  });

  document.querySelectorAll("[data-value-hi][data-value-en]").forEach((node) => {
    const nextValue = getSafeLocalizedValue(
      node.dataset[`value${lang === "hi" ? "Hi" : "En"}`],
      node.dataset.valueEn,
      lang
    );
    if (nextValue) {
      node.setAttribute("value", nextValue);
    }
  });

  syncLanguageButtons();
}

export function setLanguage(lang) {
  const nextLanguage = lang === "hi" ? "hi" : DEFAULT_LANGUAGE;
  window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
  window.localStorage.setItem(LEGACY_LANGUAGE_KEY, nextLanguage);
  document.documentElement.lang = nextLanguage;
  updateLanguageDOM(nextLanguage);
  window.dispatchEvent(new CustomEvent("jainworld:language-change", { detail: { lang: nextLanguage } }));
}

export function initLanguageToggle() {
  document.querySelectorAll("[data-lang-toggle]").forEach((group) => {
    if (group.dataset.bound === "true") {
      syncLanguageButtons();
      return;
    }

    group.dataset.bound = "true";
    group.querySelectorAll("button[data-lang]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });
  });

  syncLanguageButtons();
}

window.JainWorldLanguage = {
  apply: () => updateLanguageDOM(getLanguage()),
  current: () => getLanguage(),
  get: () => getLanguage(),
  set: (lang) => setLanguage(lang),
  translateLabel: (label, fallback = "") => translateLabel(label, fallback)
};
