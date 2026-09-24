import { Router } from "express";
const router = Router();
import { getDBResponse } from "../services/authService.js";

//ορισμός του post endpoint για την αποστολή αιτήματος
router.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { token } = await getDBResponse(email, password);

    return res.status(200).json({
      message: "Connection succeeded",
      token: token,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export { router };
