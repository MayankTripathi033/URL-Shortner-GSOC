import express, { query } from "express";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js";
import urlRoutes from "./routes/urlRoutes.js";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./config/firebase-admin.json" assert { type: "json" };
import dotenv from "dotenv";
import session from "express-session";
import { google } from "googleapis";
dotenv.config();

// Initialize Firebase
initializeApp({
  credential: cert(serviceAccount),
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL}/auth/google/callback`
);

const db = getFirestore();
const app = express();
const PORT = process.env.PORT || 3000;

const router = express.Router();

// Middleware
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Register Routes
app.use("/auth", authRoutes); // Use the router directly
app.use("/url", urlRoutes); // Same for urlRoutes
// authRoutes.js
// app.get("/auth/google", (req, res) => {
//   const { returnTo } = req.query;
//   const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
//     {
//       client_id: process.env.GOOGLE_CLIENT_ID,
//       redirect_uri: `${process.env.BASE_URL}/auth/google/callback`,
//       response_type: "code",
//       scope: "openid email profile",
//       state: returnTo || "/",
//       prompt: "select_account",
//     }
//   )}`;
//   res.redirect(authUrl);
// });

// // ✅ Callback Route — correct path
// app.get("/auth/google/callback", async (req, res) => {
//   try {
//     const { code, state } = req.query;

//     if (!code) throw new Error("Authorization code missing");

//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);

//     const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
//     const { data: userInfo } = await oauth2.userinfo.get();

//     console.log("Google User Info:", userInfo);

//     // TODO: Store user info or session
//     const redirectTo = state?.startsWith("/") ? state : "/";
//     console.log("Redirecting to:", redirectTo);
//     res.redirect(`${state}`);
//   } catch (err) {
//     console.error("OAuth callback error:", err);
//     res.redirect(`/error?message=${encodeURIComponent(err.message)}`);
//   }
// });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
