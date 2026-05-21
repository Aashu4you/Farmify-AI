import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import fetch from "node-fetch";
import Crop from "../models/Crop.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export const chat = async (req, res) => {
  try {
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return res.status(500).json({ message: "GROQ_API_KEY not set in .env" });
    }

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "Messages array is required" });
    }

    // Fetch user's crops for context
    let cropContext = "";
    try {
      const crops = await Crop.find({ user: req.user.id });
      if (crops.length > 0) {
        cropContext = `\n\nFARMER'S CURRENT CROPS:\n` + crops.map(c =>
          `- ${c.name} in ${c.field}: Stage=${c.stage}, Health=${c.health}%, Days to harvest=${c.daysLeft}, Soil=${c.soilType}, Irrigation=${c.irrigationType}`
        ).join("\n");
      }
    } catch (_) {
      // Crop context is optional — continue without it
    }

    const systemPrompt = `You are Farmify AI, an expert agricultural assistant for Indian farmers. You provide practical, actionable advice on:
- Crop management, growth stages, and best practices
- Soil health, fertilizers, and nutrient management  
- Disease and pest identification and treatment
- Irrigation scheduling and water management
- Weather-based farming decisions
- Harvest timing and post-harvest handling
- Market and crop selection advice for Indian conditions

Keep answers clear, concise, and actionable. Use simple language suitable for farmers. Reference Indian crops, seasons (Kharif/Rabi/Zaid), and local practices. Use emojis sparingly for readability.${cropContext}`;

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("[chat] Groq error:", errText);
      return res.status(502).json({ message: "AI service error. Please try again." });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I could not generate a response. Please try again.";

    res.status(200).json({ reply });
  } catch (error) {
    console.error("[chat] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};