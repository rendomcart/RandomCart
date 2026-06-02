import Contact from '../models/Contact.model.js';
import sendEmail from '../utils/sendEmail.js';
import { contactReplyTemplate } from '../utils/emailTemplates.js';
import { sendNotification } from '../services/notification.service.js';
import { getIO } from '../config/socket.js';

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
export const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
    });

    // Notify Admin via Socket & Notification Service
    try {
      await sendNotification({
        role: 'admin',
        title: 'New Contact Message',
        message: `${name} (${email}) sent a message: "${subject}"`,
        type: 'SYSTEM',
        relatedEntityId: contact._id
      });

      const io = getIO();
      if (io) {
        io.to('admin-room').emit('new_contact_message', contact);
      }
    } catch (err) {
      console.error('Socket/Notification error on contact message:', err);
    }

    // Send auto-reply to the user
    try {
      await sendEmail({
        to: email,
        subject: `Re: ${subject} - RandomCart Support`,
        html: contactReplyTemplate(name),
      });
    } catch (emailErr) {
      console.error('Failed to send contact auto-reply email:', emailErr);
    }

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Private/Admin
export const getContactMessages = async (req, res, next) => {
  try {
    const messages = await Contact.find({}).sort('-createdAt');
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};
