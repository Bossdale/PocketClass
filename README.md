# 📚 PocketClass

### Your AI Tutor, Always With You

**Developed by Team A.I.Con**

PocketClass is an **offline-first AI-powered mobile learning platform** designed to help secondary school students continue learning even without internet access. The system transforms a smartphone into a **complete AI learning companion**, providing curriculum-aligned lessons, adaptive quizzes, diagnostic assessments, AI tutor explanations, and progress tracking directly on the device.

Unlike most educational platforms that require constant internet connectivity, **PocketClass operates entirely offline after installation**, allowing students in rural communities, low-income households, or areas with unreliable internet access to receive **personalized education anytime and anywhere**.

---

# 🎥 Demo Video

Watch the full demonstration of PocketClass.

👉 **Click Demo Video Link:**
[`YOUR_VIDEO_LINK`](https://www.youtube.com/watch?v=PFJBk2GVuXU&feature=youtu.be)

---

# 📄 Project Report

The **full research and technical documentation** for PocketClass is included in this repository.

📎 **File:**
[`PocketClass_Project_Report.pdf`](https://drive.google.com/file/d/1QHZ4YsfNujZ2sBSmFwHbzAoZl2Y8B4ey/view?usp=sharing)

The report includes:

* Background of the study
* Literature review
* System methodology
* Technical architecture
* Performance validation
* Educational impact analysis

---

# 🚀 How to Try the Prototype (Using Expo Go)

You don't need to be a developer to test PocketClass! You can easily run the prototype on your own Android or iOS device using the *Expo Go* app. 

### Step 1: Prepare Your Phone
1. Download the *Expo Go* app from the [Apple App Store](https://apps.apple.com/us/app/expo-go/id982107779) (iOS) or [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) (Android).
2. Ensure your phone and your computer are connected to the *exact same Wi-Fi network*.

### Step 2: Start the App on Your Computer
Open your computer's terminal (Command Prompt/Mac Terminal), and run the following commands:

```bash
# 1. Clone the repository to your computer
git clone frontend
cd pocketclass

# 2. Install the required files
npm install

# 3. Start the application server
npx expo start
```bash

# 🌏 Project Overview

**PocketClass** is an **AI-powered mobile learning platform designed to work completely offline**, allowing secondary school students to access personalized education even without internet connectivity.

The platform transforms a student's smartphone into a **fully functional AI tutor**, providing:

* 📖 Curriculum-aligned lessons
* 🧠 AI-generated quizzes
* 📊 Adaptive learning diagnostics
* 🎓 Personalized study plans
* 💬 AI tutor explanations
* 📈 Progress tracking

All learning materials, AI responses, and student progress are stored **directly on the device**, allowing the system to operate **without cloud servers, internet access, or data costs**.

PocketClass specifically targets students in **low-connectivity regions across Southeast Asia**, helping bridge the **digital divide in education**.

---

# 🎯 Sustainable Development Goal

PocketClass supports the **United Nations Sustainable Development Goal 4 (Quality Education)**.

**Goal:** Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.

By removing connectivity barriers and enabling offline AI learning, PocketClass helps make education accessible to students who would otherwise be excluded from digital learning platforms.

---

# 🚀 Key Features

### 📱 Offline-First Architecture

PocketClass operates entirely on the student’s device. Once installed, all lessons, quizzes, AI explanations, and progress tracking work **without internet connectivity**.

### 🧠 AI Tutor

The system integrates a **locally running AI model (Gemma 2B)** that provides explanations, tutoring, and learning support directly on the device.

### 📊 Adaptive Learning

Students take a **diagnostic assessment** that identifies knowledge gaps and generates a **personalized study plan**.

### 📝 Smart Assessments

Each lesson contains **Easy–Medium–Hard quizzes** that adapt based on the student’s performance.

### 📈 Progress Tracking

Students can monitor their learning progress using **mastery scores, dashboards, and quarterly performance charts**.

### 🌍 Multi-Country Curriculum Support

PocketClass aims to align with public schools curricula including to further minimize digital divide

---

# 🏗 System Architecture

PocketClass uses a **client-only architecture**, meaning the entire system runs locally on the smartphone.

**Key design principles**

* Offline-first design
* No backend server
* No cloud database
* No API dependency
* On-device AI inference

This architecture ensures the platform works even in **remote areas with no connectivity**.

---

# 🛠 Tech Stack

### Mobile Development

* React Native
* Expo SDK
* TypeScript
* NativeWind (Tailwind for React Native)

### AI System

* Google **Gemma 2B**
* **Ollama** local inference
* Prompt engineering with structured JSON outputs

### Data Storage

* SQLLite (local device database)

### Additional Tools

* Expo Speech (Text-to-Speech)
* React Native SVG
* Lucide Icons

---

# 📊 Validation Results

PocketClass was tested through **technical validation and simulated learning scenarios**.

| Category                     | Result           |
| ---------------------------- | ---------------- |
| Offline functionality        | 100% operational |
| AI explanation accuracy      | 96% correct      |
| Model size                   | ~1.5GB           |
| Minimum device compatibility | 2GB–4GB RAM      |
| Quiz generation time         | ~4 seconds       |
| Server cost                  | ₱0               |

The results demonstrate that **AI-powered personalized learning is feasible entirely offline**.
