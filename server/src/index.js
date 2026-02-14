import express from "express";
import {matchesRouter} from "./routes/matches.js";
const app = express();
const PORT = 8000;

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello! Express server is running 🚀");
});

app.use('/matches', matchesRouter);

app.listen(PORT, () => {
  console.log(`Server started at: http://localhost:${PORT}`);
});
