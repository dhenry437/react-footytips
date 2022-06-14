const express = require("express");
const app = express();

app.use(require("./routes"));
app.use("/test", require("./routes/test"));

app.listen(3001, () => {
  console.log("Listening on port 3001");
});
