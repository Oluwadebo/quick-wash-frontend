import express from "express";
import Order from "../models/Order";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { userId, role } = req.query;
    let query = {};
    
    if (role === 'customer') query = { customerUid: userId };
    else if (role === 'vendor') query = { vendorId: userId };
    else if (role === 'rider') query = { riderUid: userId };

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
