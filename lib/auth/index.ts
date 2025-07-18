import { createClient } from "../supabase/server";
import { NextRequest } from "next/server";

/**
 * Get the authenticated user from a request
 * Uses the admin client with service_role key as per user rules
 * @param req The Next.js request object
 * @returns The authenticated user and supabase client
 */
export async function getUserFromRequest(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  
  return { user, supabase };
}
