import express from "express";
import QRCode from "qrcode";
import Asset from "../models/asset.js";
import protectRoute from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/assets
// @desc    Create new asset
router.post("/", protectRoute, async (req, res) => {
  try {
    const { weaponType, weaponSerialNumber, assignedTo, issuedBy } = req.body;

    const existing = await Asset.findOne({ weaponSerialNumber });
    if (existing) {
      return res.status(400).json({ message: "Weapon serial number already exists" });
    }

    // Generate QR Code as base64 string
    const qrCode = await QRCode.toDataURL(weaponSerialNumber);

    const asset = new Asset({
      weaponType,
      weaponSerialNumber,
      assignedTo,
      issuedBy,
      qrCode, // Storing QR code base64 in DB
    });

    await asset.save();

    res.status(201).json(asset);
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @route   GET /api/assets
// @desc    Get all assets with pagination
router.get("/", protectRoute, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const assets = await Asset.find()
      .skip(skip)
      .limit(limit)
      .populate("assignedTo", "username email")
      .populate("issuedBy", "username email");

    const totalAssets = await Asset.countDocuments();

    res.status(200).json({
      assets,
      currentPage: page,
      totalPages: Math.ceil(totalAssets / limit),
      totalAssets,
    });
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @route   GET /api/assets/:id
// @desc    Get single asset by ID
router.get("/:id", protectRoute, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate("assignedTo", "username email")
      .populate("issuedBy", "username email");

    if (!asset) return res.status(404).json({ message: "Asset not found" });

    res.status(200).json(asset);
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @route   GET /api/assets/serial/:serialNo
// @desc    Get asset by weaponSerialNumber (for QR scan)
router.get("/serial/:serialNo", protectRoute, async (req, res) => {
  try {
    const asset = await Asset.findOne({ weaponSerialNumber: req.params.serialNo })
      .populate("assignedTo", "username email")
      .populate("issuedBy", "username email");

    if (!asset) return res.status(404).json({ message: "Asset not found" });

    res.status(200).json(asset);
  } catch (error) {
    console.error("Error fetching asset by serial number:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @route   PUT /api/assets/:id
// @desc    Update an asset
router.put("/:id", protectRoute, async (req, res) => {
  try {
    const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updatedAsset) return res.status(404).json({ message: "Asset not found" });

    res.status(200).json(updatedAsset);
  } catch (error) {
    console.error("Error updating asset:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @route   DELETE /api/assets/:id
// @desc    Delete an asset
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const deletedAsset = await Asset.findByIdAndDelete(req.params.id);
    if (!deletedAsset) return res.status(404).json({ message: "Asset not found" });

    res.status(200).json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// @route   POST /api/assets/:id/maintenance
// @desc    Add maintenance entry to an asset
router.post("/:id/maintenance", protectRoute, async (req, res) => {
  try {
    const { description, status } = req.body;

    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: "Asset not found" });

    asset.maintenanceLog.push({ description, status });
    await asset.save();

    res.status(200).json(asset);
  } catch (error) {
    console.error("Error adding maintenance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
