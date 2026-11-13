# wildchild-forms

Wix Forms → Flodesk endpoint (Vercel project `wildchild-forms`, https://wildchild-forms.vercel.app/api/wix).
Called by the Wix automations "Registration form → Lili email + Flodesk" and "Email signup pop-up → Lili email + Flodesk".
Adds families to Flodesk "Website Inquiries" + the matching "Interested · …" segment, which triggers that program's info workflow.
Env: FLODESK_API_KEY, WIX_WEBHOOK_KEY. Deployed with the Vercel API (not git-connected).
