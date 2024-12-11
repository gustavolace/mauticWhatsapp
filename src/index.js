const express = require("express");
const routes = require("./routes");
const cors = require("cors");
const path = require('path');

let port = 3000

//express
const app = express();
app.use(express.json());

// html
app.use(express.static(path.join(__dirname, 'assets')));

//cors
app.use(cors());

//rotas
app.use(routes);
app.listen(port, () => console.log(`Running on http://localhost:3000`));