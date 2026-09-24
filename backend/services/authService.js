import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Joi from "joi";
import { Pool } from "pg";

//ρύθμιση της σύνδεσης με την postgreSQL
const poll = new Pool({
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
async function getDBResponse(username, password) {
  //1. Validation με το Joi
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required()
  });
  
  //επιστροφή του error κατ΄το validation των στοιχειων
  const { error } = schema.validate({ username, password});
  if(error){
    throw createError(400, error.details[0].message);
  }

  //2. Έλεγχος στην βάση εάν υπάρχει ο χρήστης
  const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  //Έλεγχος σφάλματος κατά το query στην βάση
  if (userResult.rows.length === 0){
    throw createError(401, "Wrong username or password");
  }

  const user = userResult.rows[0];

  //3. Έλεγχος εάν ο κωδικός ταιριάζει με τον κρυπτογραφημένο στην βάση δεδομένων
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid){
    throw createError(401, "Wrong username or password");
  }

  //4. Έκδοση JWT Authentication Token
  const payload = {
    userId: user.id,
    username: user.username
  }; 

  const token = jwt.sign(payload, JWT_SECRET, {expireIn: "1h"});

  return { token };
  
}
module.exports = { getDBResponse };
