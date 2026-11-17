# wildchild-forms

Wix Forms endpoint (Vercel project `wildchild-forms`, https://wildchild-forms.vercel.app/api/wix).
Called by the Wix automations "Registration form → Lili email + Flodesk" and "Email signup pop-up → Lili email + Flodesk".
Since Nov 17, 2026 it forwards each family to Lili's console (`wildchild-console/api/intake`), which records them and adds them to Flodesk "Website Inquiries" + "New inquiries" (the single Welcome workflow, never twice). If the console is down it adds them to Flodesk directly with the same rules.
Env: FLODESK_API_KEY, WIX_WEBHOOK_KEY, INTAKE_KEY. Deployed with the Vercel API (not git-connected).
