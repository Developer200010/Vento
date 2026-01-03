import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "../../../../config/database";
import User from "../../../../models/user";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    // Runs when Google sends user info back
    async signIn({ user, account }) {
      try {
        await connectDB();

        // Check if user exists with this Google ID
        let existingUser = await User.findOne({ googleId: account.providerAccountId });

        if (!existingUser) {
          // Check if email already exists (from password signup)
          existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            // Link Google account to existing user
            existingUser.googleId = account.providerAccountId;
            existingUser.profilePicture = user.image;
            existingUser.authProvider = "google";
            await existingUser.save();
          } else {
            // Create new user
            existingUser = await User.create({
              email: user.email,
              username: user.email.split("@")[0], // Generate username from email
              googleId: account.providerAccountId,
              profilePicture: user.image,
              authProvider: "google",
              // No password for Google users
            });
          }
        }

        // Store userId in the token for later use
        user.id = existingUser._id.toString();
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },

    // Add userId to JWT token
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },

    // Add userId to session
    async session({ session, token }) {
      session.userId = token.userId;
      return session;
    },
  },

  pages: {
    signIn: "/sign-in", // Redirect to your login page
    error: "/sign-in",  // Redirect errors to login
  },

  session: {
    strategy: "jwt", // Use JWT (same as your system)
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
