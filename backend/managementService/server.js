require("dotenv").config({ path: require('path').resolve(__dirname, '../../.env') });
const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.MANAGEMENT_PORT;

sequelize
  .authenticate()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Management servisi ${PORT} üzerinde çalışıyor`),
    );
  })
