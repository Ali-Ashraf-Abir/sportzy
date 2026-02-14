import express from "express";

const app = express();
const PORT = 8000;

app.get("/", (req, res) => {
  res.send("Hello! Express server is running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server started at: http://localhost:${PORT}`);
});
