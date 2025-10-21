// nursesOffers.controller.js
const prisma = require("../prisma/prismaClient");
const { getIO } = require("../ioServer");

function setupNurseOfferSockets(io) {
  io.on("connection", (socket) => {
    console.log("🟢 Nurse offer socket connected:", socket.id);

    socket.on("join_service_room", (serviceId) => {
      socket.join(`service_${serviceId}`);
      console.log(`Socket ${socket.id} joined room service_${serviceId}`);
    });

    socket.on("make_offer", async (data) => {
      const { nurseId, serviceRequestId, offeredAmount, message, patientId } = data;

      try {
        const offer = await prisma.offers.create({
          data: {
            nurse_id: nurseId,
            patient_id: patientId,
            service_request_id: serviceRequestId,
            offered_amount: offeredAmount,
            message,
          },
        });

        // Notify patient in that service room
        io.to(`service_${serviceRequestId}`).emit("new_offer", offer);
        console.log("📢 New offer broadcast:", offer);
      } catch (err) {
        console.error("❌ Error saving offer:", err.message);
        socket.emit("error_offer", { message: "Failed to create offer" });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });
}

module.exports = { setupNurseOfferSockets };
