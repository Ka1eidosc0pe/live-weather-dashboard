import { clerkMiddleware } from "@clerk/nextjs/server";

// Auth is enforced in the UI (signed-out visitors see the landing view) and by Supabase RLS.
// /preview is a public, Clerk-free playground for the animated scenes.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!preview|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
