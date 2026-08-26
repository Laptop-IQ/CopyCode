import CommandGroup from "../models/commandGroupModel.js";

// ────────────────────────────────────────────
// GET ALL — GET /api/commands
// ────────────────────────────────────────────
export const getAllGroups = async (req, res) => {
  try {
    const { tag, search } = req.query;

    const filter = {};

    // Filter by tag
    if (tag && tag !== "all") {
      filter.tag = tag;
    }

    // Search by title or command text
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { title: regex },
        { "commands.label": regex },
        { "commands.cmd": regex },
      ];
    }

    const groups = await CommandGroup.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// GET ONE — GET /api/commands/:id
// ────────────────────────────────────────────
export const getGroupById = async (req, res) => {
  try {
    const group = await CommandGroup.findById(req.params.id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    res.json({ success: true, data: group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// CREATE — POST /api/commands
// ────────────────────────────────────────────
export const createGroup = async (req, res) => {
  try {
    const { title, tag, commands } = req.body;

    if (!title || !commands || commands.length === 0)
      return res.status(400).json({
        success: false,
        message: "Title and at least one command are required",
      });

    // Filter out empty command entries
    const cleanedCommands = commands.filter((c) => c.cmd?.trim());
    if (cleanedCommands.length === 0)
      return res.status(400).json({
        success: false,
        message: "At least one valid command is required",
      });

    const group = await CommandGroup.create({
      title: title.trim(),
      tag: tag || "bash",
      commands: cleanedCommands,
    });

    res.status(201).json({
      success: true,
      message: "Command group created",
      data: group,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// UPDATE — PUT /api/commands/:id
// ────────────────────────────────────────────
export const updateGroup = async (req, res) => {
  try {
    const { title, tag, commands } = req.body;

    const group = await CommandGroup.findById(req.params.id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    // Update only provided fields
    if (title) group.title = title.trim();
    if (tag) group.tag = tag;
    if (commands) {
      const cleanedCommands = commands.filter((c) => c.cmd?.trim());
      if (cleanedCommands.length === 0)
        return res.status(400).json({
          success: false,
          message: "At least one valid command is required",
        });
      group.commands = cleanedCommands;
    }

    await group.save();

    res.json({
      success: true,
      message: "Command group updated",
      data: group,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// DELETE — DELETE /api/commands/:id
// ────────────────────────────────────────────
export const deleteGroup = async (req, res) => {
  try {
    const group = await CommandGroup.findByIdAndDelete(req.params.id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    res.json({
      success: true,
      message: "Command group deleted",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// ADD COMMAND TO GROUP — POST /api/commands/:id/add-command
// ────────────────────────────────────────────
export const addCommandToGroup = async (req, res) => {
  try {
    const { label, cmd } = req.body;
    if (!cmd?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Command text is required" });

    const group = await CommandGroup.findById(req.params.id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    group.commands.push({ label: label || "", cmd: cmd.trim() });
    await group.save();

    res.json({
      success: true,
      message: "Command added to group",
      data: group,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// REMOVE COMMAND FROM GROUP — DELETE /api/commands/:id/remove-command/:cmdId
// ────────────────────────────────────────────
export const removeCommandFromGroup = async (req, res) => {
  try {
    const group = await CommandGroup.findById(req.params.id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    const cmdIndex = group.commands.findIndex(
      (c) => c._id.toString() === req.params.cmdId
    );
    if (cmdIndex === -1)
      return res
        .status(404)
        .json({ success: false, message: "Command not found" });

    if (group.commands.length === 1)
      return res.status(400).json({
        success: false,
        message: "Cannot remove the only command. Delete the group instead.",
      });

    group.commands.splice(cmdIndex, 1);
    await group.save();

    res.json({
      success: true,
      message: "Command removed",
      data: group,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
