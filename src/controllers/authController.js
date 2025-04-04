// controllers/AuthController.js
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "../config/firebase.js";
import { google } from "googleapis";
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL}/auth/google/callback`
);
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  getFirestore,
  arrayUnion,
} from "firebase/firestore";

class AuthController {
  async signUp(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Don't send sensitive data to client
      const userResponse = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      };

      res.status(201).json({
        message: "Sign-up successful",
        user: userResponse,
      });
    } catch (error) {
      console.error("Sign-up error:", error);

      // Handle specific Firebase errors
      let errorMessage = "Sign-up failed";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already in use";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      }

      res.status(400).json({
        message: errorMessage,
        error: error.code,
      });
    }
  }

  async signIn(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Get the Firebase ID token
      const idToken = await user.getIdToken();

      // Set token expiration (1 hour - default Firebase token lifetime)
      const expiresIn = 60 * 60 * 1000; // 1 hour in milliseconds

      // Create session or token as needed
      const userResponse = {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        token: idToken,
        expiresIn,
      };

      res.json({
        message: "Sign-in successful",
        user: userResponse,
      });
    } catch (error) {
      console.error("Sign-in error:", error);

      let errorMessage = "Sign-in failed";
      if (error.code === "auth/user-not-found") {
        errorMessage = "User not found";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Invalid password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "Account temporarily disabled due to many failed attempts";
      }

      res.status(401).json({
        message: errorMessage,
        error: error.code,
      });
    }
  }

  async signOut(req, res) {
    try {
      await signOut(auth);
      res.json({ message: "Sign-out successful" });
    } catch (error) {
      console.error("Sign-out error:", error);
      res.status(500).json({
        message: "Sign-out failed",
        error: error.message,
      });
    }
  }

  async authenticateGoogle(req, res) {
    try {
      const { code, state } = req.query;

      if (!code) throw new Error("Authorization code missing");

      const originalUrl = JSON.parse(decodeURIComponent(state));
      const customData = originalUrl.customData;

      const db = getFirestore();
      const q = query(
        collection(db, "urls"),
        where("shortCode", "==", customData) // Assuming customData contains the value to match
      );
      const querySnapshot = await getDocs(q);
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      console.log("Google User Info:", userInfo);
      try {
        if (querySnapshot.empty) {
          console.log("No matching document found for shortCode:", customData);
          return;
        }
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            clickedUserData: arrayUnion({
              name: userInfo.name,
              email: userInfo.email,
              timestamp: new Date().toISOString(),
            }),
          });
        });
      } catch (error) {
        console.error("Error updating click count:", error);
      }

      // TODO: Store user info or session
      const redirectTo = state?.startsWith("/") ? state : "/";
      res.redirect(`${originalUrl.originalUrl}`);
    } catch (err) {
      console.error("OAuth callback error:", err);
      res.redirect(`/error?message=${encodeURIComponent(err.message)}`);
    }
  }
  async authGoogle(req, res) {
    const { returnTo } = req.query;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams(
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: `${process.env.BASE_URL}/auth/google/callback`,
        response_type: "code",
        scope: "openid email profile",
        state: returnTo || "/",
        prompt: "select_account",
      }
    )}`;
    res.redirect(authUrl);
  }
}

export default new AuthController();
