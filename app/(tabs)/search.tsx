// app/(tabs)/search.tsx

import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

// Describe what a row in the `cards` table looks like (only what we use)
type CardRow = {
  id: string;
  name: string;
  set_name: string;
  collector_number: string;
  rarity?: string;
  image_url?: string;
};

const router = useRouter();

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardRow[]>([]); // 👈 typed here
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (query.length < 2) {
      alert("Search must be at least 2 characters.");
      return;
    }

    setLoading(true);
    setSearched(true);
    Keyboard.dismiss();

    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(50);

    if (error) {
      console.error(error);
    }

    setResults((data as CardRow[]) || []); // 👈 cast so TS is happy
    setLoading(false);
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#fafafa" }}>
      {/* Search Input */}
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: "#ddd",
          marginBottom: 16,
        }}
      >
        <TextInput
          placeholder="Search Pokémon cards..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          style={{
            fontSize: 16,
            paddingVertical: 8,
            color: "#222",
          }}
        />
      </View>

      {loading && (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      )}

      {!loading && searched && results.length === 0 && (
        <Text style={{ textAlign: "center", marginTop: 20, color: "#555" }}>
          No cards found.
        </Text>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({
              pathname: "/card/[id]",
              params: { id: item.id}
            })}
            style={{
              flexDirection: "row",
              backgroundColor: "white",
              marginBottom: 12,
              borderRadius: 12,
              padding: 10,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {item.image_url && (
              <Image
                source={{ uri: item.image_url }}
                style={{
                  width: 65,
                  height: 90,
                  borderRadius: 6,
                  marginRight: 12,
                }}
              />
            )}

            <View style={{ flexShrink: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "600", color: "#222" }}>
                {item.name}
              </Text>

              <Text style={{ fontSize: 14, color: "#666", marginTop: 2 }}>
                {item.set_name} • #{item.collector_number}
              </Text>

              {item.rarity && (
                <Text style={{ marginTop: 4, fontSize: 13, color: "#333" }}>
                  {item.rarity}
                </Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
