const express = require("express");
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
} = require("../controllers/requestController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/", verifyToken, createRequest);
router.get("/", verifyToken, getAllRequests);
router.get("/my", verifyToken, getMyRequests);
router.get("/:id", verifyToken, getRequestById);
router.put("/:id/status", verifyToken, updateRequestStatus);
router.delete("/:id", verifyToken, deleteRequest);

module.exports = router;
