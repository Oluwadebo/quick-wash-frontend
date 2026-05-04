import express from "express";
import Message from "../models/Message";
import Order from "../models/Order";

const router = express.Router();

// Get messages for an order
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const messages = await Message.find({ orderId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post("/", async (req, res) => {
  try {
    const { orderId, senderId, senderRole, text, image } = req.body;
    
    // Verify order exists
    const order = await Order.findOne({ id: orderId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    const newMessage = new Message({
      orderId,
      senderId,
      senderRole,
      text,
      image
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
