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
async function getDBResponse(username, password) {}
module.exports = { getDBResponse };
