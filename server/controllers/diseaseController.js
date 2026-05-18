import fetch from "node-fetch";
import FormData from "form-data";

const HF_API_URL =
  "https://router.huggingface.co/hf-inference/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification";

// Disease info map — name, severity, symptoms, treatments, prevention
const DISEASE_INFO = {
  "Apple___Apple_scab": { name: "Apple Scab", scientific: "Venturia inaequalis", crop: "Apple", severity: "moderate", symptoms: ["Olive-green to brown velvety spots on leaves", "Scabby lesions on fruit surface", "Premature leaf drop"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Mancozeb 75WP @ 2g/L every 10 days" }, { type: "Pruning", icon: "✂️", detail: "Remove and destroy infected leaves" }, { type: "Sanitation", icon: "🧹", detail: "Rake and destroy fallen leaves" }], prevention: "Plant scab-resistant varieties. Ensure good air circulation." },
  "Apple___Black_rot": { name: "Black Rot", scientific: "Botryosphaeria obtusa", crop: "Apple", severity: "high", symptoms: ["Purple spots on leaves with yellow halos", "Rotting fruit with concentric rings", "Cankers on branches"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Thiophanate-methyl or Captan during bloom" }, { type: "Pruning", icon: "✂️", detail: "Cut out cankers 15cm beyond visible infection" }, { type: "Removal", icon: "🗑️", detail: "Remove all mummified fruit" }], prevention: "Avoid wounding trees. Remove dead wood promptly." },
  "Apple___Cedar_apple_rust": { name: "Cedar Apple Rust", scientific: "Gymnosporangium juniperi-virginianae", crop: "Apple", severity: "moderate", symptoms: ["Bright orange-yellow spots on upper leaf surface", "Tube-like structures on leaf undersides", "Distorted fruit"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Myclobutanil from pink bud through petal fall" }, { type: "Host Removal", icon: "🌲", detail: "Remove nearby juniper/cedar trees if possible" }], prevention: "Plant resistant cultivars. Avoid planting apples near junipers." },
  "Apple___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Apple", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Regular monitoring and balanced fertilisation." },
  "Blueberry___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Blueberry", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Maintain acidic soil pH. Mulch to retain moisture." },
  "Cherry_(including_sour)___Powdery_mildew": { name: "Powdery Mildew", scientific: "Podosphaera clandestina", crop: "Cherry", severity: "moderate", symptoms: ["White powdery coating on young leaves", "Curled or distorted new growth", "Stunted shoot development"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Sulphur 80WP @ 2g/L every 10 days" }, { type: "Pruning", icon: "✂️", detail: "Remove infected shoot tips" }, { type: "Irrigation", icon: "💧", detail: "Avoid overhead watering; use drip irrigation" }], prevention: "Plant in well-ventilated areas. Avoid excess nitrogen." },
  "Cherry_(including_sour)___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Cherry", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Regular monitoring and balanced fertilisation." },
  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": { name: "Gray Leaf Spot", scientific: "Cercospora zeae-maydis", crop: "Maize", severity: "high", symptoms: ["Rectangular grey to tan lesions parallel to veins", "Yellow borders on lesions", "Severe blighting of lower leaves"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Azoxystrobin + Propiconazole @ 1L/ha at tasseling" }, { type: "Crop Rotation", icon: "🔄", detail: "Rotate with non-host crops for 2 years" }, { type: "Resistant Varieties", icon: "🌱", detail: "Plant GLS-tolerant hybrids" }], prevention: "Avoid continuous maize cropping. Manage crop residue." },
  "Corn_(maize)___Common_rust_": { name: "Common Rust", scientific: "Puccinia sorghi", crop: "Maize", severity: "moderate", symptoms: ["Small oval brick-red pustules on both leaf surfaces", "Pustules turn dark brown as they mature", "Reduced grain weight"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Mancozeb 75WP @ 2.5g/L at first sign" }, { type: "Resistant Varieties", icon: "🌱", detail: "Plant rust-resistant hybrids" }], prevention: "Use resistant hybrids. Early planting avoids peak rust pressure." },
  "Corn_(maize)___Northern_Leaf_Blight": { name: "Northern Leaf Blight", scientific: "Exserohilum turcicum", crop: "Maize", severity: "high", symptoms: ["Long cigar-shaped grey-green lesions (5–15cm)", "Lesions first appear on lower leaves", "Dark sporulation in humid conditions"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Propiconazole 25EC @ 1ml/L at tasseling" }, { type: "Crop Rotation", icon: "🔄", detail: "Rotate with soybean or wheat for 1–2 seasons" }], prevention: "Crop rotation and resistant varieties are most effective." },
  "Corn_(maize)___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Maize", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Balanced soil nutrition and proper plant spacing." },
  "Grape___Black_rot": { name: "Black Rot", scientific: "Guignardia bidwellii", crop: "Grape", severity: "high", symptoms: ["Tan to brown circular lesions with dark borders", "Berries shrivel into hard black mummies", "Shoot and tendril infections"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Mancozeb or Myclobutanil from bud break" }, { type: "Sanitation", icon: "🧹", detail: "Remove and destroy all mummified berries" }, { type: "Canopy Management", icon: "✂️", detail: "Prune for good air circulation" }], prevention: "Remove mummies before bud break. Maintain open canopy." },
  "Grape___Esca_(Black_Measles)": { name: "Esca (Black Measles)", scientific: "Phaeoacremonium spp.", crop: "Grape", severity: "high", symptoms: ["Tiger-stripe yellowing between leaf veins", "Berries develop dark spots and shrivel", "Internal wood shows dark streaking"], treatments: [{ type: "Pruning", icon: "✂️", detail: "Cut infected wood well below discoloration" }, { type: "Wound Protection", icon: "🛡️", detail: "Apply Trichoderma-based wound sealant after pruning" }], prevention: "Prune in dry weather. Protect pruning wounds." },
  "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": { name: "Leaf Blight", scientific: "Isariopsis clavispora", crop: "Grape", severity: "moderate", symptoms: ["Irregular dark brown spots with yellow margins", "Spots enlarge causing leaf blight", "Premature defoliation"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Copper oxychloride 50WP @ 3g/L" }, { type: "Irrigation", icon: "💧", detail: "Avoid wetting foliage; switch to drip irrigation" }], prevention: "Avoid overhead irrigation. Ensure good air circulation." },
  "Grape___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Grape", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Regular canopy management and balanced nutrition." },
  "Orange___Haunglongbing_(Citrus_greening)": { name: "Citrus Greening (HLB)", scientific: "Candidatus Liberibacter asiaticus", crop: "Orange", severity: "critical", symptoms: ["Asymmetric yellowing on leaves", "Small lopsided fruit staying green", "Twig dieback and tree decline"], treatments: [{ type: "Vector Control", icon: "🦟", detail: "Control Asian citrus psyllid with Imidacloprid" }, { type: "Tree Removal", icon: "🗑️", detail: "Remove and destroy infected trees to protect healthy ones" }], prevention: "Use certified disease-free nursery stock. Control psyllid populations." },
  "Peach___Bacterial_spot": { name: "Bacterial Spot", scientific: "Xanthomonas arboricola pv. pruni", crop: "Peach", severity: "high", symptoms: ["Small water-soaked spots with yellow halos", "Shot-hole appearance as tissue falls out", "Sunken dark lesions on fruit"], treatments: [{ type: "Copper Spray", icon: "💊", detail: "Apply Copper hydroxide 77WP @ 3g/L" }, { type: "Pruning", icon: "✂️", detail: "Remove infected twigs 10cm below visible cankers" }], prevention: "Plant resistant varieties. Avoid working when plants are wet." },
  "Peach___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Peach", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Regular monitoring and proper sanitation." },
  "Pepper,_bell___Bacterial_spot": { name: "Bacterial Spot", scientific: "Xanthomonas campestris pv. vesicatoria", crop: "Bell Pepper", severity: "high", symptoms: ["Small water-soaked lesions with yellow halos", "Brown papery spots with irregular edges", "Raised scabby spots on fruit"], treatments: [{ type: "Copper Fungicide", icon: "💊", detail: "Apply Copper oxychloride 50WP @ 3g/L every 7 days" }, { type: "Crop Rotation", icon: "🔄", detail: "Rotate with non-solanaceous crops for 2–3 years" }], prevention: "Use resistant varieties. Avoid overhead irrigation." },
  "Pepper,_bell___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Bell Pepper", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Balanced nutrition and proper spacing for air circulation." },
  "Potato___Early_blight": { name: "Early Blight", scientific: "Alternaria solani", crop: "Potato", severity: "moderate", symptoms: ["Dark brown circular lesions with concentric rings", "Yellow halo surrounding lesions", "Lower leaves affected first"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Mancozeb 75WP @ 2g/L every 7–10 days" }, { type: "Irrigation", icon: "💧", detail: "Use drip irrigation; avoid wetting foliage" }, { type: "Nutrition", icon: "🌿", detail: "Potassium-rich fertiliser boosts plant immunity" }], prevention: "Use certified seed. Crop rotation. Avoid overhead irrigation." },
  "Potato___Late_blight": { name: "Late Blight", scientific: "Phytophthora infestans", crop: "Potato", severity: "critical", symptoms: ["Water-soaked pale green lesions on leaf edges", "White fuzzy sporulation on undersides", "Rapid brown-black collapse of plant tissue"], treatments: [{ type: "Emergency Fungicide", icon: "🚨", detail: "Apply Metalaxyl + Mancozeb immediately — act within 24 hours" }, { type: "Plant Removal", icon: "🗑️", detail: "Remove and bag infected plants; do not compost" }], prevention: "Plant resistant varieties. Scout fields twice weekly." },
  "Potato___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Potato", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Use certified seed potatoes. Maintain proper hill drainage." },
  "Raspberry___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Raspberry", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Annual cane renewal and proper trellis management." },
  "Soybean___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Soybean", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Inoculate with Rhizobium. Proper drainage and rotation." },
  "Squash___Powdery_mildew": { name: "Powdery Mildew", scientific: "Podosphaera xanthii", crop: "Squash", severity: "moderate", symptoms: ["White powdery fungal growth on upper leaf surfaces", "Yellowing and browning of leaves", "Stunted plant growth"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Sulphur 80WP @ 2g/L or potassium bicarbonate" }, { type: "Spacing", icon: "📏", detail: "Ensure 60–90cm between plants for air flow" }], prevention: "Plant resistant varieties. Water at base of plant." },
  "Strawberry___Leaf_scorch": { name: "Leaf Scorch", scientific: "Diplocarpon earlianum", crop: "Strawberry", severity: "moderate", symptoms: ["Small irregular purple to dark brown spots", "Spots enlarge causing scorched appearance", "Severely infected leaves turn brown and die"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Captan 50WP @ 2g/L at first sign of symptoms" }, { type: "Renovation", icon: "✂️", detail: "Mow old foliage after harvest to remove inoculum" }], prevention: "Avoid overhead irrigation. Plant in well-drained sunny locations." },
  "Strawberry___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Strawberry", severity: "none", symptoms: ["No disease symptoms detected"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine" }], prevention: "Renovate beds annually. Control weeds and maintain mulch." },
  "Tomato___Bacterial_spot": { name: "Bacterial Spot", scientific: "Xanthomonas campestris pv. vesicatoria", crop: "Tomato", severity: "high", symptoms: ["Small water-soaked spots with yellow halos", "Brown papery spots with ragged appearance", "Defoliation exposing fruit to sunscald"], treatments: [{ type: "Copper Spray", icon: "💊", detail: "Apply Copper hydroxide 77WP @ 3g/L every 7 days" }, { type: "Crop Rotation", icon: "🔄", detail: "Avoid tomatoes in same field for 3 years" }], prevention: "Use disease-free transplants. Avoid working when plants are wet." },
  "Tomato___Early_blight": { name: "Early Blight", scientific: "Alternaria solani", crop: "Tomato", severity: "moderate", symptoms: ["Dark brown circular lesions with concentric rings on older leaves", "Yellow halo surrounding lesions", "Lower leaves affected first"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Mancozeb 75WP @ 2g/L every 7 days" }, { type: "Pruning", icon: "✂️", detail: "Remove infected lower leaves immediately" }, { type: "Nutrition", icon: "🌿", detail: "Apply potassium-rich fertiliser to boost immunity" }], prevention: "Crop rotation, resistant varieties, and mulching reduce disease." },
  "Tomato___Late_blight": { name: "Late Blight", scientific: "Phytophthora infestans", crop: "Tomato", severity: "critical", symptoms: ["Water-soaked pale green spots turning dark brown", "White fuzzy mould on leaf undersides", "Rapid collapse and blackening of entire plant"], treatments: [{ type: "Emergency Fungicide", icon: "🚨", detail: "Apply Metalaxyl-M + Mancozeb immediately — do not delay" }, { type: "Plant Removal", icon: "🗑️", detail: "Remove and bag infected plants; do not compost" }], prevention: "Scout twice weekly. Use resistant varieties." },
  "Tomato___Leaf_Mold": { name: "Leaf Mold", scientific: "Passalora fulva", crop: "Tomato", severity: "moderate", symptoms: ["Pale green or yellow spots on upper leaf surface", "Olive-green velvety mould on leaf undersides", "Leaves curl upward in severe infections"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Chlorothalonil 75WP @ 2g/L every 7 days" }, { type: "Ventilation", icon: "🌬️", detail: "Increase ventilation to reduce humidity below 85%" }], prevention: "Ensure good ventilation. Plant resistant varieties." },
  "Tomato___Septoria_leaf_spot": { name: "Septoria Leaf Spot", scientific: "Septoria lycopersici", crop: "Tomato", severity: "moderate", symptoms: ["Many small circular spots with grey-white centres", "Tiny black fruiting bodies in lesion centres", "Starts on lower leaves progressing upward"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Mancozeb 75WP @ 2g/L every 7 days" }, { type: "Mulching", icon: "🌿", detail: "Apply mulch to prevent soil splash spreading spores" }], prevention: "Mulch soil surface. Rotate crops. Remove plant debris." },
  "Tomato___Spider_mites Two-spotted_spider_mite": { name: "Spider Mites", scientific: "Tetranychus urticae", crop: "Tomato", severity: "moderate", symptoms: ["Tiny yellow speckling on upper leaf surface", "Fine webbing on leaf undersides", "Bronzing and browning in heavy infestations"], treatments: [{ type: "Miticide", icon: "💊", detail: "Apply Abamectin 1.8EC @ 1ml/L" }, { type: "Neem Oil", icon: "🌿", detail: "Neem oil 3ml/L + soap 1ml/L — organic option" }], prevention: "Avoid water stress. Keep dust down around plants." },
  "Tomato___Target_Spot": { name: "Target Spot", scientific: "Corynespora cassiicola", crop: "Tomato", severity: "moderate", symptoms: ["Circular brown lesions with concentric rings", "Yellow halo surrounding lesions", "Lesions on stems and fruit surface"], treatments: [{ type: "Fungicide", icon: "💊", detail: "Apply Azoxystrobin 23SC @ 1ml/L every 10–14 days" }, { type: "Canopy Management", icon: "🌿", detail: "Maintain open plant structure with regular pruning" }], prevention: "Maintain open canopy. Rotate crops." },
  "Tomato___Tomato_Yellow_Leaf_Curl_Virus": { name: "Yellow Leaf Curl Virus", scientific: "Tomato yellow leaf curl virus (TYLCV)", crop: "Tomato", severity: "critical", symptoms: ["Upward and inward curling of young leaves", "Yellowing of leaf margins", "Stunted growth with bushy appearance", "Near-zero fruit set"], treatments: [{ type: "Vector Control", icon: "🦟", detail: "Control whitefly with Imidacloprid 17.8SL @ 0.5ml/L" }, { type: "Roguing", icon: "🗑️", detail: "Remove and bag infected plants immediately" }], prevention: "Use TYLCV-resistant varieties. Control whiteflies from seedling stage." },
  "Tomato___Tomato_mosaic_virus": { name: "Tomato Mosaic Virus", scientific: "Tomato mosaic virus (ToMV)", crop: "Tomato", severity: "high", symptoms: ["Mosaic pattern of light and dark green on leaves", "Leaf distortion and puckering", "Stunted growth and reduced fruit set"], treatments: [{ type: "No Cure", icon: "⚠️", detail: "No chemical cure — remove infected plants immediately" }, { type: "Tool Sterilisation", icon: "🧼", detail: "Sterilise tools with 10% bleach between plants" }], prevention: "Use ToMV-resistant varieties. Sterilise tools regularly." },
  "Tomato___healthy": { name: "Healthy Plant", scientific: "N/A", crop: "Tomato", severity: "none", symptoms: ["No disease symptoms detected", "Leaves are normal green with no lesions"], treatments: [{ type: "Maintenance", icon: "✅", detail: "Continue current care routine — plant looks great" }, { type: "Monitoring", icon: "👁️", detail: "Inspect twice weekly for early signs of pest or disease" }], prevention: "Continue regular scouting. Stake plants and remove suckers." },
};

const SEVERITY_COLORS = { none: "green", moderate: "amber", high: "red", critical: "red" };

function getDiseaseInfo(className) {
  // Normalize label from HF model (may have spaces/underscores variations)
  const key = Object.keys(DISEASE_INFO).find(
    (k) => k.toLowerCase().replace(/\s+/g, "_") === className.toLowerCase().replace(/\s+/g, "_")
  ) || className;

  const info = DISEASE_INFO[key];
  if (!info) {
    return {
      name: className.replace(/___/g, " — ").replace(/_/g, " "),
      scientific: "Unknown",
      crop: "Unknown",
      severity: "moderate",
      symptoms: ["Consult a local agricultural expert for diagnosis"],
      treatments: [{ type: "Expert Consultation", icon: "👨‍🌾", detail: "Contact your nearest Krishi Vigyan Kendra for assistance" }],
      prevention: "Regular monitoring and timely intervention.",
    };
  }
  return info;
}

export const detectDisease = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded" });
    }

    const token = process.env.HF_API_TOKEN;
    if (!token) {
      return res.status(500).json({ message: "HF_API_TOKEN not set in .env file" });
    }

    // Call Hugging Face Inference API — send raw image bytes
    const hfRes = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": req.file.mimetype,
      },
      body: req.file.buffer,
    });

    // Model may still be loading on HF servers (cold start)
    if (hfRes.status === 503) {
      const body = await hfRes.json();
      const waitTime = body.estimated_time || 20;
      return res.status(503).json({
        message: `Model is loading on Hugging Face servers. Wait ${Math.ceil(waitTime)} seconds and try again.`,
        retry_after: Math.ceil(waitTime),
      });
    }

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      return res.status(502).json({ message: `Hugging Face API error: ${errText}` });
    }

    // HF returns array of { label, score } sorted by score desc
    const predictions = await hfRes.json();

    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(500).json({ message: "No predictions returned from model" });
    }

    const top       = predictions[0];
    const className = top.label;
    const confidence = parseFloat((top.score * 100).toFixed(2));

    const top5 = predictions.slice(0, 5).map((p) => ({
      class:      p.label,
      confidence: parseFloat((p.score * 100).toFixed(2)),
    }));

    const info      = getDiseaseInfo(className);
    const isHealthy = className.toLowerCase().includes("healthy");

    return res.status(200).json({
      detected:   !isHealthy,
      class_name: className,
      confidence,
      disease: {
        name:           info.name,
        scientific:     info.scientific,
        crop:           info.crop,
        severity:       info.severity,
        severity_color: SEVERITY_COLORS[info.severity] || "amber",
        symptoms:       info.symptoms,
        treatments:     info.treatments,
        prevention:     info.prevention,
      },
      top5,
    });

  } catch (error) {
    console.error("[disease] Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};