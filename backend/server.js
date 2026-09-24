import "./config/env.js";
import express from "express";
import { router } from "./routes/auth.js";

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server runing on port ${PORT}`);
});
