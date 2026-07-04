const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_EMAIL = "info@dandelionwildschooling.com";

// ── Weekday math (timezone-safe — Sakamoto's algorithm, no Date objects) ──
const DOW_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function dowOf(y: number, m: number, d: number): number {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  if (m < 3) y -= 1;
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[m - 1] + d) % 7;
}

function weekdaysFromDates(dates: string[]): string {
  const present = new Set<number>();
  dates.forEach((ds) => {
    const [y, m, d] = ds.split("-").map(Number);
    present.add(dowOf(y, m, d));
  });
  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun
  return order.filter((o) => present.has(o)).map((o) => DOW_ABBR[o]).join(", ") || "—";
}

function formatSessionDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return `${DOW_FULL[dowOf(y, m, d)]}, ${MONTHS[m - 1]} ${d}, ${y}`;
}

// ── Program hours + location ──
const ENROLLMENT_LOCATION = "Dandelion Wildschooling Playground, Nosara";
const HARMONY_LOCATION = "Harmony Co-Op Playground (behind La Ventanita / near the CAMPO entrance), Nosara";
const HARMONY_TIME = "8:30am – 11:30am";
const DEFAULT_HOURS = "8:00am – 2:00pm";
const PROGRAM_HOURS: Record<string, string> = {
  "tiny-roots": "8:00am – 11:00am",
};
function hoursFor(programId: string): string {
  return PROGRAM_HOURS[programId] || DEFAULT_HOURS;
}

const TIER_LABELS: Record<string, string> = {
  harmony: "Harmony Member (Free)",
  wildchild: "Wild Child Family ($50)",
  local: "Costa Rican Family ($64)",
  general: "Open to All ($80)",
};

async function sendEmail(to: string[], subject: string, html: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Wild Child Nosara <onboarding@resend.dev>", to, subject, html }),
  });
}

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
    const body = await req.json();
    const type = body.type || "enrollment";

    // ═══════════════════════════════════════════════════════════
    // HARMONY CO-OP BOOKING EMAIL
    // ═══════════════════════════════════════════════════════════
    if (type === "harmony") {
      const { sessionDate, children, parentName, parentEmail, parentPhone, tier, pricePaid } = body;

      const childRows = (children || []).map((c: any) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">${c.name}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">${c.dob || "—"}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">${c.allergies || "None noted"}</td>
        </tr>`).join("");

      const sessionDateFmt = formatSessionDate(sessionDate);
      const tierLabel = TIER_LABELS[tier] || tier;

      const infoTable = `
        <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin: 20px 0;">
          <tr><td style="padding: 8px 12px; color: #7a7a9a; width: 140px;">Date</td><td style="padding: 8px 12px;"><strong>${sessionDateFmt}</strong></td></tr>
          <tr style="background: #f5f0e8;"><td style="padding: 8px 12px; color: #7a7a9a;">Time</td><td style="padding: 8px 12px;">${HARMONY_TIME}</td></tr>
          <tr><td style="padding: 8px 12px; color: #7a7a9a;">Location</td><td style="padding: 8px 12px;">${HARMONY_LOCATION}</td></tr>
          <tr style="background: #f5f0e8;"><td style="padding: 8px 12px; color: #7a7a9a;">Tier</td><td style="padding: 8px 12px;">${tierLabel}</td></tr>
        </table>`;

      const childTable = `
        <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          <thead>
            <tr style="background: ${"#427889"};">
              <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Child</th>
              <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">DOB</th>
              <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Allergies</th>
            </tr>
          </thead>
          <tbody>${childRows}</tbody>
        </table>`;

      // Staff notification
      await sendEmail([NOTIFY_EMAIL], `New Harmony Co-Op Booking — ${sessionDateFmt}`, `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
          <div style="background: #427889; padding: 24px; text-align: center;">
            <h1 style="color: #fff; font-weight: 400; font-size: 22px; margin: 0;">New Harmony Co-Op Booking</h1>
          </div>
          <div style="padding: 28px 24px; background: #f5f0e8;">
            <h2 style="font-weight: 400; color: #4d5a2c; margin: 0 0 8px;">Parent Details</h2>
            <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin-bottom: 12px;">
              <tr><td style="padding: 8px 12px; color: #7a7a9a; width: 140px;">Name</td><td style="padding: 8px 12px;">${parentName || "—"}</td></tr>
              <tr style="background: #f5f0e8;"><td style="padding: 8px 12px; color: #7a7a9a;">Email</td><td style="padding: 8px 12px;">${parentEmail}</td></tr>
              <tr><td style="padding: 8px 12px; color: #7a7a9a;">Phone</td><td style="padding: 8px 12px;">${parentPhone || "—"}</td></tr>
            </table>
            <h2 style="font-weight: 400; color: #4d5a2c; margin: 16px 0 8px;">Session</h2>
            ${infoTable}
            <h2 style="font-weight: 400; color: #4d5a2c; margin: 0 0 8px;">Children Attending</h2>
            ${childTable}
            <div style="background: #0f1f5c; color: #fff; padding: 16px 20px; border-radius: 8px; display: flex; justify-content: space-between;">
              <span style="font-size: 16px;">Amount Paid</span>
              <strong style="font-size: 18px; color: #c4682a;">${pricePaid === 0 ? "Free" : "$" + pricePaid}</strong>
            </div>
          </div>
        </div>`);

      // Parent confirmation
      await sendEmail([parentEmail], `Harmony Co-Op — You're Booked for ${sessionDateFmt}!`, `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
          <div style="background: #427889; padding: 24px; text-align: center;">
            <h1 style="color: #fff; font-weight: 400; font-size: 22px; margin: 0;">You're booked for Harmony Co-Op!</h1>
          </div>
          <div style="padding: 28px 24px; background: #f5f0e8;">
            <p style="font-size: 15px; line-height: 1.7; color: #3d3d5c;">
              Dear ${parentName || "Family"},<br/><br/>
              We can't wait to see ${(children || []).map((c: any) => c.name).join(" and ")} at Harmony Co-Op! Here are the details:
            </p>
            ${infoTable}
            <h2 style="font-weight: 400; color: #4d5a2c; margin: 0 0 8px;">Children Attending</h2>
            ${childTable}
            <div style="background: #0f1f5c; color: #fff; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
              <span style="font-size: 16px;">Amount Paid: </span>
              <strong style="font-size: 18px; color: #c4682a;">${pricePaid === 0 ? "Free" : "$" + pricePaid}</strong>
            </div>
            <p style="font-size: 14px; color: #3d3d5c; line-height: 1.7;">
              Questions? Reach out at <a href="mailto:info@dandelionwildschooling.com" style="color: #6b7a3f;">info@dandelionwildschooling.com</a>
            </p>
            <p style="font-size: 15px; color: #4d5a2c; margin-top: 24px;">Pura vida! 🌿<br/><em>The Wild Child Nosara Team</em></p>
          </div>
        </div>`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // ═══════════════════════════════════════════════════════════
    // REGULAR ENROLLMENT EMAIL
    // ═══════════════════════════════════════════════════════════
    const { children, parentName, parentEmail, parentPhone, lunch, grandTotal } = body;

    const childList = (children || []).map((ch: any) => {
      const dates = ch.selectedDays || [];
      const dayNames = weekdaysFromDates(dates);
      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">${ch.firstName} ${ch.lastName}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">${ch.programName || "—"}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">${dayNames} (${dates.length}/wk)</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">${hoursFor(ch.programId)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e0d8c8;">$${(ch.tuition ?? 0).toFixed ? ch.tuition.toFixed(2) : ch.tuition}</td>
        </tr>`;
    }).join("");

    const infoRows = `
      <tr><td style="padding: 8px 12px; color: #7a7a9a; width: 140px;">Location</td><td style="padding: 8px 12px;">${ENROLLMENT_LOCATION}</td></tr>
      <tr style="background: #f5f0e8;"><td style="padding: 8px 12px; color: #7a7a9a;">Snack & Lunch</td><td style="padding: 8px 12px;">${lunch ? "Included ($10/day)" : "Not included"}</td></tr>`;

    const tableHeader = `
      <thead>
        <tr style="background: #4d5a2c;">
          <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Child</th>
          <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Program</th>
          <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Days</th>
          <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Hours</th>
          <th style="padding: 10px 12px; color: #fff; text-align: left; font-weight: 400; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Tuition</th>
        </tr>
      </thead>`;

    // Staff notification
    await sendEmail([NOTIFY_EMAIL], `New Enrollment — ${(children || []).map((c: any) => c.firstName).join(" & ")}`, `
      <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #4d5a2c; padding: 24px; text-align: center;">
          <h1 style="color: #fff; font-weight: 400; font-size: 22px; margin: 0;">New Enrollment — Wild Child Nosara</h1>
        </div>
        <div style="padding: 28px 24px; background: #f5f0e8;">
          <h2 style="font-weight: 400; color: #4d5a2c; margin: 0 0 16px;">Parent Details</h2>
          <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            <tr><td style="padding: 8px 12px; color: #7a7a9a; width: 140px;">Name</td><td style="padding: 8px 12px;">${parentName || "—"}</td></tr>
            <tr style="background: #f5f0e8;"><td style="padding: 8px 12px; color: #7a7a9a;">Email</td><td style="padding: 8px 12px;">${parentEmail}</td></tr>
            <tr><td style="padding: 8px 12px; color: #7a7a9a;">Phone</td><td style="padding: 8px 12px;">${parentPhone || "—"}</td></tr>
            ${infoRows}
          </table>
          <h2 style="font-weight: 400; color: #4d5a2c; margin: 0 0 16px;">Children Enrolled</h2>
          <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
            ${tableHeader}
            <tbody>${childList}</tbody>
          </table>
          <div style="background: #0f1f5c; color: #fff; padding: 16px 20px; border-radius: 8px; display: flex; justify-content: space-between;">
            <span style="font-size: 16px;">Total Paid</span>
            <strong style="font-size: 18px; color: #c4682a;">$${grandTotal}</strong>
          </div>
          <p style="margin-top: 24px; font-size: 13px; color: #7a7a9a; text-align: center;">
            View all enrollments at your <a href="https://wildchild-registration.vercel.app/admin" style="color: #6b7a3f;">admin panel</a>
          </p>
        </div>
      </div>`);

    // Parent confirmation
    await sendEmail([parentEmail], "Welcome to Wild Child Nosara — Enrollment Confirmed!", `
      <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #4d5a2c; padding: 24px; text-align: center;">
          <h1 style="color: #fff; font-weight: 400; font-size: 22px; margin: 0;">You're enrolled at Wild Child Nosara!</h1>
        </div>
        <div style="padding: 28px 24px; background: #f5f0e8;">
          <p style="font-size: 15px; line-height: 1.7; color: #3d3d5c;">
            Dear ${parentName || "Family"},<br/><br/>
            Thank you for enrolling ${(children || []).map((c: any) => c.firstName).join(" and ")} at Wild Child Nosara.
            We are so excited to welcome your family into our community! Here are your enrollment details:
          </p>
          <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin: 16px 0;">
            ${infoRows}
          </table>
          <table style="width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; margin: 16px 0;">
            ${tableHeader}
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
      </div>`);

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
