// Wild Child info emails: one per program. Used to fill Flodesk drafts.
const WHERE = "Wild Child, 300 metres east of the Osteonal crossing, Barrio San Ramón, Nosara.";
const PAY = "Zelle for families with US bank accounts, or Costa Rican bank transfer for local families. We'll send the details when we confirm your child's place.";
const BRING = "Backpack, water bottle, change of clothes, sun hat, sunscreen, swimsuit and towel.";
const ENROLL_BODY = "Reply to this email or WhatsApp us at +506 6164 0827 to reserve a place or book a visit. We'd love to meet your family.";

window.__EMAILS = [
{
  key: "a13", name: "Info · Ages 1–3", segment: "Interested · Ages 1–3",
  subject: "Ages 1–3 at Wild Child: schedule, tuition and how to join",
  preview: "Gentle mornings of soil, song and play, mostly in Spanish.",
  hero: "flyer-new-chapter",
  kicker: "AGES 1–3 · EARLY YEARS", title: "A gentle first village", subtitle: "Soil, song and a second home, mostly in Spanish",
  intro: ["Thank you for your interest in Wild Child! Here is everything you need to know about our ages 1–3 group, all in one place."],
  k: "OUR YOUNGEST WILD CHILDREN", h: "Rhythm, warmth and wonder",
  paras: [
    "Our youngest children spend gentle mornings touching soil, smelling herbs, hearing live music and painting with natural materials. No rushing, no outcomes: just a safe, beautiful morning of play and connection.",
    "Led by Dunia, a Waldorf-trained Costa Rican educator, the day unfolds mostly in Spanish, through song, touch and daily care. Jenne brings permaculture gardening, nutrition and movement."
  ],
  details: [
    ["Schedule.", "Monday to Friday, 3 or 5 days a week. Arrival at 8:00 am."],
    ["Pick-up.", "11:30 am (before lunch), 12:00 pm (after lunch) or 2:00 pm (with a nap at school)."],
    ["Where.", WHERE],
    ["Tuition.", "$445 a week for 5 days, or $267 a week for 3 days."],
    ["Nourishment.", "Organic snack and lunch, $10 a day. Snack at 10:00 am, lunch at 11:45 am."],
    ["Short or long stays.", "Join for a week, a month or the whole season. Staying longer? Ask us about our long-term rates."],
    ["Siblings.", "10% tuition discount for each sibling."],
    ["How to pay.", PAY],
    ["What to bring.", BRING]
  ],
  button: ["ENROLL NOW", "https://www.wildchildnosara.com/"]
},
{
  key: "a45", name: "Info · Ages 4–5", segment: "Interested · Ages 4–5",
  subject: "Ages 4–5 at Wild Child: schedule, tuition and how to join",
  preview: "A full, bilingual day of garden, art, music and stories.",
  hero: "flyer-new-chapter",
  kicker: "AGES 4–5 · EARLY YEARS", title: "Hands, soil, color and sound", subtitle: "A full, bilingual day of play, art and nature",
  intro: ["Thank you for your interest in Wild Child! Here is everything you need to know about our ages 4–5 group, all in one place."],
  k: "A DAY AT WILD CHILD", h: "No desks. No screens.",
  paras: [
    "Every day, young children move between the garden, kitchen, art space and music circle: planting, cooking, painting, singing and crafting in Spanish and English.",
    "They paint with watercolors and natural pigments, model with beeswax and clay, bake bread, tend seedlings and hear stories told by teachers who know that imagination is the foundation of all future thinking."
  ],
  details: [
    ["Schedule.", "Monday to Friday, 3 or 5 days a week, 8:00 am to 2:00 pm."],
    ["Drop-off and pick-up.", "Drop-off at 8:00 am, pick-up at 2:00 pm. No nap: bilingual classes after lunch."],
    ["Where.", WHERE],
    ["Tuition.", "$445 a week for 5 days, or $267 a week for 3 days."],
    ["Nourishment.", "Organic snack and lunch, $10 a day."],
    ["Short or long stays.", "Join for a week, a month or the whole season. Staying longer? Ask us about our long-term rates."],
    ["Siblings.", "10% tuition discount for each sibling."],
    ["How to pay.", PAY],
    ["What to bring.", BRING]
  ],
  button: ["ENROLL NOW", "https://www.wildchildnosara.com/"]
},
{
  key: "a69", name: "Info · Ages 6–9", segment: "Interested · Ages 6–9",
  subject: "Ages 6–9 at Wild Child: schedule, tuition and how to join",
  preview: "Small bilingual groups, real academics, rooted in nature.",
  hero: "flyer-launch",
  kicker: "AGES 6–9 · BILINGUAL MENTORSHIP", title: "Wonder as practice", subtitle: "Small groups, real academics, rooted in nature",
  intro: ["Thank you for your interest in Wild Child! Here is everything you need to know about our ages 6–9 group, all in one place."],
  k: "A DAY AT WILD CHILD", h: "Learning woven into life",
  paras: [
    "Our 6–9 group builds strong foundations in reading, writing and mathematics through storytelling, imagination, nature observation and art, in a small bilingual community.",
    "Mornings begin in the garden and with movement, followed by academics and Cosmic Education with Karen and Benjamin. After storytelling and a shared organic lunch, Dunia holds afternoon studios in clay, weaving, woodwork and natural building. Fridays are for music, art and performance."
  ],
  details: [
    ["Dates.", "In session now through March 19, 2027. Join anytime."],
    ["Schedule.", "Monday to Friday, 3 or 5 days a week, 8:00 am to 2:00 pm."],
    ["Drop-off and pick-up.", "Drop-off at 8:00 am, pick-up at 2:00 pm. Once a week, optional capoeira on the beach at 7:00 am (parents welcome)."],
    ["Where.", WHERE],
    ["Tuition.", "$480 a week for 5 days, or $288 a week for 3 days."],
    ["Nourishment.", "Organic snack and lunch, $12 a day."],
    ["Stay longer, save more.", "5% off for 4 weeks, 10% for 8 weeks, 15% for 12 weeks. 10% sibling discount."],
    ["Breaks.", "Christmas, Dec 21–Jan 1, and midyear, Feb 15–19. Camps are offered separately."],
    ["How to pay.", PAY],
    ["What to bring.", BRING]
  ],
  button: ["ENROLL NOW", "https://www.wildchildnosara.com/"]
},
{
  key: "a1013", name: "Info · Ages 10–13", segment: "Interested · Ages 10–13",
  subject: "Ages 10–13 at Wild Child: schedule, tuition and how to join",
  preview: "Big questions, real projects. Starts November 23.",
  hero: "flyer-launch",
  kicker: "AGES 10–13 · BILINGUAL MENTORSHIP", title: "Big questions, real projects", subtitle: "Starts November 23 · Nosara",
  intro: ["Thank you for your interest in Wild Child! Here is everything you need to know about our ages 10–13 group, all in one place."],
  k: "A DEEPER JOURNEY", h: "Mentorship for older children",
  paras: [
    "Our 10–13 group moves into independent research, complex mathematics, sustained writing, philosophy, cultural history, ethics and interdisciplinary projects, all bilingual and rooted in nature.",
    "In a small group with close mentoring, children take real responsibility for the Earth and ocean through field journeys and community projects. The season opens with Ocean Connection Days, led by marine biologist Dr. Anand Patel."
  ],
  details: [
    ["Dates.", "Begins Monday, November 23, and runs through March 19, 2027."],
    ["Schedule.", "Monday to Friday, 3 or 5 days a week, 8:00 am to 2:00 pm."],
    ["Drop-off and pick-up.", "Drop-off at 8:00 am, pick-up at 2:00 pm. Once a week, optional capoeira on the beach at 7:00 am (parents welcome)."],
    ["Where.", WHERE],
    ["Tuition.", "$595 a week for 5 days, or $357 a week for 3 days."],
    ["Nourishment.", "A substantial organic snack and lunch, $15 a day."],
    ["Stay longer, save more.", "5% off for 4 weeks, 10% for 8 weeks, 15% for 12 weeks. 10% sibling discount."],
    ["Breaks.", "Christmas, Dec 21–Jan 1, and midyear, Feb 15–19. Camps are offered separately."],
    ["How to pay.", PAY],
    ["What to bring.", BRING]
  ],
  button: ["ENROLL NOW", "https://www.wildchildnosara.com/"]
},
{
  key: "harmony", name: "Info · Harmony Saturdays", segment: "Interested · Harmony Saturdays",
  subject: "Saturdays at Harmony Co-Op Playground: all the details",
  preview: "Nature play, songs and stories. Ages 3+, 8:30–11:30 am.",
  hero: "flyer-harmony",
  kicker: "SATURDAYS AT HARMONY CO-OP", title: "Saturday mornings are for wild play", subtitle: "Ages 3 and up · 8:30–11:30 am · behind La Ventanita",
  intro: ["Thank you for your interest in Wild Child at Harmony Co-Op Playground! Here is everything you need to know before your first Saturday."],
  k: "OUR MORNING", h: "Play, songs and stories",
  paras: [
    "Every Saturday we gather at Harmony Co-Op Playground for nature-based play, creative exploration, songs and stories, inspired by Dandelion Wildschooling.",
    "The morning flows from a gentle arrival and opening circle into free play with loose parts, snack and rest, art stations with natural materials and swim play, then a closing circle."
  ],
  details: [
    ["When.", "Every Saturday, 8:30 to 11:30 am."],
    ["Ages.", "3 and up."],
    ["Where.", "Harmony Co-Op Playground, behind La Ventanita, Nosara."],
    ["Drop-off and pick-up.", "Arrive between 8:30 and 8:50 am. Pick-up at 11:30 am."],
    ["Price.", "$75 per child, $45 for Wild Child families, free for Harmony Co-Op members. Message us for discount codes."],
    ["How to book and pay.", "Book and pay online at wildchildnosara.com."],
    ["What to bring.", "Water bottle, snack, floaties and swimsuit."]
  ],
  button: ["BOOK A SATURDAY", "https://www.wildchildnosara.com/booking-calendar/wild-child-at-harmony-co-op-playground"]
},
{
  key: "ocean", name: "Info · Ocean Connection Days", segment: "Interested · Ocean Connection Days",
  subject: "Ocean Connection Days, Nov 23–27: all the details",
  preview: "Thanksgiving week by the sea with marine biologist Dr. Anand Patel.",
  hero: "flyer-thanksgiving",
  kicker: "THANKSGIVING WEEK · NOV 23–27", title: "Ocean Connection Days", subtitle: "On the water. In the water. In the lab.",
  intro: ["Thank you for your interest in Ocean Connection Days! Here is everything you need to know about Thanksgiving week at Wild Child."],
  k: "LEARNING FROM THE OCEAN", h: "Three days by the sea",
  paras: [
    "From November 24 to 26, children ages 6–9 and 10–13 spend their days on the water, in the water and in the lab: wave motion and tidal flow, the chemistry of seawater and the microscopic sea life that keeps our ocean alive.",
    "The days are led by Dr. Anand Patel, a marine biologist and oceanographer with a Ph.D. in Biological Oceanography and more than 30 years of experience. He teaches marine biology, oceanography and planetary health at Crossroads School in Santa Monica, California."
  ],
  details: [
    ["Dates.", "Thanksgiving week, Monday Nov 23 to Friday Nov 27. Ocean Connection Days are Nov 24–26."],
    ["Ages.", "6–9 and 10–13."],
    ["Schedule.", "8:00 am to 2:00 pm. Join for the full week or 3 days."],
    ["Drop-off and pick-up.", "Drop-off at 8:00 am, pick-up at 2:00 pm. We'll share the week's plan before you arrive."],
    ["Where.", WHERE],
    ["Tuition.", "Ages 6–9: $480 for 5 days or $288 for 3 days. Ages 10–13: $595 for 5 days or $357 for 3 days."],
    ["Nourishment.", "Organic snack and lunch, $12 a day (ages 6–9) or $15 a day (ages 10–13)."],
    ["Stay on.", "The week opens our season, which runs through March 19, with discounts for longer stays."],
    ["How to pay.", PAY],
    ["What to bring.", BRING]
  ],
  button: ["ENROLL NOW", "https://www.wildchildnosara.com/"]
},
{
  key: "pottery", name: "Info · Chorotega Pottery Workshop", segment: "Interested · Pottery workshop",
  subject: "Chorotega Pottery Family Workshop, Nov 21: all the details",
  preview: "At Nanku Ecovillage with Chorotega artisan Junior Matarrita Leal.",
  hero: "flyer-pottery-ig",
  kicker: "SATURDAY, NOV 21 · NANKU ECOVILLAGE", title: "Chorotega Pottery Workshop", subtitle: "A family workshop with artisan Junior Matarrita Leal",
  intro: ["Thank you for your interest in the Chorotega pottery workshop! Here is everything you need to know."],
  k: "IN COLLABORATION WITH NANKU ECOVILLAGE", h: "Create together",
  paras: [
    "The Chorotega pottery workshops are back at Nanku Ecovillage. Together with Nanku, we invite families to learn the ancient art of Chorotega pottery from Chorotega artisan Junior Matarrita Leal.",
    "Clay from this land, hands of every age, and a tradition that has lived in Guanacaste for generations."
  ],
  details: [
    ["When.", "Saturday, November 21. Choose one session: 10:00 to 11:30 am, or 12:00 to 1:30 pm."],
    ["Where.", "Nanku Ecovillage, Nosara, Guanacaste."],
    ["Who.", "Families. Hands of every age are welcome."],
    ["Price, early bird until Nov 15.", "$50 per family (up to 5) or $20 per person. Costa Rican nationals: $35 per family or $10 per person."],
    ["Price from Nov 16.", "$60 per family or $25 per person. Costa Rican nationals: $45 per family or $15 per person."],
    ["Sign up by Thursday, Nov 19.", "Reply to this email, WhatsApp +506 6164 0827 or write to info@nankuecovillage.com. Spaces are limited."],
    ["How to pay.", "Zelle for US bank accounts, or Costa Rican bank transfer. Payment confirms your spot."]
  ],
  button: ["RESERVE YOUR SPOT", "https://wa.me/50661640827"]
}
];
window.__ENROLL_BODY = ENROLL_BODY;
