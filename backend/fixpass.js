require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log("Connected");

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync("Teerth@1", salt);
  console.log("New hash:", hash);

  await mongoose.connection.collection("users").updateOne(
    { email: "teerth@gmai.com" },
    { $set: { password: hash } }
  );

  const verify = await mongoose.connection.collection("users").findOne({ email: "teerth@gmai.com" });
  const isMatch = await bcrypt.compare("Teerth@1", verify.password);
  console.log("Verification:", isMatch ? "✅ Password works!" : "❌ Still failing");
  process.exit(0);
})
.catch(err => {
  console.log("Error:", err.message);
  process.exit(1);
});
