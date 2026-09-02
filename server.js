import express from "express";
import  cookieParser  from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
  
dotenv.config();

const app = express();      

const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port: http://localhost:${PORT}`);
  connectDB();
});