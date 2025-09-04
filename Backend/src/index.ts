import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import sgMail from '@sendgrid/mail';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bodyParser from 'body-parser'; 
import connectDB from './db/connect';
import User from "./models/schema";

dotenv.config();
const newLocal = express();
const app = newLocal;
const PORT = process.env.PORT || 4000;
app.use(express.json());
app.use(bodyParser.json());
// ✅ Middleware
app.use(express.json());
if (process.env.ENABLE_CORS === 'true') {
  app.use(cors({ origin: process.env.CORS_ORIGIN }));
}

// ✅ Validate environment variables
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is missing in .env');
}
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing in .env');
}

// ✅ Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ✅ In-memory OTP store (use Redis or DB in production)
const otpStore = new Map<string, { otp: string; expires: number }>();

// ✅ Root route
app.get('/', (req: Request, res: Response) => {
  res.send('API is working! Use /send-otp and /verify-otp endpoints.');
});

// ✅ Route: Send OTP
app.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // ✅ Check if user exists in MongoDB
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ error: 'User does not exist. Please sign up first.' });
    }

    // ✅ Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 }); // expires in 5 minutes

    // ✅ Send OTP via SendGrid
    const msg = {
      to: email,
      from: 'homebroadband9@gmail.com', // verified sender email
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    };

    await sgMail.send(msg);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/send-otp-signup', async (req: Request, res: Response) => {
  try {
       const { name, dob, email } = req.body;

    if (!name || !dob || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, { otp, expires: Date.now() + 5 * 60 * 1000 });

    const msg = {
      to: email,
      from: 'homebroadband9@gmail.com', // ✅ Verified sender
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    };

    await sgMail.send(msg);
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newUser = new User({
      name,
      dob: new Date(dob),
      email,
      notes: [], // Empty notes initially
    });

    const savedUser = await newUser.save();

    // ✅ Send OTP logic
    const otpSent = true; // Assume OTP was sent successfully

    // ✅ Single combined response
    res.status(201).json({
      message: "User created and OTP sent successfully",
      id: savedUser._id, // Return user ID
      otpStatus: otpSent ? "OTP sent" : "OTP failed",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
});

// ✅ Route: Verify OTP
app.post('/verify-otp', async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ error: 'OTP not found or expired' });

  if (record.expires < Date.now()) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  otpStore.delete(email);

  // ✅ Fetch user to get _id
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // ✅ Include userId in JWT payload
const token = jwt.sign(
  { id: user._id!.toString(), email },
  process.env.JWT_SECRET as string,
  { expiresIn: '1h' }
);

res.json({ message: 'OTP verified successfully', token, userId: user._id!.toString() });

});

// ✅ Add Note route

// ✅ Protected route example
app.get('/protected', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    res.json({ message: 'Protected content', user });
  });
});

const authenticate = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; email: string };
    (req as any).userId = decoded.id; // ✅ Attach userId to request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Update the POST /notes route
app.post('/notes', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Note text is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.notes.push({ text });
    await user.save();

    // Return the updated notes array with proper structure
    const formattedNotes = user.notes.map(note => ({
      id: note._id,
      content: note.text
    }));

    res.status(201).json({ 
      message: "Note added successfully", 
      notes: formattedNotes 
    });
    
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Update the GET /notes route
app.get('/notes', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format notes to match frontend interface
    const formattedNotes = user.notes.map(note => ({
      id: note._id,
      content: note.text
    }));

    res.json({ notes: formattedNotes,
      name: user.name,
    email: user.email,
     });
    
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: "Server error", error });
  }
});

// Update the DELETE route
// Import ObjectId at the top of the file with other imports
import { ObjectId } from 'mongodb';

// Replace the existing delete route with this updated version
import mongoose from 'mongoose'; // Add this import at the top with other imports

app.delete('/notes/:noteId', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { noteId } = req.params;

    console.log('Attempting to delete note:', { userId, noteId }); // Debug log

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user document using MongoDB's $pull operator
    const result = await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          notes: { _id: new mongoose.Types.ObjectId(noteId) }
        }
      },
      { new: true } // Return the updated document
    );

    if (!result) {
      return res.status(404).json({ message: "Failed to delete note" });
    }

    // Format the remaining notes
    const formattedNotes = result.notes.map(note => ({
      id: note._id,
      content: note.text
    }));

    res.json({ 
      message: "Note deleted successfully", 
      notes: formattedNotes 
    });

  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ 
      message: "Server error", 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});




interface ConnectDB {
  (): Promise<void>;
}

interface MongoError {
  message: string;
  stack?: string;
  [key: string]: any;
}

(connectDB as ConnectDB)()
  .then((): void => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, (): void => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err: MongoError): void => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });
