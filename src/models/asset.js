import mongoose from "mongoose";

const maintenanceEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "in-progress"],
    default: "pending",
  },
});

const assetSchema = new mongoose.Schema(
  {
    weaponType: {
      type: String,
      required: true,
      trim: true,
    },
    weaponSerialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "issued", "maintenance", "decommissioned"],
      default: "active",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or "Soldier"
      required :true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // typically an officer
      required:true,
    },
    qrCode: {
      type: String, // Base64-encoded QR image or URL
      default: "",
    },
    maintenanceLog: [maintenanceEntrySchema],
  },
  { timestamps: true }
);

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;
