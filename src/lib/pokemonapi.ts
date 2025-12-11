// src/lib/pokemon-api.ts
import axios from "axios";

const API_BASE = "https://api.pokemontcg.io/v2/cards";
const API_KEY = process.env.EXPO_PUBLIC_POKEMON_API_KEY;

/**
 * Searches Pokémon cards by name using the Pokémon TCG API.
 * Automatically retries on 504 errors and prevents invalid short queries.
 */
export async function searchCardsByName(name: string) {
  if (!name || name.length < 3) return [];

  const encoded = `"${name}"`;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(API_BASE, {
        params: { q: `name:${encoded}` },
        headers: API_KEY ? { "X-Api-Key": API_KEY } : {},
      });

      return response.data.data ?? [];
    } catch (error: any) {
      const status = error?.response?.status;

      // Retry on timeout (504)
      if (status === 504) {
        console.warn(`Pokémon API timed out (attempt ${attempt}). Retrying...`);
        await new Promise((res) => setTimeout(res, 200 * attempt));
        continue;
      }

      console.warn("Pokémon API error:", status, error.message);
      return [];
    }
  }

  console.warn("Pokémon API fully failed after retries.");
  return [];
}
