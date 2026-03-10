// Brings in React Native specific matchers (like .toBeVisible() for <View> tags)
import '@testing-library/react-native/extend-expect';

// Mocks the mobile storage so your tests don't crash when testing store.ts
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);