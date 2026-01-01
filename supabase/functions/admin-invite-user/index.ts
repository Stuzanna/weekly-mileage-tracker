import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create admin client for user operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the requesting user's token
    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);

    console.log("User lookup result:", user?.id, userError?.message);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    console.log("Admin check result:", isAdmin, roleError?.message);

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the request body
    const { email, role = "user" } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role
    if (role !== "user" && role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be 'user' or 'admin'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Inviting user:", email, "with role:", role);

    // Invite the user using admin API
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: "https://weekly-mileage-tracker.vercel.app/auth",
    });

    if (inviteError) {
      console.error("Invite error:", inviteError.message);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User invited successfully:", inviteData.user?.id);

    // If role is admin, we need to update the user_roles table
    // The trigger will have already created a 'user' role, so we need to update it
    if (role === "admin" && inviteData.user) {
      const { error: updateRoleError } = await adminClient
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", inviteData.user.id);

      if (updateRoleError) {
        console.error("Error updating role:", updateRoleError.message);
        // Don't fail the request, the user was still invited
      } else {
        console.log("Role updated to admin for user:", inviteData.user.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation sent to ${email}`,
        user: {
          id: inviteData.user?.id,
          email: inviteData.user?.email,
          role: role,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in admin-invite-user:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
