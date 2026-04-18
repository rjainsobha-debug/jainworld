let lang = localStorage.getItem('lang') || 'hi';

function toggleLang() {
  lang = lang === 'hi' ? 'en' : 'hi';
  localStorage.setItem('lang', lang);
  location.reload();
}
