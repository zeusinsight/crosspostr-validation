import { createClient } from "../supabase/server";

/**
 * Get the authenticated user from a request
 * Uses the admin client with service_role key as per user rules
 * @param req The Next.js request object
 * @returns The authenticated user and supabase client
 */
export async function getUserFromRequest() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  return { user, supabase };
}
