import axios from "axios";

const API_BASE = "https://api.pokemontcg.io/v2/cards";
const API_KEY = process.env.EXPO_PUBLIC_POKEMON_API_KEY;

export async function searchCardsByName(name: string) {
  if (!name || name.length < 3) return [];

  // 1. Sanitize user input
  const cleaned = name
    .trim()
    .replace(/"/g, "")      // remove quotes
    .replace(/:/g, "")      // remove colons
    .replace(/\s+/g, " ");  // normalize spaces

  // 2. Create API-compliant query
  const rawQuery = `name:"${cleaned}"`;

  // 3. Encode entire query to satisfy Pokémon TCG API
  const encodedQuery = encodeURIComponent(rawQuery);

  const url = `${API_BASE}?q=${encodedQuery}`;

  // Retry settings
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const res = await axios.get(url, {
        headers: API_KEY ? { "X-Api-Key": API_KEY } : {},
      });

      return res.data.data ?? [];
    } catch (err: any) {
      const status = err?.response?.status;

      // If 504 -> retry
      if (status === 504) {
        attempt++;
        console.warn(
          `Pokémon API 504 (timeout). Retry ${attempt} of ${maxRetries}...`
        );

        // Wait before retrying (exponential backoff)
        await new Promise((res) => setTimeout(res, 250 * attempt));
        continue;
      }

      // Other errors should not retry
      console.warn("Pokémon API error:", status, err.message);
      return [];
    }
  }

  console.warn("Pokémon API failed all retries.");
  return [];
}
