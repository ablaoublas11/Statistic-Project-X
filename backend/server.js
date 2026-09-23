import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";
import authRouter from "./routes/auth.js";

const app = express();
app.use(express.json());
app.use(authRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server runing on port ${PORT}`);
});
