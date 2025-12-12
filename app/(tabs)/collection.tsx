import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";

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
  };
};

export default function CollectionScreen() {
  const [cards, setCards] = useState<UserCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const router = useRouter();

  async function loadCollection() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

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

    const normalized: UserCardRow[] = (data ?? [])
      .filter((row: any) => row.cards)
      .map((row: any) => ({
        id: row.id,
        card_id: row.card_id,
        quantity: row.quantity,
        cards: row.cards,
      }));

    setCards(normalized);
    setLoading(false);
  }

  useFocusEffect(
    useCallback(() => {
      loadCollection();
    }, [])
  );

  async function increaseQuantity(row: UserCardRow) {
    Haptics.selectionAsync();
    setActiveId(row.id);

    const { error } = await supabase
      .from("user_cards")
      .update({ quantity: row.quantity + 1 })
      .eq("id", row.id);

    if (!error) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === row.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    }

    setTimeout(() => setActiveId(null), 400);
  }

  async function decreaseQuantity(row: UserCardRow) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveId(row.id);

    if (row.quantity <= 1) {
      const { error } = await supabase
        .from("user_cards")
        .delete()
        .eq("id", row.id);

      if (!error) {
        setCards((prev) => prev.filter((c) => c.id !== row.id));
      }

      setTimeout(() => setActiveId(null), 400);
      return;
    }

    const { error } = await supabase
      .from("user_cards")
      .update({ quantity: row.quantity - 1 })
      .eq("id", row.id);

    if (!error) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === row.id ? { ...c, quantity: c.quantity - 1 } : c
        )
      );
    }

    setTimeout(() => setActiveId(null), 400);
  }

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ fontSize: 18, color: "#666" }}>
          You don’t have any cards yet.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={{ flex: 1, backgroundColor: "#fafafa" }}
      edges={["bottom"]}
      >
      <FlatList
        contentContainerStyle={{
          paddingTop: 12,
          paddingHorizontal: 12,
          paddingBottom: 12,
        }}
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const c = item.cards;
          const active = activeId === item.id;

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
                elevation: 3,
              }}
            >
              <Image
                source={{ uri: c.image_url }}
                style={{
                  width: 55,
                  height: 80,
                  borderRadius: 6,
                  marginRight: 12,
                }}
              />

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "600" }}>
                  {c.name}
                </Text>
                <Text style={{ fontSize: 14, color: "#666" }}>
                  {c.set_name} • #{c.collector_number}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <Pressable
                    onPress={() => decreaseQuantity(item)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: active ? "#fee2e2" : "#eee",
                      borderRadius: 6,
                    }}
                  >
                    <Text>{active ? "Removed" : "−"}</Text>
                  </Pressable>

                  <Text
                    style={{
                      marginHorizontal: 12,
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    {item.quantity}
                  </Text>

                  <Pressable
                    onPress={() => increaseQuantity(item)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: active ? "#dcfce7" : "#eee",
                      borderRadius: 6,
                    }}
                  >
                    <Text>{active ? "Added" : "+"}</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
