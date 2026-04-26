import express from "express";
import User from "../models/User";

const router = express.Router();

// Get all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get single user
router.get("/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update user
router.patch("/:uid", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { $set: req.body },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
