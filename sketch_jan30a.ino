#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "time.h"
#include <TinyGPS++.h>
#include <HardwareSerial.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

Preferences pref;

// --- WIFI SETTINGS ---
const char* ssid       = "blacknwhite_5";
const char* password   = "bwpizza8";

// --- TIME SETTINGS ---
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 3600 * 8; 
const int   daylightOffset_sec = 0;   

// --- HARDWARE PINS ---
LiquidCrystal_I2C lcd(0x27, 16, 2);
// 4 Sensors for 4 Compartments
const int sensorPins[4] = {14, 27, 26, 25}; 

// --- GPS SETTINGS ---
TinyGPSPlus gps;
HardwareSerial GPS_Serial(2); 
const int RXPin = 16; 
const int TXPin = 17;
const int GPSBaud = 9600; 

// --- BLE SETTINGS ---
// UUIDs generated for this specific device
#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHAR_SENSOR_UUID       "6E400002-B5A3-F393-E0A9-E50E24DCCA9E" // Notify App of sensor trigger
#define CHAR_GPS_UUID          "6E400003-B5A3-F393-E0A9-E50E24DCCA9E" // Read/Notify location
#define CHAR_ALARM_CONFIG_UUID "6E400004-B5A3-F393-E0A9-E50E24DCCA9E" // Write alarm settings

BLEServer* pServer = NULL;
BLECharacteristic* pSensorChar = NULL;
BLECharacteristic* pGPSChar = NULL;
BLECharacteristic* pAlarmChar = NULL;
bool deviceConnected = false;

// --- STATE VARIABLES ---
unsigned long lastSensorTrigger[4] = {0, 0, 0, 0}; // Debounce
bool lastState[4] = {HIGH, HIGH, HIGH, HIGH};
unsigned long lastLCDUpdate = 0;
unsigned long lastGPSUpdate = 0;

// Alarm Storage (4 slots, HH and MM)
int alarmHours[4] = {-1, -1, -1, -1};
int alarmMinutes[4] = {-1, -1, -1, -1};

// --- BLE CALLBACKS ---
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("Phone Connected!");
    };
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Phone Disconnected, restarting scan...");
      BLEDevice::startAdvertising(); // Keep visible
    }
};

// Callback to receive Alarms from App
// Expected Format: "SLOT:HH:MM" (e.g., "1:14:30")
class AlarmCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String value = pCharacteristic->getValue().c_str(); 
      if (value.length() > 0) {
        int slot = value.substring(0, 1).toInt() - 1; // Convert '1' to index 0
        int hour = value.substring(2, 4).toInt();
        int minute = value.substring(5, 7).toInt();
        
        if(slot >= 0 && slot < 4) {
          alarmHours[slot] = hour;
          alarmMinutes[slot] = minute;
          
          // Save to permanent memory
          char keyH[10], keyM[10];
          sprintf(keyH, "h%d", slot);
          sprintf(keyM, "m%d", slot);
          pref.putInt(keyH, hour);
          pref.putInt(keyM, minute);
          
          Serial.printf("Updated Alarm Slot %d to %02d:%02d\n", slot+1, hour, minute);
        }
      }
    }
};

void setup() {
  Serial.begin(115200);
  GPS_Serial.begin(GPSBaud, SERIAL_8N1, RXPin, TXPin);
  
  // 1. Init Storage & Load Alarms
  pref.begin("medbox-data", false);
  for(int i=0; i<4; i++) {
    char keyH[10], keyM[10];
    sprintf(keyH, "h%d", i);
    sprintf(keyM, "m%d", i);
    alarmHours[i] = pref.getInt(keyH, -1);
    alarmMinutes[i] = pref.getInt(keyM, -1);
    pinMode(sensorPins[i], INPUT_PULLUP); // Use Pullup for stability
  }
  
  // 2. Init Hardware
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  
  // 3. Init WiFi (For Time)
  lcd.setCursor(0, 0); lcd.print("WiFi Connecting");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) { 
    delay(300); lcd.print("."); attempts++;
  }
  if(WiFi.status() == WL_CONNECTED) {
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  }

  // 4. Init BLE
  BLEDevice::init("MedBox Device");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Sensor Notify Characteristic
  pSensorChar = pService->createCharacteristic(
                      CHAR_SENSOR_UUID,
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pSensorChar->addDescriptor(new BLE2902());

  // GPS Notify Characteristic
  pGPSChar = pService->createCharacteristic(
                      CHAR_GPS_UUID,
                      BLECharacteristic::PROPERTY_READ |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  
  // Alarm Config Characteristic
  pAlarmChar = pService->createCharacteristic(
                      CHAR_ALARM_CONFIG_UUID,
                      BLECharacteristic::PROPERTY_WRITE
                    );
  pAlarmChar->setCallbacks(new AlarmCallbacks());

  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06); 
  BLEDevice::startAdvertising();
  
  lcd.clear();
}

void loop() {
  // --- 1. HANDLE GPS & SENSORS (ALWAYS RUNNING) ---
  while (GPS_Serial.available() > 0) gps.encode(GPS_Serial.read());

  // Check all 4 sensors
  for(int i=0; i<4; i++) {
    int state = digitalRead(sensorPins[i]);
    
    // Detect Falling Edge (Object Removed/Detected)
    if(state == LOW && lastState[i] == HIGH) {
      // Debounce (prevent double triggers within 2 seconds)
      if(millis() - lastSensorTrigger[i] > 2000) {
        lastSensorTrigger[i] = millis();
        
        // Notify App via BLE: "1", "2", "3", or "4"
        if(deviceConnected) {
          String msg = String(i + 1);
          pSensorChar->setValue(msg.c_str());
          pSensorChar->notify();
          Serial.printf("Sensor %d Triggered -> Sent to App\n", i+1);
        }
        
        // Show on LCD
        lcd.clear();
        lcd.setCursor(0,0); lcd.print("Med Taken!");
        lcd.setCursor(0,1); lcd.print("Slot "); lcd.print(i+1);
        delay(1000); // Short pause for user feedback
      }
    }
    lastState[i] = state;
  }

  // --- 2. PERIODIC UPDATES (Every 250ms) ---
  if (millis() - lastLCDUpdate > 250) {
    lastLCDUpdate = millis();

    // Get Time
    struct tm timeinfo;
    bool timeValid = getLocalTime(&timeinfo, 0);
    int h = timeValid ? timeinfo.tm_hour : 0;
    int m = timeValid ? timeinfo.tm_min : 0;

    // A. Check for Alarms
    bool alarmRinging = false;
    int ringingSlot = -1;
    for(int i=0; i<4; i++) {
       if(alarmHours[i] == h && alarmMinutes[i] == m && timeinfo.tm_sec < 10) {
         alarmRinging = true;
         ringingSlot = i + 1;
       }
    }

    // B. Update Location over BLE (Every 5 seconds to save battery/bandwidth)
    if(millis() - lastGPSUpdate > 5000 && deviceConnected && gps.location.isValid()) {
      lastGPSUpdate = millis();
      char locData[30];
      sprintf(locData, "%.6f,%.6f", gps.location.lat(), gps.location.lng());
      pGPSChar->setValue(locData);
      pGPSChar->notify();
    }

    // C. LCD Display Logic
    if(alarmRinging) {
      lcd.setCursor(0, 0); lcd.print("!! ALARM !!     ");
      lcd.setCursor(0, 1); lcd.print("Take Slot "); lcd.print(ringingSlot);
      // Here you would also buzz a buzzer if you had one connected
    } else {
      lcd.setCursor(0, 0);
      deviceConnected ? lcd.print("BT: Connected   ") : lcd.print("BT: Searching...");
      
      lcd.setCursor(0, 1);
      lcd.print("Time: ");
      if(h<10) lcd.print("0"); lcd.print(h); lcd.print(":");
      if(m<10) lcd.print("0"); lcd.print(m);
      lcd.print("   ");
    }
  }
}