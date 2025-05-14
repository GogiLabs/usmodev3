
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  inviteId: string;
  recipientEmail: string;
  senderEmail?: string;
  senderName?: string;
  siteUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteId, recipientEmail, senderEmail, senderName, siteUrl } = await req.json() as InviteEmailRequest;

    if (!inviteId || !recipientEmail || !siteUrl) {
      throw new Error("Missing required fields: inviteId, recipientEmail, or siteUrl");
    }

    console.log(`Sending invitation email to ${recipientEmail} for invite ${inviteId}`);
    
    // Generate the invite URL
    const inviteUrl = `${siteUrl}/invite?invite_id=${inviteId}`;
    const displayName = senderName || "Someone";
    const fromEmail = senderEmail || "invitations@us-mode.link";
    
    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: `UsMode <${fromEmail}>`,
      to: [recipientEmail],
      subject: `${displayName} has invited you to join UsMode`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366F1; text-align: center;">You've Been Invited!</h2>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            ${displayName} has invited you to collaborate on UsMode, a platform for couples to coordinate tasks and rewards.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #6366F1; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            Or copy and paste this link in your browser:<br>
            <a href="${inviteUrl}" style="color: #6366F1;">${inviteUrl}</a>
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            This invitation will expire in 7 days. If you believe you received this email by mistake, you can safely ignore it.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation email sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invite-email function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
