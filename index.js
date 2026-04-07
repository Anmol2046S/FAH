/**
 * FAH AI — Smart Food Tracking & Behavior Modification Engine
 * Backend: Node.js + Express
 * Cloud: Google Cloud Run Ready
 * AI: Simulated LLM with real Vertex AI hook points
 */

"use strict";

require("dotenv").config();

const express      = require("express");
const cors         = require("cors");
const helmet       = require("helmet");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");
const { v4: uuidv4 } = require("uuid");

/* ─────────────────────────────────────────────
   Optional: Firebase Admin (Firestore logging)
   Set GOOGLE_APPLICATION_CREDENTIALS or use
   Application Default Credentials on Cloud Run.
───────────────────────────────────────────── */
let db = null;
try {
  const admin = require("firebase-admin");
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  db = admin.firestore();
  console.log("✅ Firestore connected");
} catch (e) {
  console.warn("⚠️  Firestore unavailable — running without persistence:", e.message);
}

/* ─────────────────────────────────────────────
   App Bootstrap
───────────────────────────────────────────── */
const app  = express();
const PORT = process.env.PORT || 8080;

/* ─────────────────────────────────────────────
   Middleware Stack
───────────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "1mb" }));
app.use(morgan("combined"));

/* Global rate limiter — 60 requests / minute per IP */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});
app.use(globalLimiter);

/* Stricter limiter for the AI endpoint — 20 req / min */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI analysis rate limit reached. Try again in a minute." },
});

/* ─────────────────────────────────────────────
   FIRESTORE SCHEMA
   Collection: food_logs
   Document fields:
     id          : string  (uuid)
     user_id     : string  (future auth hook)
     timestamp   : Timestamp
     food_name   : string
     calories    : number
     health_score: number  (0-10)
     smart_nudge : string
     nudge_type  : "positive" | "negative"
     raw_input   : string  (original user text)
───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   FOOD KNOWLEDGE BASE
   A rich, curated dataset that drives the
   simulated LLM logic and mirrors what a real
   Vertex AI / GPT call would return.
───────────────────────────────────────────── */
const FOOD_KNOWLEDGE_BASE = {
  // ── HEALTHY ────────────────────────────────
  "apple":           { calories: 95,  health_score: 9, category: "fruit"     },
  "banana":          { calories: 105, health_score: 8, category: "fruit"     },
  "blueberries":     { calories: 84,  health_score: 9, category: "fruit"     },
  "strawberries":    { calories: 49,  health_score: 9, category: "fruit"     },
  "orange":          { calories: 62,  health_score: 9, category: "fruit"     },
  "mango":           { calories: 99,  health_score: 8, category: "fruit"     },
  "watermelon":      { calories: 86,  health_score: 8, category: "fruit"     },
  "grapes":          { calories: 104, health_score: 7, category: "fruit"     },
  "avocado":         { calories: 240, health_score: 9, category: "healthy_fat"},
  "spinach":         { calories: 23,  health_score: 10,category: "vegetable" },
  "broccoli":        { calories: 55,  health_score: 10,category: "vegetable" },
  "kale":            { calories: 49,  health_score: 10,category: "vegetable" },
  "salad":           { calories: 70,  health_score: 9, category: "vegetable" },
  "carrot":          { calories: 52,  health_score: 9, category: "vegetable" },
  "sweet potato":    { calories: 103, health_score: 9, category: "vegetable" },
  "cucumber":        { calories: 16,  health_score: 9, category: "vegetable" },
  "tomato":          { calories: 22,  health_score: 9, category: "vegetable" },
  "salmon":          { calories: 208, health_score: 9, category: "protein"   },
  "chicken breast":  { calories: 165, health_score: 9, category: "protein"   },
  "tuna":            { calories: 142, health_score: 9, category: "protein"   },
  "eggs":            { calories: 78,  health_score: 8, category: "protein"   },
  "greek yogurt":    { calories: 100, health_score: 9, category: "dairy"     },
  "oatmeal":         { calories: 154, health_score: 9, category: "grain"     },
  "quinoa":          { calories: 222, health_score: 9, category: "grain"     },
  "brown rice":      { calories: 216, health_score: 8, category: "grain"     },
  "almonds":         { calories: 164, health_score: 9, category: "nuts"      },
  "walnuts":         { calories: 185, health_score: 9, category: "nuts"      },
  "lentils":         { calories: 230, health_score: 9, category: "legume"    },
  "black beans":     { calories: 227, health_score: 9, category: "legume"    },
  "chickpeas":       { calories: 269, health_score: 8, category: "legume"    },
  "green tea":       { calories: 2,   health_score: 10,category: "beverage"  },
  "water":           { calories: 0,   health_score: 10,category: "beverage"  },
  "smoothie":        { calories: 180, health_score: 8, category: "beverage"  },

  // ── MODERATE ───────────────────────────────
  "whole wheat bread":{ calories: 69, health_score: 6, category: "grain"    },
  "white rice":      { calories: 206, health_score: 5, category: "grain"    },
  "pasta":           { calories: 220, health_score: 5, category: "grain"    },
  "cheese":          { calories: 113, health_score: 5, category: "dairy"    },
  "milk":            { calories: 149, health_score: 6, category: "dairy"    },
  "coffee":          { calories: 5,   health_score: 6, category: "beverage" },
  "orange juice":    { calories: 111, health_score: 5, category: "beverage" },
  "peanut butter":   { calories: 188, health_score: 6, category: "nuts"     },
  "popcorn":         { calories: 107, health_score: 5, category: "snack"    },

  // ── UNHEALTHY ──────────────────────────────
  "pizza":           { calories: 285, health_score: 3, category: "junk"     },
  "burger":          { calories: 354, health_score: 2, category: "junk"     },
  "hamburger":       { calories: 354, health_score: 2, category: "junk"     },
  "cheeseburger":    { calories: 400, health_score: 1, category: "junk"     },
  "hot dog":         { calories: 290, health_score: 2, category: "junk"     },
  "french fries":    { calories: 365, health_score: 1, category: "junk"     },
  "fries":           { calories: 365, health_score: 1, category: "junk"     },
  "fried chicken":   { calories: 320, health_score: 2, category: "junk"     },
  "chips":           { calories: 153, health_score: 2, category: "junk"     },
  "potato chips":    { calories: 153, health_score: 2, category: "junk"     },
  "soda":            { calories: 140, health_score: 1, category: "beverage" },
  "cola":            { calories: 140, health_score: 1, category: "beverage" },
  "energy drink":    { calories: 110, health_score: 1, category: "beverage" },
  "donut":           { calories: 253, health_score: 1, category: "dessert"  },
  "cake":            { calories: 350, health_score: 1, category: "dessert"  },
  "chocolate cake":  { calories: 380, health_score: 1, category: "dessert"  },
  "ice cream":       { calories: 273, health_score: 2, category: "dessert"  },
  "cookie":          { calories: 148, health_score: 2, category: "dessert"  },
  "cookies":         { calories: 148, health_score: 2, category: "dessert"  },
  "candy":           { calories: 150, health_score: 1, category: "dessert"  },
  "chocolate":       { calories: 155, health_score: 3, category: "dessert"  },
  "nachos":          { calories: 346, health_score: 2, category: "junk"     },
  "bacon":           { calories: 161, health_score: 2, category: "junk"     },
  "white bread":     { calories: 79,  health_score: 3, category: "grain"    },
  "ramen":           { calories: 380, health_score: 2, category: "junk"     },
  "instant noodles": { calories: 380, health_score: 2, category: "junk"     },
};

/* ─────────────────────────────────────────────
   NUDGE TEMPLATES
   Indexed by food category and nudge direction.
   A real LLM call would dynamically generate
   these — this simulates that output precisely.
───────────────────────────────────────────── */
const POSITIVE_NUDGES = {
  fruit: [
    "Fantastic choice! {food} is packed with natural antioxidants and fiber that feed your gut microbiome. The natural sugars here come with fiber, so you'll get sustained energy — no crash, just clean fuel for your brain.",
    "Love this! {food} delivers a powerful dose of vitamins and phytonutrients. Your immune system is literally thanking you right now. Keep stacking these wins!",
    "Perfect pick! The fiber in {food} will keep you full, regulate blood sugar, and your skin will glow from the inside out. This is what smart eating looks like.",
  ],
  vegetable: [
    "Elite choice! {food} is one of nature's most nutrient-dense foods. The micronutrients here activate hundreds of metabolic processes — you're literally feeding your DNA correctly.",
    "Outstanding! {food} is loaded with vitamins, minerals, and compounds that reduce inflammation. Every serving moves you closer to your healthiest self. You're crushing it!",
    "Yes! {food} is a longevity food — populations who eat it live longer and get sick less. Your body is running more efficiently with every bite. This habit compounds over time.",
  ],
  protein: [
    "Excellent protein source! {food} delivers high-quality amino acids that repair and build muscle, boost your metabolism, and keep you full for hours. Your body composition will thank you.",
    "Smart choice! {food} has a high satiety index — meaning you'll feel full longer and be less likely to reach for unhealthy snacks later. This is strategic eating at its best.",
    "Brilliant! The protein in {food} triggers muscle protein synthesis and keeps your metabolism elevated. You're making your body work for you, not against you.",
  ],
  healthy_fat: [
    "This is a power move! {food} is rich in monounsaturated fats and oleic acid — the same compound that gives olive oil its heart-protective superpowers. Your brain literally runs on fat like this.",
    "Incredible choice! The healthy fats in {food} boost the absorption of fat-soluble vitamins A, D, E & K from everything else you eat. You're not just eating well — you're eating *smart*.",
    "Love it! {food} contains compounds that reduce inflammation, lower bad cholesterol, and keep you feeling full. This is a cornerstone of the Mediterranean diet for a reason.",
  ],
  grain: [
    "Great choice! {food} provides complex carbohydrates that release energy slowly, keeping you focused and energized without any blood sugar spikes. Steady fuel for a steady mind.",
    "Smart! The fiber and B-vitamins in {food} support energy metabolism and gut health. This is the kind of carb that works *with* your body, not against it.",
  ],
  nuts: [
    "Excellent snack choice! {food} is a nutritional powerhouse — healthy fats, protein, and micronutrients like magnesium that help manage stress hormones. Snacking doesn't get smarter than this.",
    "A handful of {food} delivers more nutrition per calorie than almost any processed snack. Your heart, brain, and waistline all benefit. This is the snack of champions.",
  ],
  legume: [
    "This is one of the healthiest choices you can make! {food} is a rare food that's high in both protein *and* fiber — a combination that controls blood sugar, reduces cholesterol, and feeds healthy gut bacteria.",
    "Exceptional! {food} is literally in the diet of every Blue Zone population on Earth — the people who live past 100. You're eating for longevity right now.",
  ],
  dairy: [
    "Great choice! {food} provides probiotics and high-quality protein that support gut health and muscle recovery. Your microbiome diversity is improving with every serving.",
  ],
  beverage: [
    "Perfect hydration choice! {food} is exactly what your cells need. Proper hydration improves cognitive function by up to 30%, regulates body temperature, and flushes toxins. Stay consistent!",
    "Excellent! {food} is loaded with polyphenols and antioxidants that reduce inflammation and have been linked to improved focus and reduced disease risk. You're making liquid medicine.",
  ],
  default: [
    "Great choice! {food} is a solid, nutritious option that aligns with your health goals. Every positive food decision compounds — you're building a healthier version of yourself one meal at a time.",
  ],
};

const NEGATIVE_NUDGES = {
  junk: [
    "⚠️ Let's be real about {food}. This is high in refined carbs, sodium, and inflammatory fats. That energy rush you're feeling will crash hard in 60-90 minutes, leaving you foggy and craving more junk. It's a trap. Try **grilled chicken with sweet potato** instead — same satisfaction, no crash.",
    "🔴 {food} is engineered to override your body's fullness signals — that's why it's so hard to stop. The trans fats here promote inflammation and the sodium spikes blood pressure. Your future self is paying this bill. Swap it for a **protein-rich meal with complex carbs** and break the cycle today.",
    "⚠️ Heads up: {food} has very little nutritional return for its calorie cost. You're spending your calorie 'budget' on empty fuel. Within 2 hours, your blood sugar will crash and hunger will return stronger. Try **homemade alternatives or a fiber + protein combo** to actually satisfy hunger.",
  ],
  dessert: [
    "🔴 Warning: {food} is mostly refined sugar and saturated fat. That dopamine hit is real — but so is the crash. Excess sugar suppresses your immune system for hours and disrupts sleep quality. Consider **a handful of dark berries with a square of 85%+ dark chocolate** for the same craving with actual benefits.",
    "⚠️ {food} sends your blood sugar on a rollercoaster — a spike now, a crash at 3 PM, and carb cravings all afternoon. That cycle is hard to break. Try **Greek yogurt with honey and berries** — it tastes indulgent but fuels your body properly.",
    "🔴 The sugar in {food} feeds bad gut bacteria, spikes insulin, and triggers inflammation. Habitual consumption accelerates skin aging and energy depletion. Switch to **frozen banana 'nice cream'** or **medjool dates with nut butter** — naturally sweet, actually nutritious.",
  ],
  beverage: [
    "🔴 Critical warning: {food} delivers a massive sugar payload with zero nutritional value. A single serving can contain your entire recommended daily sugar intake. This directly promotes insulin resistance and weight gain. Switch to **sparkling water with citrus** or **unsweetened iced green tea** — you'll still feel refreshed, without the damage.",
    "⚠️ {food} is liquid sugar — it bypasses satiety signals, meaning your brain won't register these calories, but your fat cells absolutely will. Liquid calories are the silent saboteur of most diets. Hydrate with **water infused with cucumber and mint** instead.",
  ],
  grain: [
    "⚠️ {food} is made from refined flour that spikes blood sugar almost as fast as table sugar. It offers minimal fiber or nutrients. Swap it for **100% whole grain or sourdough** — you get the same satisfaction with a dramatically better metabolic response.",
  ],
  default: [
    "⚠️ {food} isn't the best choice for your goals. The nutritional profile here is working against your body. Consider swapping for a **whole food alternative** — more nutrients, better energy, and you'll feel the difference within days. You're capable of better, and your body knows it.",
  ],
};

/* ─────────────────────────────────────────────
   SIMULATED LLM ENGINE
   This function mirrors exactly what a call to
   Vertex AI (Gemini Pro) or OpenAI GPT-4 would
   return. Replace the body of this function
   with a real API call to go live.
───────────────────────────────────────────── */

/**
 * Fuzzy-match a food name against the knowledge base.
 * Handles partial matches (e.g., "pepperoni pizza" → "pizza").
 */
function matchFood(rawInput) {
  const input = rawInput.toLowerCase().trim();

  // Exact match first
  if (FOOD_KNOWLEDGE_BASE[input]) {
    return { key: input, data: FOOD_KNOWLEDGE_BASE[input] };
  }

  // Partial match — find the longest matching key within the input
  let bestMatch = null;
  let bestLength = 0;
  for (const key of Object.keys(FOOD_KNOWLEDGE_BASE)) {
    if (input.includes(key) && key.length > bestLength) {
      bestMatch = key;
      bestLength = key.length;
    }
  }

  if (bestMatch) {
    return { key: bestMatch, data: FOOD_KNOWLEDGE_BASE[bestMatch] };
  }

  return null;
}

/**
 * Pick a random item from an array.
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Core AI analysis function.
 * To integrate Vertex AI / Gemini:
 *   - Replace the logic below with a call to the Vertex AI SDK
 *   - Use the prompt template at the bottom of this function
 *   - Parse the structured JSON response from the model
 *
 * @param {string} foodInput  - Raw user input (e.g., "large pepperoni pizza")
 * @returns {Promise<object>} - Structured analysis result
 */
async function analyzeFoodWithLLM(foodInput) {
  const normalizedInput = foodInput.toLowerCase().trim();
  const matched = matchFood(normalizedInput);

  let foodName, calories, healthScore, category;

  if (matched) {
    // Known food — use knowledge base data
    foodName    = matched.key
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    calories    = matched.data.calories;
    healthScore = matched.data.health_score;
    category    = matched.data.category;
  } else {
    // Unknown food — generate plausible defaults based on descriptors
    foodName    = foodInput.trim().replace(/\b\w/g, c => c.toUpperCase());
    const isHealthyDescriptor = /salad|grilled|steamed|raw|fresh|baked|vegetable|fruit|soup|broth/i.test(foodInput);
    const isUnhealthyDescriptor = /fried|deep.fried|crispy|sugar|sweet|cream|loaded|triple|extra|cheese|bacon/i.test(foodInput);

    if (isHealthyDescriptor) {
      calories    = Math.floor(Math.random() * 150) + 80;
      healthScore = Math.floor(Math.random() * 3) + 6;
      category    = "vegetable";
    } else if (isUnhealthyDescriptor) {
      calories    = Math.floor(Math.random() * 300) + 250;
      healthScore = Math.floor(Math.random() * 3) + 1;
      category    = "junk";
    } else {
      calories    = Math.floor(Math.random() * 200) + 100;
      healthScore = Math.floor(Math.random() * 5) + 3;
      category    = "default";
    }
  }

  /* ── Nudge Generation ── */
  const nudgeType = healthScore >= 6 ? "positive" : "negative";
  const nudgeTemplates = nudgeType === "positive"
    ? (POSITIVE_NUDGES[category] || POSITIVE_NUDGES.default)
    : (NEGATIVE_NUDGES[category] || NEGATIVE_NUDGES.default);

  const nudgeTemplate = pick(nudgeTemplates);
  const smartNudge    = nudgeTemplate.replace(/\{food\}/g, foodName);

  /* ─────────────────────────────────────────
     VERTEX AI / GEMINI INTEGRATION HOOK
     Uncomment and configure to go live:

     const { VertexAI } = require("@google-cloud/vertexai");
     const vertexAI = new VertexAI({
       project: process.env.GOOGLE_CLOUD_PROJECT,
       location: "us-central1",
     });
     const model = vertexAI.getGenerativeModel({ model: "gemini-1.5-pro" });

     const prompt = `
       You are a precision nutrition AI and behavioral psychologist.
       Analyze the food item: "${foodInput}"

       Return ONLY valid JSON in this exact schema:
       {
         "food_name": "<cleaned proper name>",
         "calories": <integer per standard serving>,
         "health_score": <integer 1-10>,
         "smart_nudge": "<behavioral nudge string>",
         "nudge_type": "<positive|negative>"
       }

       Rules:
       - health_score >= 6 → nudge_type = "positive" (praise + benefits)
       - health_score < 6  → nudge_type = "negative" (warn + suggest alternative)
       - Nudges must be specific, emotionally resonant, and science-backed.
       - Keep nudge under 3 sentences. Be direct and actionable.
     `;

     const result  = await model.generateContent(prompt);
     const rawText = result.response.candidates[0].content.parts[0].text;
     const parsed  = JSON.parse(rawText.match(/\{[\s\S]*\}/)[0]);
     return parsed;
  ───────────────────────────────────────── */

  return {
    food_name:    foodName,
    calories:     calories,
    health_score: healthScore,
    smart_nudge:  smartNudge,
    nudge_type:   nudgeType,
  };
}

/* ─────────────────────────────────────────────
   ROUTES
───────────────────────────────────────────── */

/** Health check — required by Cloud Run */
app.get("/health", (_req, res) => {
  res.status(200).json({
    status:    "healthy",
    service:   "FAH AI Backend",
    version:   "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

/** Root */
app.get("/", (_req, res) => {
  res.status(200).json({
    service:     "FAH AI — Smart Food Tracking Engine",
    version:     "1.0.0",
    endpoints:   {
      health:       "GET  /health",
      analyze_food: "POST /analyze-food",
      food_logs:    "GET  /food-logs/:userId",
    },
    documentation: "https://github.com/fah-ai/backend",
  });
});

/**
 * POST /analyze-food
 * Body: { "food_name": "string", "user_id": "string" (optional) }
 * Returns: strict structured JSON with smart nudge
 */
app.post("/analyze-food", aiLimiter, async (req, res) => {
  const startTime = Date.now();
  const requestId = uuidv4();

  try {
    const { food_name, user_id } = req.body;

    /* ── Input Validation ── */
    if (!food_name || typeof food_name !== "string") {
      return res.status(400).json({
        error:      "Validation failed",
        message:    "Request body must include a non-empty 'food_name' string.",
        request_id: requestId,
      });
    }

    const trimmedFood = food_name.trim();
    if (trimmedFood.length < 2 || trimmedFood.length > 100) {
      return res.status(400).json({
        error:      "Validation failed",
        message:    "food_name must be between 2 and 100 characters.",
        request_id: requestId,
      });
    }

    /* ── AI Analysis ── */
    console.log(`[${requestId}] Analyzing: "${trimmedFood}"`);
    const analysis = await analyzeFoodWithLLM(trimmedFood);

    /* ── Firestore Logging (non-blocking) ── */
    if (db) {
      const logEntry = {
        id:           requestId,
        user_id:      user_id || "anonymous",
        timestamp:    new Date(),
        raw_input:    trimmedFood,
        food_name:    analysis.food_name,
        calories:     analysis.calories,
        health_score: analysis.health_score,
        smart_nudge:  analysis.smart_nudge,
        nudge_type:   analysis.nudge_type,
        latency_ms:   Date.now() - startTime,
        ip_hash:      req.ip ? req.ip.split(".").slice(0, 2).join(".") + ".x.x" : "unknown",
      };

      // Fire-and-forget — don't block the response
      db.collection("food_logs").doc(requestId).set(logEntry)
        .then(() => console.log(`[${requestId}] Logged to Firestore`))
        .catch(err => console.error(`[${requestId}] Firestore write failed:`, err.message));
    }

    /* ── Strict JSON Response ── */
    const response = {
      food_name:    analysis.food_name,
      calories:     analysis.calories,
      health_score: analysis.health_score,
      smart_nudge:  analysis.smart_nudge,
      nudge_type:   analysis.nudge_type,
    };

    console.log(`[${requestId}] ✅ Analysis complete in ${Date.now() - startTime}ms | Score: ${analysis.health_score}/10 | Type: ${analysis.nudge_type}`);

    return res.status(200).json(response);

  } catch (err) {
    console.error(`[${requestId}] ❌ Analysis error:`, err);
    return res.status(500).json({
      error:      "Analysis failed",
      message:    "The AI engine encountered an error. Please try again.",
      request_id: requestId,
    });
  }
});

/**
 * GET /food-logs/:userId
 * Returns paginated food logs for a user from Firestore.
 * Requires Firebase to be connected.
 */
app.get("/food-logs/:userId", async (req, res) => {
  if (!db) {
    return res.status(503).json({
      error:   "Firestore unavailable",
      message: "Persistence layer is not configured.",
    });
  }

  try {
    const { userId }    = req.params;
    const limit         = Math.min(parseInt(req.query.limit) || 20, 100);
    const snapshot      = await db.collection("food_logs")
      .where("user_id", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    const logs = snapshot.docs.map(doc => doc.data());
    return res.status(200).json({ logs, count: logs.length, user_id: userId });

  } catch (err) {
    console.error("Firestore read error:", err);
    return res.status(500).json({
      error:   "Failed to retrieve logs",
      message: err.message,
    });
  }
});

/** 404 Catch-all */
app.use((_req, res) => {
  res.status(404).json({
    error:   "Not found",
    message: "This endpoint does not exist. Check the API documentation.",
  });
});

/* ─────────────────────────────────────────────
   Server Start
───────────────────────────────────────────── */
app.listen(PORT, "0.0.0.0", () => {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║         FAH AI Backend  v1.0.0           ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Server    : http://0.0.0.0:${PORT}          ║`);
  console.log(`║  Env       : ${(process.env.NODE_ENV || "development").padEnd(27)}║`);
  console.log(`║  Firestore : ${db ? "Connected ✅" : "Disabled  ⚠️ "}                ║`);
  console.log("╚══════════════════════════════════════════╝");
});

module.exports = app;
