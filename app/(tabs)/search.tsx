// app/(tabs)/search.tsx
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, TextInput, View } from "react-native";
import { searchCardsByName } from "../../src/lib/pokemonapi";
import { supabase } from "../../src/lib/supabase";

// Type definition for Pokémon cards
type PokemonCard = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  supertype?: string;
  subtypes?: string[];
  set?: { id: string; name: string };
  images?: { small: string };
  hp?: string;
  types?: string[];
  legalities?: any;
};

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokemonCard[]>([]);

  // Debounce search (wait 300ms after user stops typing)
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.length >= 3) {
        const cards = await searchCardsByName(query);
        setResults(cards);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  async function cacheCard(card: PokemonCard) {
    console.log("Caching card:", card.id);

    // 1: Check if card already in Supabase
    const { data: existing, error: selectError } = await supabase
      .from("cards")
      .select("id")
      .eq("tcg_id", card.id)
      .maybeSingle();

    if (selectError) {
      console.error("Supabase SELECT error:", selectError);
      return;
    }

    let cardId = existing?.id;

    // 2: Insert into Supabase if missing
    if (!cardId) {
      console.log("Inserting card into Supabase…");

      const { data: inserted, error: insertError } = await supabase
        .from("cards")
        .insert([
          {
            tcg_id: card.id,
            name: card.name,
            supertype: card.supertype ?? "",
            subtypes: card.subtypes ?? [],
            set_name: card.set?.name ?? "",
            set_code: card.set?.id ?? "",
            collector_number: card.number,
            rarity: card.rarity ?? "",
            hp: card.hp ? parseInt(card.hp) : null,
            types: card.types ?? [],
            image_url: card.images?.small ?? "",
            legalities: card.legalities ?? {},
          },
        ])
        .select()
        .single();

      if (insertError) {
        console.error("Supabase INSERT error:", insertError);
        return;
      }

      console.log("Inserted card:", inserted);
      cardId = inserted.id;
    } else {
      console.log("Card already exists:", cardId);
    }

    alert("Card cached in Supabase: " + card.name);
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f5f5f5" }}>
      {/* Search Bar */}
      <TextInput
        placeholder="Search Pokémon cards…"
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
        style={{
          borderWidth: 1,
          padding: 12,
          backgroundColor: "white",
          color: "black",
          borderRadius: 8,
          marginBottom: 12,
        }}
      />

      {/* Search Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => cacheCard(item)}
            style={{
              flexDirection: "row",
              padding: 10,
              backgroundColor: "white",
              borderRadius: 8,
              marginBottom: 10,
              alignItems: "center",
              elevation: 2,
            }}
          >
            {item.images?.small && (
              <Image
                source={{ uri: item.images.small }}
                style={{ width: 60, height: 85, marginRight: 10 }}
              />
            )}
            <View>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: "#444" }}>
                {item.set?.name} • #{item.number}
              </Text>
              {item.rarity && <Text style={{ fontSize: 12 }}>{item.rarity}</Text>}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
