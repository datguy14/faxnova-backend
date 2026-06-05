import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import faxRoutes from "./src/routes/faxRoutes.js";
import connectDB from "./src/config/db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "FaxNova backend is running" });
});

app.use("/fax", faxRoutes);

connectDB();

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 FaxNova backend running on port ${PORT}`);
});
