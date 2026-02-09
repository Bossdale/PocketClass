#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "time.h"
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// --- USER SETTINGS ---
const char* ssid       = "Lengering";
const char* password   = "12345678910";

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

// --- GPS SETTINGS ---
TinyGPSPlus gps;
HardwareSerial GPS_Serial(2); 
const int RXPin = 16; 
const int TXPin = 17;
const int GPSBaud = 9600; 

// Variables
unsigned long time1 = 0; 
unsigned long time2 = 0; 
bool lastState1 = HIGH;
bool lastState2 = HIGH;
unsigned long lastSerialUpdate = 0; // To control Serial print speed

void setup() {
  Serial.begin(115200);
  
  // 1. Setup GPS Serial
  GPS_Serial.begin(GPSBaud, SERIAL_8N1, RXPin, TXPin);
  Serial.println("\n--------------------------------");
  Serial.println("SYSTEM STARTED");
  Serial.println("GPS Serial Initialized...");
  
  // 2. Setup LCD & Sensors
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  pinMode(sensorPin1, INPUT);
  pinMode(sensorPin2, INPUT_PULLUP);

  // 3. Connect to Wi-Fi
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) { 
    delay(500);
    lcd.print(".");
    Serial.print(".");
    attempts++;
  }
  Serial.println("\nWiFi Setup Complete (or skipped).");

  // 4. Fetch Time
  if(WiFi.status() == WL_CONNECTED) {
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    lcd.clear();
    lcd.print("Syncing Time...");
    delay(2000); 
  }
  
  lcd.clear();
}

void loop() {
  // --- PART 1: FEED THE GPS & DEBUGGING ---
  while (GPS_Serial.available() > 0) {
    gps.encode(GPS_Serial.read());
  }

  // EVERY 1 SECOND: Print detailed GPS progress to Serial Monitor
  if (millis() - lastSerialUpdate > 1000) {
    lastSerialUpdate = millis();
    
    Serial.print("GPS STATUS: ");
    
    // Check if the wiring is working (Are we receiving ANYTHING?)
    if (gps.charsProcessed() < 10) {
      Serial.println("NO DATA! Check Wiring (RX/TX)!");
    } 
    else if (!gps.location.isValid()) {
      // Wiring is good, but no lock yet. Show progress details.
      Serial.print("Searching... [");
      Serial.print(gps.satellites.value());
      Serial.print(" Satellites] ");
      
      // Often time works before location. Check if we have time.
      if (gps.time.isValid()) {
        Serial.print("Time detected: ");
        Serial.print(gps.time.hour());
        Serial.print(":");
        Serial.print(gps.time.minute());
      } else {
        Serial.print("(Waiting for Time data...)");
      }
      Serial.println();
    } 
    else {
      // FULL SUCCESS
      Serial.print("LOCKED! Lat: ");
      Serial.print(gps.location.lat(), 6);
      Serial.print(" | Lon: ");
      Serial.println(gps.location.lng(), 6);
    }
  }

  // --- PART 2: GET WIFI TIME ---
  struct tm timeinfo;
  bool timeValid = getLocalTime(&timeinfo); 
  int currentHour   = timeValid ? timeinfo.tm_hour : 0;
  int currentMinute = timeValid ? timeinfo.tm_min  : 0;

  // --- PART 3: CHECK SENSORS ---
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

  // --- PART 4: DISPLAY CONTROLLER ---
  bool isAlarm = (currentHour == alarmHour && currentMinute == alarmMinute);

  if (activeSensor > 0) {
    lcd.setCursor(0, 0); 
    lcd.print("!! WARNING !!   "); 
    lcd.setCursor(0, 1);
    lcd.print("Sensor "); 
    lcd.print(activeSensor);
    lcd.print(" Active   "); 
  }
  else if (timeValid && isAlarm) {
    lcd.setCursor(0, 0);
    lcd.print("!! WAKE UP !!   ");
    lcd.setCursor(0, 1);
    lcd.print("ALARM RINGING   ");
  }
  else {
    lcd.setCursor(0, 0); 
    if (WiFi.status() == WL_CONNECTED) lcd.print("WiFi: ON  ");
    else lcd.print("WiFi: OFF ");
    
    if (gps.location.isValid()) lcd.print("GPS: OK ");
    else lcd.print("GPS: -- ");

    lcd.setCursor(0, 1);
    if ((millis() / 3000) % 2 == 0) {
      if (!timeValid) {
        lcd.print("Time Unknown    ");
      } else {
        lcd.print("Time: ");
        if(currentHour < 10) lcd.print("0");
        lcd.print(currentHour);
        lcd.print(":");
        if(currentMinute < 10) lcd.print("0");
        lcd.print(currentMinute);
        lcd.print(":");
        if(timeinfo.tm_sec < 10) lcd.print("0");
        lcd.print(timeinfo.tm_sec);
        lcd.print("   ");
      }
    } else {
      if (gps.location.isValid()) {
        lcd.print(gps.location.lat(), 2);
        lcd.print(",");
        lcd.print(gps.location.lng(), 2);
        lcd.print("     ");
      } else {
        lcd.print("Sats Found: ");
        lcd.print(gps.satellites.value()); // Show satellite count on LCD too!
        lcd.print("   ");
      }
    }
  }
}