import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="collection" options={{ title: "Collection" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="decks" options={{ title: "Decks" }} />
      <Tabs.Screen name="scan" options={{ title: "Scan" }} />
    </Tabs>
  );
}