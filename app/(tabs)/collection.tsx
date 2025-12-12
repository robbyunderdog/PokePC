import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";

// The final normalized structure we want:
type UserCardRow = {
  id: string;
  card_id: string;
  quantity: number;
  cards: {
    id: string;
    name: string;
    set_name: string;
    collector_number: string;
    image_url: string;
  } | null; // Supabase returns array; we normalize to single item
};

export default function CollectionScreen() {
  const [cards, setCards] = useState<UserCardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // Fetch user's collection
  async function loadCollection() {
    setLoading(true);

    // Get logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("No user found for collection");
      setLoading(false);
      return;
    }

    // Join user_cards → cards
    const { data, error } = await supabase
      .from("user_cards")
      .select(
        `
    id,
    card_id,
    quantity,
    cards:cards!fk_user_cards_cards (
      id,
      name,
      set_name,
      collector_number,
      image_url
    )
  `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Normalize cards[] → cards (single object)
    const normalized = (data || []).map((row: any) => ({
      ...row,
      cards: row.cards ?? null, // no [0] needed now!
    }));

    setCards(normalized);
    setLoading(false);
  }

  // Load on mount + realtime update when DB changes
  useEffect(() => {
    loadCollection();

    const channel = supabase
      .channel("collection_refresh")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_cards",
        },
        () => {
          loadCollection();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, color: "#666" }}>
          You don't have any cards yet.
        </Text>
      </View>
    );
  }

  // Render collection list
  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: "#fafafa" }}>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const c = item.cards;
          if (!c) return null;

          return (
            <Pressable
              onPress={() => router.push(`/card/${c.id}`)}
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
              {/* Thumbnail */}
              <Image
                source={{ uri: c.image_url }}
                style={{
                  width: 55,
                  height: 80,
                  borderRadius: 6,
                  marginRight: 12,
                }}
              />

              {/* Card info */}
              <View style={{ flexShrink: 1 }}>
                <Text
                  style={{ fontSize: 17, fontWeight: "600", color: "#222" }}
                >
                  {c.name}
                </Text>

                <Text style={{ fontSize: 14, color: "#666", marginTop: 2 }}>
                  {c.set_name} • #{c.collector_number}
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    color: "#007AFF",
                    fontWeight: "600",
                    marginTop: 6,
                  }}
                >
                  Quantity: {item.quantity}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
