import type { NextFunction, Request, Response } from "express";
import { clerkClient, getAuth } from "@clerk/express";

export async function requireOwner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const configuredEmail = process.env.ADMIN_OWNER_EMAIL?.trim().toLowerCase();
  if (!configuredEmail) {
    res.status(503).json({ error: "Owner admin email is not configured." });
    return;
  }

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to access the admin area." });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId,
    );

    if (
      !primaryEmail ||
      primaryEmail.verification?.status !== "verified" ||
      primaryEmail.emailAddress.trim().toLowerCase() !== configuredEmail
    ) {
      res.status(403).json({ error: "This account is not approved for admin access." });
      return;
    }

    next();
  } catch (error) {
    req.log.error({ error, userId }, "Could not verify admin account");
    res.status(503).json({ error: "Admin access could not be verified. Try again shortly." });
  }
}
