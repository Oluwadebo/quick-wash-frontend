import express from "express";
import Message from "../models/Message";
import Order from "../models/Order";
import User from "../models/User";

const router = express.Router();

// Get messages for an order
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const messages = await Message.find({ orderId }).sort({ createdAt: 1 });
    
    // Enrich with senderName if missing
    const enrichedMessages = await Promise.all(messages.map(async (msg: any) => {
      const msgObj = msg.toObject();
      if (!msgObj.senderName) {
        const user = await User.findOne({ uid: msgObj.senderId });
        if (user) {
          msgObj.senderName = user.fullName;
        }
      }
      return msgObj;
    }));

    res.json(enrichedMessages);
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

    // Enrich with senderName if missing
    const enrichedMessages = await Promise.all(messages.map(async (msg: any) => {
      const msgObj = msg.toObject();
      if (!msgObj.senderName) {
        const user = await User.findOne({ uid: msgObj.senderId });
        if (user) {
          msgObj.senderName = user.fullName;
        }
      }
      return msgObj;
    }));

    res.json(enrichedMessages);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get all unique conversations for a user
router.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all messages involving this user without an orderId
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      orderId: { $exists: false }
    }).sort({ createdAt: -1 });

    const chats: any[] = [];
    const seenUsers = new Set();

    for (const msg of messages) {
      const isSender = msg.senderId === userId;
      const otherUserId = isSender ? msg.receiverId : msg.senderId;
      
      if (otherUserId && !seenUsers.has(otherUserId)) {
        seenUsers.add(otherUserId);
        
        // Fetch other user details
        const otherUser = await User.findOne({ uid: otherUserId });
        
        // Robust name detection:
        // 1. Database name
        // 2. Name stored in message (if other user was the sender)
        // 3. Name stored in message as receiver (if authenticated user was the sender)
        // 4. Fallback to ID
        let detectedName = otherUser ? otherUser.fullName : null;
        
        if (!detectedName) {
          if (!isSender) {
            detectedName = msg.senderName;
          } else {
            detectedName = (msg as any).receiverName;
          }
        }

        const unreadCount = await Message.countDocuments({
          senderId: otherUserId,
          receiverId: userId,
          orderId: { $exists: false },
          isRead: false
        });

        chats.push({
          lastMessage: msg,
          otherUserId: otherUserId,
          otherUserName: detectedName || `User ${otherUserId.slice(0, 8)}`,
          otherUserRole: otherUser ? otherUser.role : (isSender ? (msg as any).receiverRole : msg.senderRole) || 'unknown',
          unreadCount
        });
      }
    }

    res.json(chats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Mark messages as read for a specific user and conversation
router.put("/mark-read", async (req, res) => {
  try {
    const { userId, otherUserId, orderId } = req.body;
    
    const query: any = {
      receiverId: userId,
      isRead: false
    };

    if (orderId) {
      query.orderId = orderId;
    } else if (otherUserId) {
      query.senderId = otherUserId;
      query.orderId = { $exists: false };
    }

    await Message.updateMany(query, { $set: { isRead: true } });
    res.json({ message: "Messages marked as read" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get total unread count for a user
router.get("/unread-count/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await Message.countDocuments({ receiverId: userId, isRead: false });
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Send a message
router.post("/", async (req, res) => {
  try {
    const { orderId, senderId, senderName, receiverId, receiverName, receiverRole, senderRole, text, image } = req.body;
    
    if (orderId) {
      const order = await Order.findOne({ id: orderId });
      if (!order) return res.status(404).json({ message: "Order not found" });
    }

    let finalSenderName = senderName;
    if (!finalSenderName) {
      const user = await User.findOne({ uid: senderId });
      if (user) {
        finalSenderName = user.fullName;
      }
    }

    let finalReceiverName = receiverName;
    let finalReceiverRole = receiverRole;
    if (receiverId && (!finalReceiverName || !finalReceiverRole)) {
      const rUser = await User.findOne({ uid: receiverId });
      if (rUser) {
        finalReceiverName = rUser.fullName;
        finalReceiverRole = rUser.role;
      }
    }

    const newMessage = new Message({
      orderId,
      senderId,
      senderName: finalSenderName,
      receiverId,
      receiverName: finalReceiverName,
      receiverRole: finalReceiverRole,
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
