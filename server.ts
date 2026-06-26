/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Load environment variables
dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required defined in user Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON payloads
  app.use(express.json());

  // Ingestion Parser API Route
  app.post("/api/parse", async (req, res) => {
    try {
      const { rawInput, referenceTime, calendarConstraints } = req.body;
      
      if (!rawInput || typeof rawInput !== 'string') {
        res.status(400).json({ error: "Missing or invalid rawInput text string." });
        return;
      }

      const refTime = referenceTime || new Date().toISOString();
      const calendarContext = calendarConstraints ? `\nFixed Calendar Constraints:\n${JSON.stringify(calendarConstraints, null, 2)}\n` : '';
      const ai = getGemini();

      const prompt = `You are the Clutch AI Core, an advanced mission controller for deadline survival.
We need you to analyze and structure user text details into a concrete, action-oriented task payload.

Unstructured Raw Input: "${rawInput}"
Reference Calculation Time: ${refTime} (CRITICAL: The user is in India Standard Time (IST, UTC+5:30). Calculate ALL relative references, dates, and times relative to this timing in IST!).${calendarContext}

Tasks to accomplish:
1. Synthesize a concise, military-minimalist, high-impact mission "title".
2. Parse or calculate an exact ISO-8601 "deadline" string. Relative dates like "tomorrow", "next Monday", "in 4 hours" must be solved with absolute mathematical accuracy against the Reference Calculation Time (${refTime}). If no hour is stated, map it to 23:59:59 of that target day.
3. Calibrate a numeric "priority_score" integer (range 1 - 100) using the following priority triage metric:
   - 90-100: Deadline in < 6 hours. Catastrophic, irreversible damage if missed.
   - 75-89: Deadline in < 24 hours. Extreme pressure, triage required.
   - 50-74: Deadline in 2-3 days. Active operational risk.
   - < 50: Over 3 days out or low consequences.
4. Extract a high-density "context_summary" string detailing who, what, why, and any constraints from the raw input.
5. Create a "checklist" containing 3 to 5 atomic checklist action items representing intermediate steps the user must perform to make the deadline.
6. Outline a "planning_strategy" of 3 high-impact, actionable, bulleted cheat sheet tips to combat delay, bypass roadblocks, and complete the mission successfully.
7. Generate "starter_code", a custom starter material block. If the task is programming related, output literal source code. If it is a writing/presentation task, output an outline or draft markdown. Match it specifically to the raw input scenario.
8. Actively compare the extracted deadline against the fixed calendar constraints array. Generate a custom "collision_warning" string if the user's deadline overlaps or leaves less than a 2-hour window right before a fixed calendar commitment. If there is no conflict, output an empty string or omit.

Maintain absolute professionalism. Do not add any conversational chat prefixes or suffixes. Output only the structured JSON result.`;

      let response;
      let retries = 5; // Use 5 retries to handle 503 during high demand
      
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { 
                    type: Type.STRING, 
                    description: "Concise, high-impact military title for the task." 
                  },
                  deadline: { 
                    type: Type.STRING, 
                    description: "ISO-8601 timestamp string calculated from input text and the reference time." 
                  },
                  priority_score: { 
                    type: Type.INTEGER, 
                    description: "Calculated task priority score from 1 to 100." 
                  },
                  context_summary: { 
                    type: Type.STRING, 
                    description: "A bulleted executive style summary overview of the task's context." 
                  },
                  checklist: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 to 5 granular actionable checkbox items to complete the task."
                  },
                  planning_strategy: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "3 highly targeted combat advice lines to beat procrastination on this task."
                  },
                  starter_code: {
                    type: Type.STRING,
                    description: "Custom starter material (markdown, document outline, or code snippet)."
                  },
                  collision_warning: {
                    type: Type.STRING,
                    description: "Warning message if the deadline overlaps or causes a scheduling collision with the provided calendar constraints. Empty string if no conflict."
                  }
                },
                required: ["title", "deadline", "priority_score", "context_summary", "checklist", "planning_strategy", "starter_code"]
              }
            }
          });
          break;
        } catch (e: any) {
          if (retries > 1) {
            retries--;
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } else {
            throw e;
          }
        }
      }

      if (!response) {
        throw new Error("Failed to generate content after retries.");
      }

      const text = response.text;
      if (!text) {
        res.status(500).json({ error: "Failed to fetch response content from Gemini core." });
        return;
      }

      let cleanText = text.trim();
      if (cleanText.startsWith("```json")) {
        cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      const parsedJSON = JSON.parse(cleanText);
      res.json(parsedJSON);
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to parse operational parameters with Gemini AI.",
        details: error?.message || String(error)
      });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const { taskTitle, urgencyScore, phoneNumber, emailAddress, checklist } = req.body;

      // Enforce an explicit urgency threshold gate
      if (urgencyScore < 85) {
        res.json({ message: "Task urgency level sits below escalation criteria." });
        return;
      }

      console.log(`[ALERTS ROUTER] Initializing parallel broadcast for task: "${taskTitle}"`);

      // 1. PIPELINE A: Outbound SMS via Twilio API HTTP Request
      let smsPromise = Promise.resolve({ channel: 'SMS', success: false, data: 'No valid phone number provided' });
      if (phoneNumber && phoneNumber.trim() !== '') {
        smsPromise = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              Body: `[🚨 CLUTCH CRITICAL INTERVENTION]: Zero-action paralysis detected! Task: "${taskTitle}". Check your workspace immediately.`,
              To: phoneNumber,
              From: process.env.TWILIO_PHONE_NUMBER || ''
            })
          }
        ).then(res => res.json().then(data => {
          if (!res.ok) {
            if (data?.code === 21608) {
              console.error("[TWILIO SMS] Blocked by Twilio Trial limitations: The recipient phone number must be verified on your Twilio account.");
            } else {
              console.error("[TWILIO SMS ERROR]", data);
            }
          }
          return { channel: 'SMS', success: res.ok, data };
        })).catch(err => {
          console.error("[TWILIO SMS EXCEPTION]", err.message);
          return { channel: 'SMS', success: false, data: err.message };
        }) : Promise.resolve({ channel: 'SMS', success: false, data: 'Twilio credentials missing' });
      }

      // 2. PIPELINE B: Outbound Rich HTML Email via Secure SMTP Relay
      let emailPromise = Promise.resolve({ channel: 'Email', success: false, data: 'SMTP credentials missing' });
      if (process.env.SMTP_HOST || process.env.SMTP_USER) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.resend.com',
          port: Number(process.env.SMTP_PORT) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        emailPromise = transporter.sendMail({
          from: '"Clutch Anti-Paralysis System" <alerts@yourdomain.com>',
          to: emailAddress,
          subject: `[🚨 EMERGENCY INTERVENTION ENGAGED] - ${taskTitle}`,
          html: `
            <div style="font-family: monospace; background-color: #09090b; color: #f4f4f5; padding: 24px; border-radius: 8px;">
              <h2 style="color: #ef4444; border-bottom: 1px solid #27272a; padding-bottom: 12px;">>_ CLUTCH EMERGENCY OVERRIDE ACTIVE</h2>
              <p>Your cognitive engine has identified extreme risk for task: <strong>${taskTitle}</strong>.</p>
              <p>To bypass friction, here are your immediate structural action items:</p>
              <ul style="line-height: 1.6;">
                ${(checklist || []).map((item: string) => `<li style="margin-bottom: 8px; color: #fbbf24;">[ ] ${item}</li>`).join('')}
              </ul>
              <p style="color: #71717a; margin-top: 24px; font-size: 12px;">System generated timestamp: ${new Date().toISOString()}</p>
            </div>
          `
        }).then(data => ({ channel: 'Email', success: true, data }))
          .catch(err => ({ channel: 'Email', success: false, data: err.message }));
      }

      // Execute all external network delivery handshakes asynchronously in parallel
      const broadcastResults = await Promise.all([smsPromise, emailPromise]);
      
      res.json({
        success: true,
        status: "Omnichannel broadcast cycle concluded.",
        results: broadcastResults
      });

    } catch (error: any) {
      console.error("[GATEWAY ERROR]", error);
      res.status(500).json(
        { success: false, error: "Internal dispatch pipeline rupture.", details: error.message }
      );
    }
  });

  // Client-Side Dev Middleware Hook (Vite)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clutch cockpit online and transmitting on http://localhost:${PORT}`);
  });
}

startServer();
