require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const app = require("./app");
const registerSocketHandlers = require("./socket/registerSocketHandlers");

const PORT = process.env.SOCKET_PORT || 1003;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

app.set("io", io);

registerSocketHandlers(io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Socket servisi ${PORT} üzerinde çalışıyor`);
    });
  })
  .catch((error) => {
    console.error("Socket servisi MongoDB bağlantı hatası:", error.message);
    process.exit(1);
  });
