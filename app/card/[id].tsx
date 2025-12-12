import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";

type CardRow = {
  id: string;
  tcg_id: string;
  name: string;
  set_name: string;
  set_code: string;
  collector_number: string;
  rarity?: string;
  hp?: number;
  types?: string[];
  image_url?: string;
  image_large?: string;
  legalities?: any;
};

export default function CardDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [card, setCard] = useState<CardRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function loadCard() {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("id", id)
        .single();

      if (error) console.error(error);

      setCard(data);
      setLoading(false);
    }

    loadCard();
  }, [id]);

  async function addToCollection() {
    if (!card) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAdding(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAdding(false);
      return;
    }

    const { data: existing } = await supabase
      .from("user_cards")
      .select("*")
      .eq("user_id", user.id)
      .eq("card_id", card.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("user_cards")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
    } else {
      await supabase.from("user_cards").insert({
        user_id: user.id,
        card_id: card.id,
        quantity: 1,
      });
    }

    setTimeout(() => setAdding(false), 600);
  }

  if (loading || !card) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fafafa" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 16, color: "#007AFF" }}>← Back</Text>
        </Pressable>

        <Image
          source={{ uri: card.image_large || card.image_url }}
          style={{ width: "100%", height: 400, borderRadius: 12 }}
          resizeMode="contain"
        />

        <Text style={{ fontSize: 28, fontWeight: "700", marginVertical: 12 }}>
          {card.name}
        </Text>

        <Text style={{ fontSize: 16, color: "#666" }}>
          {card.set_name} — #{card.collector_number}
        </Text>

        <Pressable
          onPress={addToCollection}
          disabled={adding}
          style={{
            backgroundColor: adding ? "#22c55e" : "#007AFF",
            padding: 14,
            borderRadius: 10,
            marginTop: 30,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
            {adding ? "Added ✓" : "Add to Collection"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
