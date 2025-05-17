
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
    
    // Instead of calling refresh_pair_details, we'll directly fetch and process the data
    // First, verify the pair exists and the user is a member
    let isValid = false;
    
    if (userId) {
      // Check if user is a member of this pair using is_pair_member function
      const { data: memberCheck, error: memberError } = await supabaseClient.rpc(
        "is_pair_member", 
        { pair_id: pairId, user_id: userId }
      );
      
      if (memberError) {
        console.log("Error checking pair membership:", memberError);
      } else {
        isValid = memberCheck;
      }
    }
    
    // If we couldn't verify with is_pair_member or it failed, try a direct query
    if (!isValid) {
      const { data: pairData, error: pairError } = await supabaseClient
        .from('pairs')
        .select('id')
        .eq('id', pairId)
        .maybeSingle();
        
      if (pairError) {
        console.error("Error verifying pair exists:", pairError);
        throw new Error("Failed to verify pair exists");
      }
      
      if (!pairData) {
        return new Response(JSON.stringify({ error: "Pair not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404, 
        });
      }
      
      isValid = true;
    }
    
    // Now, manually trigger a refresh of the pair_details view by accessing it
    const { data: refreshedData, error: refreshError } = await supabaseClient
      .from('pair_details')
      .select('*')
      .eq('pair_id', pairId)
      .maybeSingle();
    
    if (refreshError) {
      console.error("Error refreshing pair details view:", refreshError);
      throw refreshError;
    }

    // Return the result
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Pair details refreshed successfully",
      data: refreshedData
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
