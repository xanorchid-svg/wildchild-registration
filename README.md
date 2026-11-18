# wildchild-forms

Wix Forms endpoint (Vercel project `wildchild-forms`, https://wildchild-forms.vercel.app/api/wix).
Called by the Wix automations "Registration form → Lili email + Flodesk" and "Email signup pop-up → Lili email + Flodesk".
Since Nov 17, 2026 it forwards each family to Lili's console (`wildchild-console/api/intake`), which records them and adds them to Flodesk "Website Inquiries" + "New inquiries" (the single Welcome workflow, never twice). If the console is down it adds them to Flodesk directly with the same rules.
Env: FLODESK_API_KEY, WIX_WEBHOOK_KEY, INTAKE_KEY. Deployed with the Vercel API (not git-connected).

Volunteers (Nov 18, 2026): `POST /api/volunteer` takes applications from the hidden Work With Us page on Wix (HTML embed) and emails them to info@ via Resend
(send-only key on dreamxanadu.com, env RESEND_API_KEY, from volunteers@dreamxanadu.com, reply-to the applicant). It never touches the console or Flodesk.
`GET /api/volunteer?ping=1` checks the key is set. Note: the deployed api/wix.js is newer than this branch (health ping); the Nov 18 deploy reused it unchanged.
