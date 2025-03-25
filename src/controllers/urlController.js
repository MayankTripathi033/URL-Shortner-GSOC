// src/controllers/urlController.js
import { customAlphabet } from "nanoid";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import dotenv from "dotenv";
import { google } from "googleapis";
dotenv.config();
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL}/auth/google/callback`
);

export class UrlController {
  constructor(db) {
    this.db = db;
    this.nanoid = customAlphabet(
      "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz",
      6
    );

    // Bind methods to maintain context
    this.shortenUrl = this.shortenUrl.bind(this);
    this.getOriginalUrl = this.getOriginalUrl.bind(this);
  }

  generateShortUrl() {
    const shortCode = this.nanoid();
    return {
      shortCode,
      shortUrl: `http://localhost:3000/url/${shortCode}`,
    };
  }

  async shortenUrl(req, res) {
    try {
      const { originalUrl } = req.body;
      const { uid, email } = req.user; // Get both uid and email from auth

      if (!originalUrl) {
        return res.status(400).json({ error: "Original URL is required" });
      }

      // Validate URL format
      try {
        new URL(originalUrl);
      } catch (e) {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      // Generate short URL with expiration (1 hour from now)
      const { shortCode, shortUrl } = this.generateShortUrl();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiration

      // Create access tracking object
      const accessLog = {
        accesses: [],
        totalClicks: 0,
      };

      // Add new document to Firestore
      const docRef = await addDoc(collection(this.db, "urls"), {
        shortCode,
        shortUrl,
        originalUrl,
        userId: uid,
        userEmail: email, // Store creator's email for reference
        createdAt: new Date().toISOString(),
        expiresAt, // Expiration timestamp
        clicks: 0,
        accessLog, // Initialize access log
        isActive: true,
      });

      res.status(201).json({
        message: "URL shortened successfully",
        shortUrl,
        shortCode,
        id: docRef.id,
        expiresAt,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${shortUrl}`, // Optional QR code
      });
    } catch (error) {
      console.error("Error shortening URL:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }
  async getOriginalUrl(req, res) {
    try {
      const { shortCode } = req.params;

      // 1. Find the URL document
      const q = query(
        collection(this.db, "urls"),
        where("shortCode", "==", shortCode)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return res.status(404).json({ error: "Short URL not found" });
      }

      const doc = querySnapshot.docs[0];
      const urlData = doc.data();

      // 2. Check expiration
      if (new Date(urlData.expiresAt) < new Date()) {
        await updateDoc(doc.ref, { isActive: false });
        return res.status(410).json({ error: "This URL has expired" });
      }

      console.log("req.user:", req.params, urlData);

      if (
        !req.user ||
        !req.user.providerData?.some((p) => p.providerId === "google.com")
      ) {
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
          {
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: `${process.env.BASE_URL}/auth/google/callback`,
            response_type: "code",
            scope: "openid email profile",
            state: urlData.originalUrl, // Preserve the shortCode
            prompt: "select_account",
            access_type: "offline",
          }
        )}`;

        return res.redirect(googleAuthUrl);
      }

      // 5. Redirect to original URL
      res.redirect(urlData.originalUrl);
    } catch (error) {
      console.error("Error retrieving URL:", error);
      res.status(500).json({
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

export default UrlController;
