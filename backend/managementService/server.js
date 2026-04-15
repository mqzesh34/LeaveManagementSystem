require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Management servisi ${PORT} üzerinde çalışıyor`),
    );
  })
