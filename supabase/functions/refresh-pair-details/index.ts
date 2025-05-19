
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
    // Use order by id to prevent the PGRST109 error
    const { data: refreshData, error: refreshError } = await supabaseClient
      .from('pair_details')
      .select('*')
      .eq('pair_id', pairId)
      .order('pair_id')
      .maybeSingle();

    if (refreshError) {
      throw refreshError;
    }

    // Now check if we need to update the pair_details manually
    if (!refreshData) {
      // Manually construct the pair details since the view might be delayed
      const { data: user1Data, error: user1Error } = await supabaseClient
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', pairData.user_1_id)
        .single();
        
      if (user1Error) {
        console.error("Error fetching user 1 profile:", user1Error);
      }
      
      let user2Data = null;
      if (pairData.user_2_id) {
        const { data: user2Result, error: user2Error } = await supabaseClient
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('id', pairData.user_2_id)
          .single();
          
        if (user2Error) {
          console.error("Error fetching user 2 profile:", user2Error);
        } else {
          user2Data = user2Result;
        }
      }
      
      // Construct the response manually
      const manualPairDetails = {
        pair_id: pairData.id,
        user_1_id: pairData.user_1_id,
        user_2_id: pairData.user_2_id,
        user_1_name: user1Data?.display_name || null,
        user_1_avatar: user1Data?.avatar_url || null,
        user_2_name: user2Data?.display_name || null,
        user_2_avatar: user2Data?.avatar_url || null,
        created_at: pairData.created_at
      };
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Pair details manually constructed",
          data: manualPairDetails
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
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
