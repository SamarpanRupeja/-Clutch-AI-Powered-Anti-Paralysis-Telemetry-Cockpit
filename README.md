<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>


# 🚀 Clutch: AI-Powered Anti-Paralysis Telemetry Cockpit

**Clutch** is an intelligent, full-stack intervention platform designed to shatter cognitive paralysis and procrastination loops. By translating unstructured, high-stress user "panic streams" into structured, prioritized tasks, Clutch provides immediate local sensory feedback and escalates critical bottlenecks directly to the user's physical device via real-time SMS.

---

## 🛠️ Core Features

* **🎙️ Unstructured Panic Stream Triage:** Users speak or type their raw, overwhelming thoughts. An integrated **Gemini AI Core** tokenizes the stream, isolates the core blocking task, and calculates a real-time urgency/stress score ($0$ to $100$) based on deadline proximity and text sentiment.
* **🔊 Web Audio Sonar Intercept:** For high-severity blocks, the frontend instantiates a native **Web Audio API** oscillator loop. It fires a rhythmic 7-second audio sonar pulse designed to break the immediate cognitive paralysis cycle using local sensory disruption.
* **📲 Off-Site Omnichannel SMS Escalation:** When a crisis stream breaches a threshold score of **85 or higher**, the backend triggers an automated **Twilio SMS Gateway** protocol. It bypasses the computer screen to deliver an immediate, un-ignorable emergency text alert directly to the user's physical phone.
* **🛰️ Real-Time Chaos History Telemetry:** A state-driven historical logging hub built into the dashboard. It records an immutable timeline of past interventions, parsing timestamps, raw inputs, extracted tasks, and color-coding priority metrics for deep trend tracking.

---

## 🏗️ Technical Architecture & Stack

[ Vite + React Frontend ] ──( Voice/Text Panic Stream )──> [ Express Server (server.ts) ]
│                                                               │
├──> Web Audio API (7s Sonar Pulse)                             ├──> Gemini AI Engine
└──> Chaos History Telemetry Log      
└──> Twilio SMS Gateway
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React.js, Vite, TypeScript | High-performance user cockpit & state management |
| **Backend Framework** | Node.js, Express.js | Stateless routing engine & external service API hub |
| **AI Processing** | Google Gemini API | Natural Language Processing & threat evaluation |
| **Database Ecosystem** | Firebase / Cloud Firestore | Secure storage of authenticated user phone profiles |
| **Communications Gateway** | Twilio Messaging SDK | Real-world telecom fallback routing |

---

## 🔑 Environment Configuration

To run this full-stack engine locally, create a `.env` file in your root folder and populate it with your infrastructure access keys:

```env
# Twilio Communications Gateway
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_rented_twilio_number

# Multi-User Testing Fallbacks
TEST_RECEIVER_NUMBER=your_personal_mobile_number_with_country_code
```
## ⚡ Quick Start

### 1. Install Dependencies
Run the installation script from the project root directory to configure all backend and frontend packages simultaneously:
```bash
npm install
