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

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Search Supabase cards table (UUID-based)
  async function searchCards() {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("cards")
      .select("id, name, image_url, set_name, collector_number")
      .ilike("name", `%${query}%`)
      .limit(50);

    if (error) {
      console.error("Search error:", error);
      setLoading(false);
      return;
    }

    setResults(data || []);
    setLoading(false);
  }

  // 🔑 Single search handler (button + keyboard)
  function handleSearch() {
    Keyboard.dismiss();
    searchCards();
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#fafafa" }}>
      <TextInput
        placeholder="Search cards by name..."
        placeholderTextColor="#888"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"

        /* 🔑 SPELLCHECK / KEYBOARD FIXES */
        autoCorrect={false}
        spellCheck={false}
        autoCapitalize="none"
        textContentType="none"

        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 10,
          marginBottom: 12,
          backgroundColor: "white",
          color: "black",
          fontSize: 16,
        }}
      />

      <Pressable
        onPress={handleSearch}
        style={{
          backgroundColor: "#007AFF",
          padding: 12,
          borderRadius: 10,
          marginBottom: 15,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 16 }}>
          Search
        </Text>
      </Pressable>

      {loading && (
        <View style={{ marginTop: 20, alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/card/${item.id}`)}
            style={{
              flexDirection: "row",
              backgroundColor: "white",
              padding: 10,
              borderRadius: 12,
              marginBottom: 10,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Image
              source={{ uri: item.image_url }}
              style={{
                width: 55,
                height: 80,
                borderRadius: 6,
                marginRight: 12,
              }}
            />

            <View style={{ flexShrink: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "600", color: "#222" }}>
                {item.name}
              </Text>

              <Text style={{ fontSize: 14, color: "#666", marginTop: 2 }}>
                {item.set_name} • #{item.collector_number}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
