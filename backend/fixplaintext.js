require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const emails = ["swetha@gmail.com", "vamshi@gmail.com"];
  const passwords = {
    "swetha@gmail.com": "swetha@1",
    "vamshi@gmail.com": "vamshi@1"
  };
  
  for (const email of emails) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(passwords[email], salt);
    await mongoose.connection.collection("users").updateOne(
      { email: email },
      { $set: { password: hash } }
    );
    console.log("✅ Fixed: " + email);
  }
  
  console.log("All passwords hashed!");
  process.exit(0);
})
.catch(err => {
  console.log("Error:", err.message);
  process.exit(1);
});
