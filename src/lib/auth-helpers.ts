import { auth, currentUser } from "@clerk/nextjs/server";

export interface AuthContext {
  userId: string;
  isAdmin: boolean;
  user: unknown;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();

  if (!user) {
    return null;
  }

  // Check if user has admin role in Clerk's public metadata
  const isAdmin = user.publicMetadata?.siteRole === "admin";

  return {
    userId,
    isAdmin,
    user,
  };
}

export function checkAdmin(authContext: AuthContext | null): boolean {
  return authContext?.isAdmin ?? false;
}
