import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Joi from "joi";
import { Pool } from "pg";

//ρύθμιση της σύνδεσης με την postgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

//κλειδί για την υπογραφή του jwt (το κτρατάμε κρυφό στο .env)
const JWT_SECRET = process.env.JWT_SECRET;

//βοηθιτική function για custom errors με status code
function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

//η βασική λογική του login - δεν ξέρει τίποτα για το request / responce
async function getDBResponse(email, password) {
  //1. Validation με το Joi
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(72).required(),
  });

  //επιστροφή του error κατ΄το validation των στοιχειων
  const { error } = schema.validate({ email, password });
  if (error) {
    throw createError(400, error.details[0].message);
  }

  //2. Έλεγχος στην βάση εάν υπάρχει ο χρήστης
  const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  //Έλεγχος σφάλματος κατά το query στην βάση
  if (userResult.rows.length === 0) {
    throw createError(401, "Wrong email or password");
  }

  const user = userResult.rows[0];

  //3. Έλεγχος εάν ο κωδικός ταιριάζει με τον κρυπτογραφημένο στην βάση δεδομένων
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw createError(401, "Wrong email or password");
  }

  //4. Έκδοση JWT Authentication Token
  const payload = {
    userId: user.id,
    email: user.email,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  return { token };
}

async function registerUser(
  email,
  password,
  first_name,
  last_name,
  company_name,
  location,
) {
  //1. Validation με Joi
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(72).required(),
    first_name: Joi.string().max(100).allow("", null).required(),
    last_name: Joi.string().max(100).allow("", null).required(),
    company_name: Joi.string().max(255).allow("", null),
    location: Joi.string().max(255).allow("", null),
  });

  //επιστροφή του error κατ΄το validation των στοιχείων
  const { error } = schema.validate({
    email,
    password,
    first_name,
    last_name,
    company_name,
    location,
  });
  if (error) {
    throw createError(400, error.details[0].message);
  }

  //3. Εισαγωγή δεδομενων στην βαση
  const client = await pool.connect();

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    //εάν δεν υπάρχει ο χρήστης στην βάση τότε βγάλε σφάλμα 409 conflict
    if (userResult.rows.length !== 0) {
      throw createError(409, "Conflict");
    }

    await client.query("BEGIN");
    //Εισαγωγή στον πρώτο πίνακα και παίρνω id

    //πρώτα κάνω hash το Password
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await client.query(
      `
      INSERT INTO users (email, password_hash) 
      VALUES ($1,$2) 
      RETURNING id`,
      [email, passwordHash],
    );

    //κρατάμε το επιστρεφόμενο id
    const userId = result.rows[0].id;

    await client.query(
      `
      INSERT INTO user_profiles (user_id, first_name, last_name, company_name, location) 
      VALUES ($1,$2,$3,$4,$5)
      `,
      [userId, first_name, last_name, company_name, location],
    );

    //πρέπει να γίνει commit για να αποθηκευτούν μόνιμα τα δεδομένα
    await client.query("COMMIT");

    //επιστροφή κάποιον στοιχείων του user για την σύνθεση του αντικειμένου στο auth.js
    return { id: userId, email, first_name, last_name };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
export { getDBResponse, registerUser };
