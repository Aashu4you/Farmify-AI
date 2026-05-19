import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import cropRoutes from "./routes/cropRoutes.js";
import diseaseRoutes from "./routes/diseaseRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import profileRoutes from "./routes/profileRoutes.js"; 

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth",    authRoutes);
app.use("/api/crops",   cropRoutes);
app.use("/api/disease", diseaseRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/tasks",   taskRoutes);
app.use("/api/profile", profileRoutes); 

app.get("/", (req, res) => {
  res.send("Farmify API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});