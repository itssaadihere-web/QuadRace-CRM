import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
        contentStyle: { backgroundColor: '#090d16' }
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Quadrace Mobile Inbox' }} />
    </Stack>
  );
}
