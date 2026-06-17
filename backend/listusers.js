require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const users = await mongoose.connection.collection("users").find({}).toArray();
  console.log("Total users: " + users.length);
  users.forEach(u => {
    console.log("- Name: " + u.name + " | Email: " + u.email + " | Role: " + u.role);
  });
  process.exit(0);
})
.catch(err => {
  console.log("Error:", err.message);
  process.exit(1);
});
