import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["irrigation", "fertilizer", "spray", "harvest", "soil", "pruning", "other"],
      default: "other",
    },
    date: {
      type: Date,
      required: [true, "Task date is required"],
    },
    time: {
      type: String,
      default: "08:00",
    },
    field: {
      type: String,
      trim: true,
      default: "",
    },
    crop: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    done: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    isRecommendation: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;