import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>
          This screen doesn't exist.
        </Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff', // Maps to bg-white
  },
  title: {
    fontSize: 20,         // Maps to text-xl
    fontWeight: 'bold',   // Maps to font-bold
    color: '#111827',     // Maps to text-gray-900
  },
  link: {
    marginTop: 16,        // Maps to mt-4
    paddingVertical: 16,  // Maps to py-4
  },
  linkText: {
    fontSize: 14,         // Maps to text-sm
    fontWeight: '500',    // Maps to font-medium
    color: '#3b82f6',     // Maps to text-blue-500
  },
});