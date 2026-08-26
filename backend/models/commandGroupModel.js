import mongoose from "mongoose";

// ── Sub-schema: individual command inside a group ──────────────────────────
const CommandSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      default: "",
      trim: true,
    },
    cmd: {
      type: String,
      required: [true, "Command text is required"],
      trim: true,
    },
  },
  { _id: true }
);

// ── Main schema: a command group (title + tag + many commands) ─────────────
const CommandGroupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    tag: {
      type: String,
      enum: ["bash", "git", "docker", "npm", "python", "other"],
      default: "bash",
    },
    commands: {
      type: [CommandSchema],
      validate: {
        validator: (arr) => arr.length >= 1,
        message: "At least one command is required",
      },
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
  }
);

const CommandGroup = mongoose.model("CommandGroup", CommandGroupSchema);

export default CommandGroup;
