// ioServer.js
const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("join_service_room", (serviceId) => {
      socket.join(`service_${serviceId}`);
      console.log(`Socket ${socket.id} joined room service_${serviceId}`);
    });

    socket.on("request_received_ack", (data) => {
      console.log(
        `Nurse ${data.nurse_id} acknowledged request ${data.service_id}`
      );
    });

    socket.on("register_nurse", (nurseId) => {
    socket.join(`nurse_${nurseId}`);
    console.log(`👩‍⚕️ Nurse ${nurseId} joined their private room`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}




module.exports = { initSocket, getIO };
