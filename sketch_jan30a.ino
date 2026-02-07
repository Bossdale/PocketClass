#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "time.h"

// --- USER SETTINGS ---
const char* ssid       = "AJ Lomocso";
const char* password   = "piyang2004";

// --- ALARM TIME ---
const int alarmHour    = 13; 
const int alarmMinute  = 51; 

// --- TIME SETTINGS ---
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 3600 * 8; 
const int   daylightOffset_sec = 0;   

// --- HARDWARE ---
LiquidCrystal_I2C lcd(0x27, 16, 2);
const int sensorPin1 = 14; 
const int sensorPin2 = 27; 

// Variables for history
unsigned long time1 = 0; 
unsigned long time2 = 0; 
bool lastState1 = HIGH;
bool lastState2 = HIGH;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  pinMode(sensorPin1, INPUT);
  pinMode(sensorPin2, INPUT_PULLUP); // Use PULLUP to fix "floating" issues

  // 1. Connect to Wi-Fi ONCE
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  
  // Try to connect for 10 seconds, then give up (Don't freeze forever!)
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    lcd.print(".");
    attempts++;
  }

  // 2. Fetch Time (Only works if connected)
  if(WiFi.status() == WL_CONNECTED) {
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    lcd.clear();
    lcd.print("Syncing Time...");
    delay(2000); // Give it a moment to sync
  }
  
  lcd.clear();
}

void loop() {
  // --- PART 1: GET TIME (RESILIENT MODE) ---
  struct tm timeinfo;
  bool timeValid = getLocalTime(&timeinfo); // Returns true if time is known

  // If we don't know the time (e.g. boot with no wifi), start at 00:00:00
  // But we WON'T stop the loop. We will just show 00:00.
  int currentHour   = timeValid ? timeinfo.tm_hour : 0;
  int currentMinute = timeValid ? timeinfo.tm_min  : 0;
  int currentSecond = timeValid ? timeinfo.tm_sec  : 0;

  // --- PART 2: SENSORS ---
  int s1 = digitalRead(sensorPin1);
  int s2 = digitalRead(sensorPin2);

  if (s1 == LOW && lastState1 == HIGH) time1 = millis();
  if (s2 == LOW && lastState2 == HIGH) time2 = millis();
  lastState1 = s1; lastState2 = s2;

  // Determine Winner
  int activeSensor = 0; 
  if (s1 == LOW && s2 == LOW) {
    activeSensor = (time1 > time2) ? 1 : 2;
  } else if (s1 == LOW) activeSensor = 1;
  else if (s2 == LOW) activeSensor = 2;

  // --- PART 3: DISPLAY ---
  bool isAlarm = (currentHour == alarmHour && currentMinute == alarmMinute);

  // PRIORITY 1: SENSORS
  if (activeSensor > 0) {
    lcd.setCursor(0, 0); 
    lcd.print("!! WARNING !!   "); 
    lcd.setCursor(0, 1);
    lcd.print("Sensor "); 
    lcd.print(activeSensor);
    lcd.print(" Active   "); 
  }
  
  // PRIORITY 2: ALARM (Only works if time is valid)
  else if (timeValid && isAlarm) {
    lcd.setCursor(0, 0);
    lcd.print("!! WAKE UP !!   ");
    lcd.setCursor(0, 1);
    lcd.print("ALARM RINGING   ");
  }
  
  // PRIORITY 3: CLOCK (With Status Indicator)
  else {
    // Top Row: Show if Wifi is Online or Offline
    lcd.setCursor(0, 0); 
    if (WiFi.status() == WL_CONNECTED) {
      lcd.print("WiFi: ONLINE    "); 
    } else {
      lcd.print("WiFi: OFFLINE   "); // Clock still works!
    }
    
    // Bottom Row: Time
    lcd.setCursor(0, 1);
    if (!timeValid) {
      lcd.print("Time Unknown    ");
    } else {
      if(currentHour < 10) lcd.print("0");
      lcd.print(currentHour);
      lcd.print(":");
      if(currentMinute < 10) lcd.print("0");
      lcd.print(currentMinute);
      lcd.print(":");
      if(currentSecond < 10) lcd.print("0");
      lcd.print(currentSecond);
      lcd.print("        "); 
    }
  }
  delay(100); 
}