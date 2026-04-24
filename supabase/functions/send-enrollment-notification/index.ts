const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_EMAIL = "info@dandelionwildschooling.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { children, parentName, parentEmail, parentPhone, grandTotal } = await req.json();

    const childList = children.map((ch: any) => {
      const days = (ch.selected_days || []).length;
      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">${ch.child_first_name} ${ch.child_last_name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">${ch.program_name || "—"}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">${days} days${ch.lunch ? " + Lunch" : ""}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">$${ch.grand_total}</td>
        </tr>`;
    }).join("");

    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #4d5a2c; padding: 24px; text-align: center;">
          <h1 style="color: #fff; font-weight: 400; font-size: 22px; margin: 0;">New Enrollment — Wild Child Nosara</h1>
        </div>
        <div style="padding: 28px 24px; background: #f5f0e8;">
          <h2 style="font-weight: 400; color: #4d5a2c; margin: 0 0 16px;">Parent Details</h2>
          <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <tr><td style="padding: 8px 12px; color: #7a7a9a; width: 140px;">Name</td><td style="padding: 8px 12px;">${parentName || "—"}</td></tr>
            <tr style="background: #f5f0e8;"><td style="padding: 8px 12px; color: #7a7a9a;">Email</td><td style="padding: 8px 12px;">${parentEmail}</td></tr>
            <tr><td style="padding: 8px 12px; color: #7a7a9a;">Phone</td><td style="padding: 8px 12px;">${parentPhone || "—"}</td></tr>
          </table>

          <h2 style="font-weight: 400; color: #4d5a2c; margin: 0 0 16px;">Children Enrolled</h2>
          <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <thead>
              <tr style="background: #4d5a2c;">
                <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Child</th>
                <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Program</th>
                <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Schedule</th>
                <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>${childList}</tbody>
          </table>

          <div style="background: #0f1f5c; color: #fff; padding: 16px 20px; border-radius: 8px; display: flex; justify-content: space-between;">
            <span style="font-size: 16px;">Total Paid</span>
            <strong style="font-size: 18px; color: #c4682a;">$${grandTotal}</strong>
          </div>

          <p style="margin-top: 24px; font-size: 13px; color: #7a7a9a; text-align: center;">
            View all enrollments at your <a href="https://wildchild-registration-xanorchid-svgs-projects.vercel.app/admin" style="color: #6b7a3f;">admin panel</a>
          </p>
        </div>
      </div>`;

    // Send notification to Wild Child
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Wild Child Nosara <onboarding@resend.dev>",
        to: [NOTIFY_EMAIL],
        subject: `New Enrollment — ${children.map((c: any) => c.child_first_name).join(" & ")}`,
        html,
      }),
    });

    // Send confirmation to parent
    const parentHtml = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #4d5a2c; padding: 24px; text-align: center;">
          <h1 style="color: #fff; font-weight: 400; font-size: 22px; margin: 0;">You're enrolled at Wild Child Nosara!</h1>
        </div>
        <div style="padding: 28px 24px; background: #f5f0e8;">
          <p style="font-size: 15px; line-height: 1.7; color: #3d3d5c;">
            Dear ${parentName || "Family"},<br/><br/>
            Thank you for enrolling ${children.map((c: any) => c.child_first_name).join(" and ")} at Wild Child Nosara.
            We are so excited to welcome your family into our community!
          </p>

          <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin: 20px 0;">
            <thead>
              <tr style="background: #4d5a2c;">
                <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Child</th>
                <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Program</th>
                <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>${childList}</tbody>
          </table>

          <div style="background: #0f1f5c; color: #fff; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
            <span style="font-size: 16px;">Total Paid: </span>
            <strong style="font-size: 18px; color: #c4682a;">$${grandTotal}</strong>
          </div>

          <p style="font-size: 14px; color: #3d3d5c; line-height: 1.7;">
            If you have any questions, please don't hesitate to reach out at
            <a href="mailto:info@dandelionwildschooling.com" style="color: #6b7a3f;">info@dandelionwildschooling.com</a>
          </p>
          <p style="font-size: 15px; color: #4d5a2c; margin-top: 24px;">Pura vida! 🌿<br/><em>The Wild Child Nosara Team</em></p>
        </div>
      </div>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Wild Child Nosara <onboarding@resend.dev>",
        to: [parentEmail],
        subject: "Welcome to Wild Child Nosara — Enrollment Confirmed!",
        html: parentHtml,
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
