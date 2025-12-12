import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import "dotenv/config";

const supabase = createClient(
  process.env.SEED_SUPABASE_URL,
  process.env.SEED_SUPABASE_SERVICE_ROLE_KEY
);


// =============================
//  CONSTANTS
// =============================
const API_URL = "https://api.pokemontcg.io/v2/cards";
const PAGE_SIZE = 250;

// Fetch all cards with pagination
async function fetchAllCards() {
  let allCards = [];
  let page = 1;
  let totalCount = null;

  console.log("Starting Pokémon TCG card download…");

  while (true) {
    try {
      const res = await axios.get(API_URL, {
        params: { page, pageSize: PAGE_SIZE },
      });

      if (!totalCount) {
        totalCount = res.data.totalCount;
        console.log(`Total cards to download: ${totalCount}`);
      }

      const cards = res.data.data;
      if (!cards || cards.length === 0) break;

      allCards.push(...cards);

      console.log(
        `Downloaded page ${page} — ${cards.length} cards (${allCards.length}/${totalCount})`
      );

      page++;
    } catch (err) {
      console.error("Error fetching page", page, err.message);
      await new Promise((res) => setTimeout(res, 1000)); // retry delay
      continue;
    }
  }

  return allCards;
}

// Transform card data to match your Supabase schema
function transformCard(c) {
  return {
    tcg_id: c.id,
    name: c.name,
    supertype: c.supertype ?? "",
    subtypes: c.subtypes ?? [],
    set_name: c.set?.name ?? "",
    set_code: c.set?.id ?? "",
    collector_number: c.number ?? "",
    rarity: c.rarity ?? "",
    hp: c.hp ? parseInt(c.hp) : null,
    types: c.types ?? [],
    image_url: c.images?.small ?? "",
    image_large: c.images?.large ?? "",
    legalities: c.legalities ?? {},
  };
}

// Batch insert into Supabase
async function insertCards(cards) {
  const BATCH_SIZE = 500;

  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);

    console.log(`Inserting cards ${i} → ${i + batch.length}…`);

    const { error } = await supabase.from("cards").insert(batch);

    if (error) {
      console.error("Insert error:", error);
      return;
    }
  }
}

// Main function
(async function () {
  console.log("Starting full card import…");

  const cards = await fetchAllCards();
  console.log(`\nFetched ${cards.length} total cards.`);
  console.log("Transforming…");

  const transformed = cards.map(transformCard);

  console.log("Inserting into Supabase…");
  await insertCards(transformed);

  console.log("\n🎉 DONE! All cards cached into Supabase.");
})();
