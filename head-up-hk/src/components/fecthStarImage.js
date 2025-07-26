// fetchActorImage.js

const TMDB_KEY = process.env.REACT_APP_TMDB_KEY;

export async function fetchActorImage(name) {
  if (!name) return null;
  const url = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(
    name
  )}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (
      data.results &&
      data.results.length > 0 &&
      data.results[0].profile_path
    ) {
      return "https://image.tmdb.org/t/p/w500" + data.results[0].profile_path;
    }
    return null; // Not found
  } catch (e) {
    console.error("TMDB fetch error:", e);
    return null;
  }
}
