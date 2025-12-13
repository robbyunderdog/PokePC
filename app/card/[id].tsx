import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;

type CardRow = {
  id: string;
  tcg_id: string;
  name: string;
  set_name: string;
  set_code: string;
  collector_number: string;
  rarity?: string;
  image_url?: string;
  image_large?: string;
};

export default function CardDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [card, setCard] = useState<CardRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  /* ------------------ DATA ------------------ */

  useEffect(() => {
    async function loadCard() {
      const { data } = await supabase
        .from("cards")
        .select("*")
        .eq("id", id)
        .single();

      setCard(data);
      setLoading(false);
    }

    loadCard();
  }, [id]);

  /* ------------------ COLLECTION ------------------ */

  async function addToCollection() {
    if (!card) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAdding(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

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

  /* ------------------ ANIMATION ------------------ */

  const translateY = useSharedValue(SHEET_HEIGHT);

  useEffect(() => {
    translateY.value = withTiming(0, { duration: 260 });
  }, []);

  const dismiss = () => {
    translateY.value = withTiming(
      SHEET_HEIGHT,
      { duration: 220 },
      () => runOnJS(router.back)()
    );
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(e.translationY, 0);
    })
    .onEnd((e) => {
      const shouldDismiss =
        translateY.value > 140 || e.velocityY > 1200;

      if (shouldDismiss) {
        runOnJS(Haptics.impactAsync)(
          Haptics.ImpactFeedbackStyle.Light
        );
        runOnJS(dismiss)();
      } else {
        translateY.value = withSpring(0, {
          damping: 26,
          stiffness: 260,
        });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  /* ------------------ LOADING ------------------ */

  if (loading || !card) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const imageUri = card.image_large || card.image_url;

  /* ------------------ UI ------------------ */

  return (
    <View style={styles.container}>
      {/* Tap outside */}
      <Pressable style={styles.backdrop} onPress={dismiss} />

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            <View style={styles.cardContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.cardImage}
                resizeMode="contain"
              />
            </View>

            <View
              style={[
                styles.infoPanel,
                { paddingBottom: 16 + insets.bottom },
              ]}
            >
              <Text style={styles.name}>{card.name}</Text>

              <Text style={styles.subtitle}>
                {card.set_name} • #{card.collector_number}
              </Text>

              {card.rarity && (
                <Text style={styles.meta}>Rarity: {card.rarity}</Text>
              )}

              <Pressable
                onPress={addToCollection}
                disabled={adding}
                style={[
                  styles.addButton,
                  adding ? styles.added : styles.add,
                ]}
              >
                <Text style={styles.addText}>
                  {adding ? "Added ✓" : "Add to Collection"}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/* ------------------ STYLES ------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: SHEET_HEIGHT,
  },

  cardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    shadowRadius: 20,
    shadowOpacity: 3,
    shadowColor: "gray",
  },

  cardImage: {
    width: "72%",
    height: "86%",
  },

  infoPanel: {
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  name: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },

  subtitle: {
    color: "#ddd",
    fontSize: 15,
    marginBottom: 8,
  },

  meta: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 12,
  },

  addButton: {
    padding: 14,
    borderRadius: 12,
  },

  add: {
    backgroundColor: "#007AFF",
  },

  added: {
    backgroundColor: "#22c55e",
  },

  addText: {
    color: "white",
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
  },
});
