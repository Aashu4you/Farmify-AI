import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import Task from "../models/Task.js";
import Crop from "../models/Crop.js";
import fetch from "node-fetch";

// ── GET /api/tasks ─────────────────────────────────────────────────────────────
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ date: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/tasks ────────────────────────────────────────────────────────────
export const addTask = async (req, res) => {
  try {
    const { title, type, date, time, field, crop, notes, priority } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required" });
    }

    const task = await Task.create({
      user: req.user.id,
      title, type, date, time, field, crop, notes, priority,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/tasks/:id ─────────────────────────────────────────────────────────
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found or not authorised" });
    }

    const wasDone = task.done;

    const fields = ["title", "type", "date", "time", "field", "crop", "notes", "priority", "done"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) task[f] = req.body[f];
    });

    const updated = await task.save();

    // ── Update crop health when task is marked done ───────────────────────────
    const justCompleted = !wasDone && updated.done;
    let cropHealthUpdate = null;

    if (justCompleted && updated.crop) {
      // Health boost per task type
      const HEALTH_BOOST = {
        irrigation: 3,
        fertilizer: 5,
        spray:      8,
        pruning:    3,
        soil:       2,
        harvest:    0,
        other:      1,
      };

      const boost = HEALTH_BOOST[updated.type] ?? 1;

      if (boost > 0) {
        // Find matching crop by name (case-insensitive) for this user
        const matchingCrop = await Crop.findOne({
          user: req.user.id,
          name: { $regex: new RegExp(`^${updated.crop.trim()}$`, "i") },
        });

        if (matchingCrop) {
          const newHealth = Math.min(100, matchingCrop.health + boost);
          matchingCrop.health = newHealth;
          await matchingCrop.save();
          cropHealthUpdate = {
            cropId:   matchingCrop._id,
            cropName: matchingCrop.name,
            oldHealth: matchingCrop.health - boost < 0 ? 0 : matchingCrop.health - boost,
            newHealth,
            boost,
          };
        }
      }
    }

    res.status(200).json({ task: updated, cropHealthUpdate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE /api/tasks/:id ──────────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found or not authorised" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/tasks/recommendations ────────────────────────────────────────────
export const getRecommendations = async (req, res) => {
  try {
    // Fetch user's crops
    const crops = await Crop.find({ user: req.user.id });

    if (crops.length === 0) {
      return res.status(200).json({
        recommendations: [],
        message: "Add crops first to get personalized recommendations.",
      });
    }

    // Fetch weather if lat/lon provided
    let weatherSummary = "Weather data unavailable.";
    const { lat, lon } = req.query;

    if (lat && lon && process.env.OPENWEATHER_API_KEY) {
      try {
        const wRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=16&appid=${process.env.OPENWEATHER_API_KEY}`
        );
        const wData = await wRes.json();

        if (wData.list) {
          const days = wData.list.filter((_, i) => i % 2 === 0).slice(0, 5);
          weatherSummary = days.map((d) => {
            const date = new Date(d.dt * 1000).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
            return `${date}: ${d.weather[0].main}, ${Math.round(d.main.temp)}°C, Rain prob: ${Math.round((d.pop || 0) * 100)}%, Humidity: ${d.main.humidity}%`;
          }).join("\n");
        }
      } catch (_) {
        weatherSummary = "Weather data could not be fetched.";
      }
    }

    // Build crop summary
    const cropSummary = crops.map((c) =>
      `- ${c.name} in ${c.field} (${c.area}): Stage=${c.stage}, Health=${c.health}%, Days to harvest=${c.daysLeft}, Soil=${c.soilType}, Irrigation=${c.irrigationType}`
    ).join("\n");

    // Today's date for context
    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    // Build prompt
    const prompt = `You are an expert Indian agricultural advisor. Today is ${today}.

FARMER'S CROPS:
${cropSummary}

WEATHER FORECAST (next 5 days):
${weatherSummary}

Generate exactly 6 actionable farm task recommendations specific to the crops listed.

Respond ONLY with a valid JSON array, no markdown, no explanation:
[
  {
    "title": "specific task title",
    "type": "irrigation|fertilizer|spray|harvest|soil|pruning|other",
    "priority": "high|medium|low",
    "daysFromNow": 0,
    "time": "HH:MM",
    "crop": "crop name or empty string",
    "field": "field name or empty string",
    "reason": "one sentence explaining why this task is recommended"
  }
]

Rules:
- daysFromNow must be 0-7 (0 = today)
- time must be 24h format like 06:00 or 16:00
- Make tasks specific to the actual crops and weather
- If rain is coming suggest spraying or fertilizing before it
- If health is low prioritize disease or pest treatment
- If daysLeft is under 20 suggest harvest preparation
- Consider soil type and irrigation type for irrigation tasks`;

    // Call Groq API
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) throw new Error("GROQ_API_KEY not set in .env");

    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are an expert Indian agricultural advisor. Always respond with valid JSON only — no markdown, no explanation, just the raw JSON array.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      }
    );

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error("Groq API error: " + groqRes.status + " " + errText);
    }

    const groqData = await groqRes.json();
    const rawText = groqData.choices?.[0]?.message?.content || "[]";

    // Parse JSON safely
    let recommendations = [];
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      // Add actual dates and format for frontend
      const now = new Date();
      recommendations = parsed.map((r) => {
        const taskDate = new Date(now);
        taskDate.setDate(taskDate.getDate() + (r.daysFromNow || 0));
        return {
          title:    r.title,
          type:     r.type || "other",
          priority: r.priority || "medium",
          date:     taskDate.toISOString(),
          time:     r.time || "08:00",
          crop:     r.crop || "",
          field:    r.field || "",
          reason:   r.reason || "",
          isRecommendation: true,
        };
      });
    } catch (_) {
      recommendations = [];
    }

    res.status(200).json({ recommendations });
  } catch (error) {
    console.error("[recommendations]", error.message);
    res.status(500).json({ message: error.message, recommendations: [] });
  }
};