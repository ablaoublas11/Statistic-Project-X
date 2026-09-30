import { Router } from "express";
const router = Router();
import { getDBResponse, registerUser } from "../services/authService.js";

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

router.post("/api/register", async (req, res) => {
  const { email, password, first_name, last_name, company_name, location } =
    req.body;
  try {
    const newUser = await registerUser(
      email,
      password,
      first_name,
      last_name,
      company_name,
      location,
    );
    return res.status(201).json({
      message: "Created",
      token: newUser,
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
