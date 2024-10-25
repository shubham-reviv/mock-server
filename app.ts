
// convert this file code into typescript
const cors = require("cors");
const morgan = require("morgan");
import express from "express";
const visionR = require("./routes/vision");

require("dotenv").config();
require("./config/database").connect();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/",visionR);
app.use(express.json());
app.use("/*",(req,res)=>{
	res.status(404).send("Invalid URL");
});
// Logic goes here

export default app;