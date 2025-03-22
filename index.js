const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const users = require("./routes/users");
const places = require("./routes/places");

connectDB();

const app = express();
const corsOptions = {
  origin: ["https://k-tourism.netlify.app", "http://localhost:8000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
  credentials: true, 
};
app.use(express.json({ limit: "10mb" })); 

app.use(bodyParser.json({ limit: "10mb" }));

app.use(cors(corsOptions)); // Apply CORS settings to the app

app.get("/", (req, res) => res.send("server is active"));

// use routes
app.use("/api/user", users);
app.use("/api/places", places);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`server is running on http://localhost:${PORT}`);
});

