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

## 📋 System Prerequisites

Before initiating the deployment lifecycle, ensure your local environment contains the following system binaries and software accounts:

*   **Node.js:** Runtimes `>= v18.0.0` (LTS highly recommended)
*   **Package Manager:** `npm` (bundled natively with Node.js)
*   **Twilio Developer Account:** A free trial or upgraded account with a provisioned virtual phone number.
*   **Google AI Studio Account:** Access credentials to retrieve an active Gemini API orchestration key.

---
## 🔧 Step-by-Step Installation & Provisioning

Follow this linear workflow to clone, configure, and initialize the application architecture from scratch.

### Step 1: Clone the Repository Registry
Clone the code workspace to your local system and change your current active shell directory to the repository folder:
```bash
git clone [https://github.com/Samarpan/clutch.git](https://github.com/Samarpan/clutch.git)
cd clutch
```
---

### Step 2: Provision Infrastructure Environment Secret Keys
Create a secure .env file directly inside the root folder (the single-root directory containing your server.ts and package.json configurations).

```bash
touch .env
```
Open the .env file in your preferred text editor and append the following configuration parameters, replacing the placeholder labels with your real cloud credentials:

# Server Runtime Port Configurations
PORT=5000

# Google Gemini API Orchestration Key
GEMINI_API_KEY=AIzaSyYourActualGeminiAPIKeyHere

# Twilio Telecommunications Infrastructure Configuration
TWILIO_ACCOUNT_SID=ACyour_unique_twilio_account_sid_string
TWILIO_AUTH_TOKEN=your_secret_twilio_auth_token_string
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX

# Sandboxed Target Terminal Fallbacks (For Trial Account Compliance)
TEST_RECEIVER_NUMBER=+91XXXXXXXXXX

## ⚠️ Critical Verification Safeguard (Twilio Error 21608):
While using a free Twilio developer trial sandbox, the Twilio gateway will strictly block SMS delivery to random devices. To verify multi-user dynamic profiles or use a classmate's number for testing, you must go to Twilio Console ➔ Develop ➔ Phone Numbers ➔ Manage ➔ Verified Caller IDs and add the destination phone number to your whitelist first.

---

### Step 3: Install Package Dependencies
Compile and mount all shared frontend visual frameworks, server environments, and native cloud software development kits (SDKs) required by the ecosystem:

```bash
npm install
```
---

### Step 4: Run Isolated Protocol Unit Tests (Optional Verification)
Before scaling up the live graphical servers, execute the pre-configured integration unit scripts to guarantee your cloud communication pipelines are communicating cleanly:

```bash
# Test the Twilio Outbound Cell Network Dispatch Flow
npx ts-node test-twilio.ts

# Test the Gemini AI Triage Extraction Capabilities
npx ts-node test-api.ts
```
---

### Step 5: Launch the Consolidated Full-Stack Application
Boot the unified workspace concurrent script pipeline. This concurrently initializes the Express API server routing engine on your configured port and mounts the hot-reloading Vite frontend application sandbox:

```bash
npm run dev
```

Once the terminal outputs confirm compilation, open your browser and navigate to the local hosting interface sandbox:
```
Local Client App View: http://localhost:5173
Local Server Gateway:   http://localhost:5000
```
---
# 🧪 Simulating a Production Crisis Overlap
To evaluate the full, reactive lifecycle capability of the application during your live hackathon evaluation run, execute the following steps:

1. Open the web platform view at http://localhost:5173 and click [ INITIALIZE CLUTCH ENGINE ] to activate the system listeners.

2. Navigate to the primary Chaos Stream Input console.

3. Input a high-urgency paralysis scenario (e.g., "I have a critical backend data science operating systems exam tomorrow morning at 9 AM and I am stuck spinning in circles instead of starting chapter three!").

4. Click Process Panic Stream.

5. Observe the Immediate Dual-Action Response:<br><br>
   -> Local Level: The Web Audio API triggers a rhythmic pulse through your audio hardware to interrupt immediate task avoidance.

   -> Cloud Level: The Gemini core catches the input, parses out the exam task, grades the priority score well past 85, and commands Twilio to drop a high-priority intervention text message straight onto your real-world mobile device.

   -> Telemetry Level: The tracking card instantly materializes at the top of your Chaos History log panel with an active timestamp.
# 🛠️ Troubleshooting & Debugging Matrix
-> Port 5000 Already in Use: If your environment throws an address conflict error, alter the PORT key inside your .env file to another variable (e.g., PORT=8080) and your system configuration will adjust dynamically.

-> SMS Status Flipped to 'Pending' but No Text Received: Double-check that you included the explicit absolute country code configuration prefix (e.g., +91 for India, +1 for US) directly inside your profile and .env variables.

-> Vite Render Blank / Environment Variable Failures: Ensure you do not mix up frontend and backend variables. Secure infrastructure keys like your Twilio tokens must remain exclusively on the server layer inside .env to prevent credential exposure.
