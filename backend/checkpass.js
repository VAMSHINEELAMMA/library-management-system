require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const users = await mongoose.connection.collection("users").find({}).toArray();
  
  for (const u of users) {
    const isHashed = u.password.startsWith("$2");
    console.log(u.email + " | Password Type: " + (isHashed ? "HASHED ✅" : "PLAIN TEXT ❌"));
  }
  process.exit(0);
})
.catch(err => {
  console.log("Error:", err.message);
  process.exit(1);
});
