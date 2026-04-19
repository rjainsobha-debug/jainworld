/**
 * data.js — JainWorld Static Data
 * Tirthankaras, philosophy cards, culture data
 * jainworld.in
 */

/* ── 24 Tirthankaras ───────────────────────────────────────── */
const TIRTHANKARAS = [
  { n:1,  name:"Rishabhanatha", aka:"Adinatha",     symbol:"🐂", city:"Ayodhya",        color:"#8b6914", page:"tirthankara-rishabha" },
  { n:2,  name:"Ajitanatha",    aka:"",             symbol:"🐘", city:"Ayodhya",        color:"#6b5b95", page:"tirthankara-detail" },
  { n:3,  name:"Sambhavanatha", aka:"",             symbol:"🐴", city:"Shravasti",      color:"#4a7c59", page:"tirthankara-detail" },
  { n:4,  name:"Abhinandananatha", aka:"",          symbol:"🐒", city:"Ayodhya",        color:"#7b3f00", page:"tirthankara-detail" },
  { n:5,  name:"Sumatinatha",   aka:"",             symbol:"🐦", city:"Ayodhya",        color:"#1a5276", page:"tirthankara-detail" },
  { n:6,  name:"Padmaprabha",   aka:"",             symbol:"🪷", city:"Kaushambi",      color:"#c0392b", page:"tirthankara-detail" },
  { n:7,  name:"Suparshvanatha",aka:"",             symbol:"🌀", city:"Varanasi",       color:"#16a085", page:"tirthankara-detail" },
  { n:8,  name:"Chandraprabha", aka:"",             symbol:"🌙", city:"Chandrapuri",    color:"#5d6d7e", page:"tirthankara-detail" },
  { n:9,  name:"Pushpadanta",   aka:"Suvidhinatha", symbol:"🐊", city:"Kakandi",        color:"#2e7d32", page:"tirthankara-detail" },
  { n:10, name:"Shitalanatha",  aka:"",             symbol:"✨", city:"Bhadrikapuri",   color:"#0277bd", page:"tirthankara-detail" },
  { n:11, name:"Shreyamsanatha",aka:"",             symbol:"🦏", city:"Sinhapuri",      color:"#6a1a9a", page:"tirthankara-detail" },
  { n:12, name:"Vasupujya",     aka:"",             symbol:"🐃", city:"Champapuri",     color:"#8b4513", page:"tirthankara-detail" },
  { n:13, name:"Vimalanatha",   aka:"",             symbol:"🐗", city:"Kampilya",       color:"#37474f", page:"tirthankara-detail" },
  { n:14, name:"Anantanatha",   aka:"",             symbol:"🐻", city:"Ayodhya",        color:"#4e342e", page:"tirthankara-detail" },
  { n:15, name:"Dharmanatha",   aka:"",             symbol:"⚡", city:"Ratnapuri",      color:"#ef6c00", page:"tirthankara-detail" },
  { n:16, name:"Shantinatha",   aka:"",             symbol:"🦌", city:"Hastinapur",     color:"#00695c", page:"tirthankara-detail" },
  { n:17, name:"Kunthunatha",   aka:"",             symbol:"🐐", city:"Hastinapur",     color:"#5d4e75", page:"tirthankara-detail" },
  { n:18, name:"Arahanatha",    aka:"",             symbol:"🐟", city:"Hastinapur",     color:"#1565c0", page:"tirthankara-detail" },
  { n:19, name:"Mallinatha",    aka:"",             symbol:"🏺", city:"Mithila",        color:"#c62828", page:"tirthankara-detail" },
  { n:20, name:"Munisuvrata",   aka:"",             symbol:"🐢", city:"Rajagriha",      color:"#2e7d32", page:"tirthankara-detail" },
  { n:21, name:"Naminatha",     aka:"",             symbol:"🪷", city:"Mithila",        color:"#6a1a9a", page:"tirthankara-detail" },
  { n:22, name:"Neminatha",     aka:"Arishtanemi",  symbol:"🐚", city:"Shauripur",      color:"#00838f", page:"tirthankara-detail" },
  { n:23, name:"Parshvanatha",  aka:"",             symbol:"🐍", city:"Varanasi",       color:"#2d6a4f", page:"tirthankara-detail" },
  { n:24, name:"Mahavira",      aka:"Vardhamana",   symbol:"🦁", city:"Vaishali",       color:"#8b4513", page:"tirthankara-mahavir" },
];

/* ── Philosophy Cards ──────────────────────────────────────── */
const PHILOSOPHY_CARDS = [
  { icon:"☮️", title:"Ahimsa", sanskrit:"अहिंसा — Non-violence", litId:"ahimsa-philosophy",
    desc:"The supreme principle of Jainism. Non-violence in thought, word, and action towards all living beings. The root of all virtues and the path to liberation." },
  { icon:"🔮", title:"Anekantavada", sanskrit:"अनेकान्तवाद — Many-sidedness of Truth", litId:"anekantavada",
    desc:"Reality is complex and cannot be captured by any single perspective. Expressed through Syadvada and Nayavada — Jainism's great contribution to world philosophy." },
  { icon:"⚖️", title:"Karma", sanskrit:"कर्म — Action and Consequence",
    desc:"In Jain philosophy, karma is a physical substance — fine particles of matter — that attach to the soul based on actions. All karma must be shed to achieve liberation." },
  { icon:"✨", title:"Moksha", sanskrit:"मोक्ष — Liberation",
    desc:"The ultimate goal — complete liberation from the cycle of birth and death. A liberated soul (Siddha) dwells at the apex of the universe in perfect knowledge, bliss, and power." },
  { icon:"🌱", title:"Aparigraha", sanskrit:"अपरिग्रह — Non-possessiveness",
    desc:"Limiting possessions and desires. For monks: total non-possessiveness. For laypeople: defined limits on material accumulation. Root of Jain business ethics." },
  { icon:"👁️", title:"Three Ratnas", sanskrit:"त्रिरत्न — Three Jewels",
    desc:"The three foundations of liberation: Samyak Darshana (Right Faith), Samyak Jnana (Right Knowledge), and Samyak Charitra (Right Conduct)." },
  { icon:"🌊", title:"Samsara", sanskrit:"संसार — Cycle of Existence",
    desc:"The soul's endless cycle of birth, death, and rebirth. Jainism identifies 8.4 million species in which the soul can be reborn. Liberation is the permanent escape." },
  { icon:"🧘", title:"Jiva & Ajiva", sanskrit:"जीव–अजीव — Soul and Non-Soul",
    desc:"Jain metaphysics divides reality into Jiva (conscious souls) and Ajiva (non-conscious matter, space, time). Their interaction generates karma and binds the soul." },
];

/* ── Culture Events ────────────────────────────────────────── */
const CULTURE_ITEMS = [
  { icon:"🪔", title:"Paryushan Mahaparva",
    desc:"The most sacred Jain festival, lasting 8 days (Shvetambara) or 10 days (Digambara, called Das Lakshana). A time of fasting, prayer, confession, forgiveness, and spiritual renewal. Ends with Samvatsari." },
  { icon:"🎉", title:"Mahavir Jayanti",
    desc:"The birth anniversary of Lord Mahavira, celebrated on Chaitra Shukla 13 (March–April). A national holiday in India, marked by processions, temple worship, and charity." },
  { icon:"🌙", title:"Diwali — Liberation of Mahavira",
    desc:"Jains observe Diwali as the night Lord Mahavira attained Nirvana (527 BCE). The lamps symbolize the light of knowledge extinguished as the Great Soul was liberated." },
  { icon:"🙏", title:"Samvatsari — Universal Forgiveness",
    desc:"The holiest day of the Jain year. Jains seek forgiveness from all beings for any harm caused in the past year. The sacred greeting: 'Michhami Dukkadam.'" },
  { icon:"🥗", title:"Jain Diet (Jain Ahara)",
    desc:"Strict vegetarianism beyond veganism — avoiding root vegetables (potatoes, onions, garlic), eating before sunset, avoiding fermented foods. Based on minimizing harm to all living beings." },
  { icon:"🏔️", title:"Jain Pilgrimage (Teertha)",
    desc:"Key pilgrimage sites: Palitana (Gujarat), Shikharji (Jharkhand), Shravanabelagola (Karnataka), Pawapuri (Bihar), Mount Abu (Rajasthan)." },
];

/* ── Sample Community Members (fallback) ──────────────────── */
const SAMPLE_MEMBERS = [
  { name:"Rajesh Mehta",    role:"Diamond Merchant",         city:"Surat, Gujarat",          badge:"Verified Business", color:"#8b4513" },
  { name:"Sunita Shah",     role:"Chartered Accountant",     city:"Mumbai, Maharashtra",     badge:"Professional",       color:"#2d6a4f" },
  { name:"Amit Kothari",    role:"Textile Exporter",         city:"Jaipur, Rajasthan",       badge:"Verified Business", color:"#5d4e75" },
  { name:"Priya Jain",      role:"Startup Founder",          city:"Bangalore, Karnataka",    badge:"Entrepreneur",       color:"#2c7873" },
  { name:"Dinesh Oswal",    role:"Pharmaceutical CEO",       city:"Ahmedabad, Gujarat",      badge:"Premium",            color:"#8b6914" },
  { name:"Neha Sanghvi",    role:"Corporate Lawyer",         city:"London, UK",              badge:"Diaspora",           color:"#1a5276" },
  { name:"Vikram Sheth",    role:"Software Engineer",        city:"San Francisco, USA",      badge:"Tech",               color:"#6c3483" },
  { name:"Kavita Doshi",    role:"Ayurveda Practitioner",    city:"Pune, Maharashtra",       badge:"Healthcare",         color:"#117a65" },
];

/* ── Sample Jobs (fallback) ────────────────────────────────── */
const SAMPLE_JOBS = [
  { title:"Senior Diamond Grader — GIA Certified Preferred", company:"Sheth Diamonds Pvt Ltd", location:"Surat, Gujarat", salary:"₹8–12 LPA", type:"Full-Time", posted:"2 days ago", desc:"3rd generation Jain diamond trading house looking for experienced grader. GIA certification + 3 years experience required." },
  { title:"CFO / Finance Head — Jain-owned Textile Group", company:"Oswal Fabrics Group", location:"Ludhiana, Punjab", salary:"₹25–40 LPA", type:"Full-Time", posted:"1 week ago", desc:"Large Jain-owned textile conglomerate seeks an experienced CFO. CA required with manufacturing sector experience." },
  { title:"Marketing Manager — Jain Vegetarian Food Brand", company:"Shuddh Foods", location:"Mumbai / Remote", salary:"₹12–18 LPA", type:"Full-Time", posted:"3 days ago", desc:"Fast-growing Jain food startup seeks creative marketing manager with D2C experience. Passion for Jain values a plus." },
];

/* ── Sample Businesses ─────────────────────────────────────── */
const SAMPLE_BUSINESSES = [
  { cat:"Diamonds & Jewellery", name:"Kothari Diamond House",  loc:"Opera House, Mumbai · Est. 1962", desc:"3rd generation Jain diamond trading house. Polished diamonds, loose stones, and custom jewellery.", phone:"+91 22 XXXX XXXX" },
  { cat:"Textiles & Fabric",    name:"Sanghvi Mills Pvt Ltd",  loc:"Ring Road, Surat · Est. 1985",   desc:"Manufacturers and exporters of premium polyester and silk fabrics. ISO certified Jain family business.",phone:"+91 261 XXXX XXXX" },
  { cat:"Pharmaceuticals",      name:"Jain Lifesciences",       loc:"Science City Road, Ahmedabad",   desc:"Generic pharma manufacturer, WHO-GMP certified. Cruelty-free formulations.",                        phone:"jainlifesciences.com" },
  { cat:"Food & Restaurant",    name:"Shuddh — Pure Jain Kitchen",loc:"Bandra West, Mumbai",          desc:"Fine dining Jain restaurant. Strictly no root vegetables, no onion-garlic. Seasonal menus.",        phone:"+91 98 XXXX XXXX" },
  { cat:"Finance & Investment", name:"Mehta Capital Advisors",  loc:"Nariman Point, Mumbai",          desc:"Wealth management for HNIs and family businesses. Ethical investment strategies aligned with Jain principles.", phone:"info@mehtacapital.in" },
  { cat:"Technology",           name:"JainTech Solutions",       loc:"Bangalore, Karnataka",           desc:"Software development specializing in ERP for diamond, textile, and commodity trading businesses.",   phone:"jaintech.in" },
];

/* ── Google Sheets Schema (exported as comment reference) ─── */
/*
  GOOGLE SHEETS SCHEMA FOR JAINWORLD CMS
  Sheet: "blogs"
  Columns: id | title | slug | summary | content | category | author | date | tags | featured

  Sheet: "community_members"
  Columns: id | name | city | phone | profession | community_type | proof_url | status | approved_at | whatsapp_group

  Sheet: "jobs"
  Columns: id | title | company | location | salary | type | description | contact | posted_date | status

  Sheet: "businesses"
  Columns: id | category | name | location | description | phone | website | owner | verified | added_date

  All sheets share a "status" column: pending | approved | rejected
*/

export { TIRTHANKARAS, PHILOSOPHY_CARDS, CULTURE_ITEMS, SAMPLE_MEMBERS, SAMPLE_JOBS, SAMPLE_BUSINESSES };
