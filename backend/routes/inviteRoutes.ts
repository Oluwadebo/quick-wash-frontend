import express from "express";
import AdminInvite from "../models/AdminInvite";
import User from "../models/User";
import crypto from "crypto";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, role } = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const invite = await AdminInvite.create({
      email,
      role: role || 'admin',
      token,
      expiresAt: expires,
      isUsed: false
    });

    res.json({ message: "Invite created", token });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/verify/:token", async (req, res) => {
  try {
    const invite = await AdminInvite.findOne({ 
      token: req.params.token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });
    if (!invite) return res.status(404).json({ message: "Invalid or expired invite" });
    res.json(invite);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
