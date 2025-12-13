import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { supabase } from "../../src/lib/supabase";
import { modalBlurProgress } from "../../src/store/modalBlur";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  /* ------------------ SEARCH ------------------ */

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

  function handleSearch() {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    searchCards();
  }

  /* ------------------ BLUR ------------------ */

  const blurStyle = useAnimatedStyle(() => ({
    opacity: modalBlurProgress.value,
  }));

  /* ------------------ UI ------------------ */

  return (
    <View style={styles.container}>
      {/* Search Row */}
      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search cards by name..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
          spellCheck={false}
          autoCapitalize="none"
          textContentType="none"
          style={styles.input}
        />

        <Pressable onPress={handleSearch} style={styles.searchButton}>
          <Text style={styles.searchText}>Search</Text>
        </Pressable>
      </View>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();

              // 🔑 TURN BLUR ON *BEFORE* NAVIGATION
              modalBlurProgress.value = withTiming(1, { duration: 200 });

              router.push(`/card/${item.id}`);
            }}
            style={styles.cardRow}
          >
            <Image source={{ uri: item.image_url }} style={styles.image} />

            <View style={{ flexShrink: 1 }}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {item.set_name} • #{item.collector_number}
              </Text>
            </View>
          </Pressable>
        )}
      />

      {/* 🔑 SEARCH-OWNED BACKGROUND BLUR */}
      <AnimatedBlurView
        intensity={30}
        tint="dark"
        style={[StyleSheet.absoluteFill, blurStyle]}
        pointerEvents="none"
      />
    </View>
  );
}

/* ------------------ STYLES ------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fafafa",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "white",
    color: "black",
    fontSize: 16,
    marginRight: 8,
  },

  searchButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },

  searchText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  loading: {
    marginTop: 20,
    alignItems: "center",
  },

  cardRow: {
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
  },

  image: {
    width: 55,
    height: 80,
    borderRadius: 6,
    marginRight: 12,
  },

  cardName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#222",
  },

  cardMeta: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});
