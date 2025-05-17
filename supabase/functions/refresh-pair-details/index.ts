
// This edge function will refresh the pair details view when called

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key since we're not requiring auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { 
            // Still pass along any auth headers that might be present
            Authorization: req.headers.get("Authorization") || ""
          },
        },
      }
    );

    // Extract request payload
    const { pairId, userId } = await req.json();
    
    if (!pairId) {
      return new Response(JSON.stringify({ error: "Missing required parameter: pairId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // No auth verification - proceed directly to refreshing the pair details
    console.log("Refreshing pair details for:", { pairId, userId });
    
    // Call the refresh function
    const { data, error } = await supabaseClient.rpc("refresh_pair_details", {
      pair_id: pairId,
      user_id: userId 
    });

    if (error) {
      console.error("Error refreshing pair details:", error);
      throw error;
    }

    // Return the result
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Pair details refreshed successfully",
      data
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Function execution error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
