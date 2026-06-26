const app = require("./src/app");
const { connectDB } = require("./src/db");

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`FaxNova backend running on port ${PORT}`);
  });
});
