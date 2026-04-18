document.getElementById('search')?.addEventListener('keyup', async (e) => {
  const q = e.target.value;

  if (q.length < 2) return;

  const res = await fetch(`/api/search?q=${q}`);
  const data = await res.json();

  console.log("Search Results:", data);

  window.location.href = `/search?q=${q}`;
});
