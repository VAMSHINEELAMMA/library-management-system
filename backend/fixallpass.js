require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log("Connected");
  const users = await mongoose.connection.collection("users").find({}).toArray();
  console.log("Total users:", users.length);
  
  for (const user of users) {
    const isHashed = user.password.startsWith("$2");
    if (!isHashed) {
      console.log("Fixing:", user.email);
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(user.password, salt);
      await mongoose.connection.collection("users").updateOne(
        { _id: user._id },
        { $set: { password: hash } }
      );
      console.log("Fixed:", user.email);
    } else {
      console.log("Already hashed:", user.email);
    }
  }
  console.log("All done!");
  process.exit(0);
})
.catch(err => {
  console.log("Error:", err.message);
  process.exit(1);
});
