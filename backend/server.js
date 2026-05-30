require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const donorRoutes = require("./routes/donorRoutes");
const requestRoutes = require("./routes/requestRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const errorHandler = require("./middleware/errorHandler");
require("./config/firebase");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: function(origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        process.env.FRONTEND_URL,
      ].filter(Boolean);
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tracking", trackingRoutes);

app.get("/api/health", (req, res) => {
  return res.status(200).json({ success: true, message: "Lifestream Connect API running", timestamp: new Date() });
});

app.use((req, res) => {
  return res.status(404).json({ success: false, message: "Route not found" });
});

app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", (data) => {
    if (data && data.room) {
      socket.join(data.room);
      console.log(`Socket ${socket.id} joined room ${data.room}`);
    }
  });

  socket.on("emergency-broadcast", (data) => {
    if (data) {
      io.emit("new-emergency", {
        bloodGroup: data.bloodGroup,
        city: data.city,
        hospital: data.hospital,
        urgency: data.urgency,
        timestamp: Date.now(),
      });
    }
  });

  socket.on("donor-location-update", (data) => {
    if (data && data.requestId) {
      io.to(data.requestId).emit("location-updated", {
        lat: data.lat,
        lon: data.lon,
        eta: data.eta,
      });
    }
  });

  socket.on("request-status-update", (data) => {
    if (data && data.requestId) {
      io.to(data.requestId).emit("status-changed", {
        status: data.status,
        message: data.message,
      });
    }
  });

  socket.on("donor-accepted", (data) => {
    if (data && data.userId) {
      io.to(data.userId).emit("your-donor-accepted", {
        donorName: data.donorName,
        eta: data.eta,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const DEFAULT_PORTS = [process.env.PORT || 5000, 5001, 5002, 5003, 5004];

function tryListen(ports) {
  if (!ports || ports.length === 0) {
    console.error("No available ports to start backend.");
    process.exit(1);
  }

  const port = ports[0];
  server.listen(port, () => {
    console.log("Lifestream Connect Backend running on port " + port);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.warn(`Port ${port} in use, trying next port...`);
      // remove current port and try next
      server.removeAllListeners("error");
      tryListen(ports.slice(1));
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
}

tryListen(DEFAULT_PORTS);

module.exports = { io };
