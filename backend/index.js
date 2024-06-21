const express = require("express");
const cors = require("cors");
const { connectionDB } = require("./db");
const getRoutes = require("./routes/allRoutes");
const { TransactionModel } = require("./model/dataModel");

const app = express();
const Port = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());
app.use("/get", getRoutes);
app.get("/", () => {});

app.listen(Port, async () => {
  await connectionDB;

  console.log("db connected");
  console.log(`Server is running on port ${Port}`);
});
