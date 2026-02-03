#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Set the LCD address (0x27 or 0x3F)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// --- CONFIGURATION ---
const int sensorCount = 6;

// INPUT PINS (Sensors)
// Matches your current wiring: 13, 12, 14, 27, 26, 25
const int sensorPins[sensorCount] = {13, 12, 14, 27, 26, 25};

// OUTPUT PINS (LEDs)
// New wiring: 15, 2, 4, 16, 17, 5
const int ledPins[sensorCount] = {15, 2, 4, 16, 17, 5};

void setup() {
  // 1. Initialize LCD
  Wire.begin(21, 22);
  lcd.init();
  lcd.backlight();
  
  // 2. Initialize Pins Loop
  for (int i = 0; i < sensorCount; i++) {
    // Setup Sensor Pins
    // INPUT_PULLUP prevents false alarms when nothing is connected
    pinMode(sensorPins[i], INPUT_PULLUP);
    
    // Setup LED Pins
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW); // Ensure LEDs start OFF
  }

  // Startup Animation
  lcd.setCursor(0, 0);
  lcd.print("System Boot...");
  delay(1000);
  lcd.clear();
}

void loop() {
  bool objectDetected = false;

  for (int i = 0; i < sensorCount; i++) {
    // Check if Sensor is TRIGGERED (LOW = Object Detected)
    if (digitalRead(sensorPins[i]) == LOW) {
      
      // 1. Turn ON the matching LED
      digitalWrite(ledPins[i], HIGH);
      
      // 2. Update LCD
      lcd.setCursor(0, 0);
      lcd.print("Target Detected!");
      
      lcd.setCursor(0, 1);
      lcd.print("Sensor: ");
      lcd.print(i + 1); // Print 1 instead of 0
      lcd.print(" (LED ON)");
      
      objectDetected = true;
      
    } else {
      // If sensor is NOT triggered, ensure LED is OFF
      digitalWrite(ledPins[i], LOW);
    }
  }

  // If NO sensors are active, show "Scanning"
  if (!objectDetected) {
    lcd.setCursor(0, 0);
    lcd.print("Scanning...     ");
    lcd.setCursor(0, 1);
    lcd.print("Area Clear      ");
  }
  
  delay(50); // Small delay for stability
}