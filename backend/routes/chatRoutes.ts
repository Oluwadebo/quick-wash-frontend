import express from "express";
import Message from "../models/Message";
import Order from "../models/Order";

const router = express.Router();

// Get messages for an order
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const messages = await Message.find({ orderId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages for direct conversation between two users
router.get("/conversation/:userA/:userB", async (req, res) => {
  try {
    const { userA, userB } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA }
      ],
      orderId: { $exists: false }
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post("/", async (req, res) => {
  try {
    const { orderId, senderId, receiverId, senderRole, text, image } = req.body;
    
    if (orderId) {
      const order = await Order.findOne({ id: orderId });
      if (!order) return res.status(404).json({ message: "Order not found" });
    }

    const newMessage = new Message({
      orderId,
      senderId,
      receiverId,
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
