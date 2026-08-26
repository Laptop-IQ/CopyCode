import express from "express";

import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addCommandToGroup,
  removeCommandFromGroup,
} from "../controllers/commandController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// PUBLIC
router.get("/", getAllGroups);
router.get("/:id", getGroupById);

// authMiddlewareED
router.post("/", authMiddleware, createGroup);
router.put("/:id", authMiddleware, updateGroup);
router.delete("/:id", authMiddleware, deleteGroup);

router.post("/:id/add-command", authMiddleware, addCommandToGroup);
router.delete("/:id/remove-command/:cmdId", authMiddleware, removeCommandFromGroup);

export default router;
