import express from "express";
import http from "http";
import SocketIO from "socket.io";
import path from "path";

const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.use(express.static(path.join(__dirname, "catch-mind/build")));

// app.get("/", (req, res) => {
//   res.render("home");
// });

const handleListen = () => console.log(`Listening on http,ws. On port 3000`);

const httpServer = http.createServer(app);
const io = SocketIO(httpServer);

const sockets = [];

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = io;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });

  return publicRooms;
}

io.on("connection", (socket) => {
  console.log(publicRooms());
  sockets.push(socket);
  console.log("connected from client");

  socket.on("join", (roomName, callback) => {
    socket.join(roomName);
    socket.nickname = "anonymous";
    callback();

    socket.to(roomName).emit("welcome", socket.nickname);
    io.sockets.emit("room_change", publicRooms());
  });

  socket.on("disconnecting", () => {
    console.log("someone disconnected");
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", socket.nickname);
    });
  });

  socket.on("message", (msg, roomName, callback) => {
    console.log("got message");
    socket.to(roomName).emit("message", `${socket.nickname} : ${msg}`);
    callback();
  });

  socket.on("set_nick", (nick, callback) => {
    socket.nickname = nick;
    callback();
  });

  //그리기
  socket.on("draw", ({ x, y, isDrawing }) => {
    socket.broadcast.emit("draw", { x, y, isDrawing });
  });
});

httpServer.listen(3000, handleListen);

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "/catch-mind/build/index.html"));
});
