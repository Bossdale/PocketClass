import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

// 1. Setup the handler (Global Config)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,  // Show the banner at the top
    shouldShowList: true,    // Show in the notification center
  }),
});

// 2. Permission Request Function
export async function registerForNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    Alert.alert('Permission Required', 'Push notifications need to be enabled for the alarm!');
    return false;
  }
  return true;
}

// 3. Schedule Function (Export this so you can use it anywhere)
export async function scheduleAlarmNotification(seconds: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Alarm Active! 🚨",
      body: "Tap here to view your alarm details.",
      data: { screen: 'AlarmModal' }, // <--- The hidden data
    },
    trigger: {
      // 1. Explicitly state the type (Fixes "Property 'type' is missing")
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      
      // 2. The time payload
      seconds: seconds, 
      
      // 3. Explicitly state if it repeats (Good practice)
      repeats: false,
    },
  });
}