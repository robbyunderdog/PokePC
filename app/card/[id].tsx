import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
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
  image_large?: string,
  legalities?: any;
};

export default function CardDetailsScreen() {
  const { id } = useLocalSearchParams(); // Supabase UUID
  const router = useRouter();

  const [card, setCard] = useState<CardRow | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !card) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#fafafa" }}>
      
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 16, color: "#007AFF" }}>← Back</Text>
      </Pressable>

      {/* Card image */}
      <View
        style={{
          alignItems: "center",
          marginBottom: 20,
          shadowColor: "#000",
          shadowOpacity: 0.20,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
        }}
      >
        <Image
            source={{ uri: card.image_large || card.image_url}}
            style={{
            width: "100%",
            height: 400,
            borderRadius: 12,
            }}
            resizeMode="contain"
        />

      </View>

      {/* Card Name */}
      <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 8 }}>
        {card.name}
      </Text>

      {/* Set + Number */}
      <Text style={{ fontSize: 16, color: "#666", marginBottom: 6 }}>
        {card.set_name} — #{card.collector_number}
      </Text>

      {/* Rarity */}
      {card.rarity && (
        <Text style={{ fontSize: 16, color: "#333", marginBottom: 12 }}>
          Rarity: {card.rarity}
        </Text>
      )}

      {/* Types */}
      {card.types && card.types.length > 0 && (
        <Text style={{ fontSize: 16, marginBottom: 12 }}>
          Types: {card.types.join(", ")}
        </Text>
      )}

      {/* HP */}
      {card.hp && (
        <Text style={{ fontSize: 16, marginBottom: 12 }}>HP: {card.hp}</Text>
      )}

      {/* Legalities */}
      <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 20 }}>
        Legalities
      </Text>

      <Text style={{ marginTop: 6, fontSize: 15 }}>
        {Object.entries(card.legalities || {})
          .map(([format, legality]) => `${format}: ${legality}`)
          .join("\n")}
      </Text>

      {/* Placeholder button — Add Collection soon */}
      <Pressable
        onPress={() => alert("Add to collection coming soon!")}
        style={{
          backgroundColor: "#007AFF",
          padding: 14,
          borderRadius: 10,
          marginTop: 30,
        }}
      >
        <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
          Add to Collection
        </Text>
      </Pressable>
    </ScrollView>
  );
}
