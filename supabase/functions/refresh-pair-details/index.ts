
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default when deployed.
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API SERVICE ROLE KEY - env var exported by default when deployed.
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get request body
    const requestData = await req.json();
    const { pairId, userId } = requestData;

    console.log("Refreshing pair details for:", { pairId, userId });

    if (!pairId) {
      throw new Error("Missing pair_id parameter");
    }

    // First, check if the user is part of the pair
    const { data: pairData, error: pairError } = await supabaseClient
      .from('pairs')
      .select('*')
      .eq('id', pairId)
      .single();

    if (pairError) {
      throw pairError;
    }

    if (!pairData) {
      throw new Error(`Pair with ID ${pairId} not found`);
    }

    // Check if the user is part of this pair
    const isUserInPair = pairData.user_1_id === userId || pairData.user_2_id === userId;
    if (!isUserInPair && userId) {
      throw new Error("User is not part of this pair");
    }

    // Force refresh of the pair_details view by making a direct query to it
    const { data: refreshData, error: refreshError } = await supabaseClient
      .from('pair_details')
      .select('*')
      .eq('pair_id', pairId)
      .maybeSingle();

    if (refreshError) {
      throw refreshError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pair details refreshed successfully",
        data: refreshData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error refreshing pair details:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "An error occurred while refreshing pair details" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
