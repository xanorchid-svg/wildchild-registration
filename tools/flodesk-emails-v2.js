// Wild Child info emails v2 (Nov 13): rewritten in Lili's voice from her Nov 12 parent emails.
const WHERE = "Wild Child, 300 metres east of the Osteonal crossing, Barrio San Ramón, Nosara.";
const PAY = "Zelle in USD to Dandelion Wildschooling LLC (no processing fee), bank transfer in USD or colones to our Banco LAFISE account, PayPal, or card on request. Tuition is due within 7 days of your invoice and before your child's first day.";
const CONFIRM = "Your child's place is confirmed once payment is received. Bookings are for consecutive days and weeks.";
const FOOD_NOTE = "Prepared fresh every day from organic, local, seasonal ingredients. Vegetarian-forward, with gluten-free and vegan options.";
const STAYS = "From one week (at least 3 days) to the whole season. Longer stays save more: 5% off for 4 weeks, 10% for 8 and 15% for 12. Siblings receive 10% off.";
const BRING = "Backpack, water bottle, change of clothes, sun hat, sunscreen, swimsuit and towel.";
const REGISTER = "To register, simply reply with your child's full name, birthdate, the dates you'd like and any allergies or medical notes. Your message comes straight to me at info@dandelionwildschooling.org, or you can WhatsApp us at +506 6164 0827. I would love to meet your family.";

window.__EMAILS = [
{
  key: "a13", name: "Info · Ages 1–3",
  subject: "Ages 1–3 at Wild Child: our early years, tuition and how to join",
  preview: "Spanish mornings of songs, stories, garden and play, with Dunia.",
  kicker: "AGES 1–3 · EARLY CHILDHOOD", title: "A gentle first village", subtitle: "Spanish immersion inspired by Waldorf, nature and play",
  intro: ["Thank you for reaching out! I'm so glad you're thinking of Wild Child for your little one. Here is everything about our ages 1–3 group in one place."],
  k: "OUR EARLY YEARS", h: "Rhythm, warmth and wonder",
  paras: [
    "Dunia leads our early-years community, drawing on Waldorf rhythms, forest learning and Reggio-inspired exploration. A Waldorf-trained Costa Rican educator with 15 years of experience, she has been one of our lead teachers almost since the beginning, supported by Jenne and Cris.",
    "Mornings are in Spanish and follow a nurturing rhythm of songs, stories, movement, outdoor play, gardening and practical activities. No rushing, no outcomes: just a safe, beautiful morning of play and connection."
  ],
  details: [
    ["Schedule.", "Monday to Friday, 3 or 5 days a week. Arrival at 8:00 am."],
    ["Pick-up.", "11:30 am (before lunch), 12:00 pm (after lunch) or 2:00 pm (with a nap at school)."],
    ["Dates.", "We welcome families all year. Our main January start is Monday, January 4, and the early years continue beyond Easter."],
    ["Where.", WHERE],
    ["Tuition.", "$445 a week for 5 days, or $267 a week for 3 days."],
    ["Organic snack and lunch.", "$10 a day. " + FOOD_NOTE],
    ["Short or long stays.", STAYS],
    ["Parent & Child, ages 0–3.", "Nature, movement, sensory exploration and connection for little ones and their caregivers. Ask us about it."],
    ["How to pay.", PAY + " " + CONFIRM],
    ["What to bring.", BRING]
  ]
},
{
  key: "a45", name: "Info · Ages 4–5",
  subject: "Ages 4–5 at Wild Child: our early years, tuition and how to join",
  preview: "Spanish mornings, Montessori reading and writing, and creative afternoons.",
  kicker: "AGES 4–5 · EARLY CHILDHOOD", title: "Hands, soil, color and sound", subtitle: "Waldorf and Montessori, in Spanish and in nature",
  intro: ["Thank you for reaching out! I'm so glad you're thinking of Wild Child for your child. Here is everything about our ages 4–5 group in one place."],
  k: "A DAY AT WILD CHILD", h: "No desks. No screens.",
  paras: [
    "Dunia leads our early-years community, drawing on Waldorf rhythms, forest learning and Reggio-inspired exploration. Mornings are mostly in Spanish, with storytelling, songs, movement, imaginative play, gardening and practical activities.",
    "New this season: a Montessori-trained teacher teaches reading and writing in Spanish three times a week. Afternoons are project-based, with bilingual creative ateliers in clay, paint and natural materials. Early literacy and number sense grow through stories, rhythm, counting, games and hands-on projects."
  ],
  details: [
    ["Schedule.", "Monday to Friday, 3 or 5 days a week, 8:00 am to 2:00 pm."],
    ["Drop-off and pick-up.", "Drop-off at 8:00 am, pick-up at 2:00 pm. No nap: bilingual ateliers after lunch."],
    ["Dates.", "We welcome families all year. Our main January start is Monday, January 4, and the early years continue beyond Easter."],
    ["Where.", WHERE],
    ["Tuition.", "$445 a week for 5 days, or $267 a week for 3 days."],
    ["Organic snack and lunch.", "$10 a day. " + FOOD_NOTE],
    ["Short or long stays.", STAYS],
    ["How to pay.", PAY + " " + CONFIRM],
    ["What to bring.", BRING]
  ]
},
{
  key: "a69", name: "Info · Ages 6–9",
  subject: "Ages 6–9 at Wild Child: daily rhythm, tuition and how to join",
  preview: "Small bilingual groups, real academics and Cosmic Education with Karen.",
  kicker: "AGES 6–9 · WONDER", title: "Wonder as practice", subtitle: "Small groups, real academics, rooted in nature",
  intro: ["Thank you for reaching out! Our 6–9 community is a small, bilingual group where children receive close mentoring and the time and attention to grow their own gifts. Here is everything in one place."],
  k: "A DAY AT WILD CHILD", h: "Learning woven into life",
  paras: [
    "Karen guides the group, bringing Montessori Cosmic Education into conversation with science, Indigenous ways of knowing, archetypes, creation stories and mythology. Benjamin, our lead educator, weaves in music, poetry, storytelling and performance.",
    "Reading, writing and maths receive intentional attention. We start from each child's level and combine guided practice with real use: reading stories and researching questions, journals and observations, measuring and building, and exploring patterns. English and Spanish are woven through the day.",
    "Our rhythm: stewardship, gardening and movement with Jenne from 8:00, academics and the School of Wonder until 11:45, the storytelling hearth, a shared organic lunch, then afternoon ateliers with Dunia in clay, weaving, woodwork and natural building. Fridays are for drumming, art and performance with Flor and Benjamin."
  ],
  details: [
    ["Dates.", "In session now through March 19, 2027. Join anytime; our main January start is Monday, January 4."],
    ["Schedule.", "Monday to Friday, 8:00 am to 2:00 pm, 3 or 5 days a week."],
    ["Drop-off and pick-up.", "Drop-off at 8:00 am, pick-up at 2:00 pm. Once a week, optional beach capoeira with Julian at 7:00 am. Parents are warmly invited."],
    ["Where.", WHERE],
    ["Tuition.", "$480 a week for 5 days, or $288 a week for 3 days."],
    ["Organic snack and lunch.", "$12 a day or $60 a week. " + FOOD_NOTE],
    ["Short or long stays.", "From one week (at least 3 days) to the whole immersion. Longer stays save more: 5% off for 4 weeks, 10% for 8, 15% for 12 and about 20% for the full immersion. Siblings receive 10% off."],
    ["Breaks.", "Christmas, Dec 21–Jan 1, and midyear, Feb 15–19. Holiday camps are booked separately."],
    ["Shuttle.", "A Wild Child shuttle is planned along the main road from Delicias through Guiones and Pelada, about $10 a day. Let us know if you're interested."],
    ["How to pay.", PAY + " " + CONFIRM],
    ["What to bring.", BRING]
  ]
},
{
  key: "a1013", name: "Info · Ages 10–13",
  subject: "Ages 10–13 at Wild Child: daily rhythm, tuition and how to join",
  preview: "Big questions, real projects and close mentorship. Begins November 23.",
  kicker: "AGES 10–13 · MENTORSHIP", title: "Big questions, real projects", subtitle: "Begins November 23 · Nosara",
  intro: ["Thank you for reaching out! Our 10–13 immersion is a small, bilingual group with close mentoring and personalized academics. Here is everything in one place."],
  k: "A DEEPER JOURNEY", h: "Mentorship for older children",
  paras: [
    "Our older children move into independent research, complex mathematics, sustained writing, philosophy, cultural history, ethics and interdisciplinary projects, guided by Benjamin, our lead educator, and Karen.",
    "Leadership and stewardship sit at the heart of the program: real responsibility for the Earth and ocean through community projects and field journeys to beaches, forests, farms and local initiatives. The immersion opens on Thanksgiving week with two ocean days led by marine biologist Dr. Anand Patel."
  ],
  details: [
    ["Dates.", "Begins Monday, November 23, and runs through March 19, 2027."],
    ["Schedule.", "Monday to Friday, 8:00 am to 2:00 pm, 3 or 5 days a week."],
    ["Drop-off and pick-up.", "Drop-off at 8:00 am, pick-up at 2:00 pm. Once a week, optional beach capoeira with Julian at 7:00 am. Parents are warmly invited."],
    ["Where.", WHERE],
    ["Tuition.", "$595 a week for 5 days, or $357 a week for 3 days."],
    ["Organic snack and lunch.", "A substantial snack and lunch, $15 a day or $75 a week. " + FOOD_NOTE],
    ["Short or long stays.", "From one week (at least 3 days) to the whole immersion. Longer stays save more: 5% off for 4 weeks, 10% for 8, 15% for 12 and about 20% for the full immersion. Siblings receive 10% off."],
    ["Breaks.", "Christmas, Dec 21–Jan 1, and midyear, Feb 15–19. Holiday camps are booked separately."],
    ["Shuttle.", "A Wild Child shuttle is planned along the main road from Delicias through Guiones and Pelada, about $10 a day. Let us know if you're interested."],
    ["How to pay.", PAY + " " + CONFIRM],
    ["What to bring.", BRING]
  ]
},
{
  key: "harmony", name: "Info · Harmony Saturdays",
  subject: "Saturdays at Harmony Co-Op Playground: all the details",
  preview: "Nature play, songs and stories. Ages 3+, 8:30–11:30 am.",
  kicker: "SATURDAYS AT HARMONY CO-OP", title: "Saturday mornings are for wild play", subtitle: "Ages 3 and up · 8:30–11:30 am · behind La Ventanita",
  intro: ["Thank you for reaching out! Here is everything you need to know before your first Saturday with us."],
  k: "OUR MORNING", h: "Play, songs and stories",
  paras: [
    "Every Saturday we gather at Harmony Co-Op Playground for nature-based play, creative exploration, songs and stories, in Spanish and English.",
    "The morning flows from a gentle arrival and opening circle into free play with loose parts, snack and rest, art stations with natural materials and swim play, then a closing circle. Jenne leads our Saturdays."
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
  enrollBody: "Questions or discount codes? Just reply to this email or WhatsApp Jenne at +506 7287 3859. See you on Saturday!"
},
{
  key: "ocean", name: "Info · Ocean Connection Days",
  subject: "Thanksgiving week at Wild Child, Nov 23–27: Ocean Connection Days",
  preview: "Surfing at Garza, snorkeling at Eterna and science with Dr. Anand Patel.",
  kicker: "THANKSGIVING WEEK · NOV 23–27", title: "Ocean Connection Days", subtitle: "On the water. In the water. In the lab.",
  intro: ["Thank you for reaching out! Thanksgiving week opens our older children's immersion: a small-group introduction to our four schools of Wonder, Presence, Performance and Stewardship. Here is the week."],
  k: "AGES 6–13 · THE WEEK", h: "Five days, two by the sea",
  paras: [
    "Monday opens the journey with stewardship, creation stories, music and inquiry with Jenne, Benjamin and Karen. Tuesday is ocean day at Garza: surfing and body boarding, ocean mindfulness with Mitch and marine exploration with marine biologist Dr. Anand Patel, then his science lab on campus.",
    "Wednesday brings movement and team sports, Cosmic Education with Karen and clay with Tefi and Dunia. Thursday is ocean exploration at Eterna: snorkeling and collecting samples with Dr. Anand, then the lab. Friday is for drumming, music, art and woodwork with Flor, and performances.",
    "Dr. Anand holds a Ph.D. in Biological Oceanography and has more than 30 years of experience. He teaches marine biology and planetary health at Crossroads School in Santa Monica."
  ],
  details: [
    ["Dates.", "Monday, November 23 to Friday, November 27."],
    ["Ages.", "6–9 and 10–13. Younger siblings are welcome in Dunia's early-years group (ages 1–5)."],
    ["Hours.", "8:00 am to 2:00 pm."],
    ["Ocean days drop-off.", "7:45 am at Wild Child, or 8:00 am directly at Estrellitas Café in Garza on Tuesday and at Eterna on Thursday. Optional beach capoeira with Julian, Tuesday 7:00–8:00 am."],
    ["Where.", WHERE],
    ["Tuition.", "Ages 6–13: $595 for the week. Ages 1–5: $420 for the week."],
    ["Organic snack and lunch.", "$10 a day per child."],
    ["Stay on.", "The week opens our immersion, which runs through March 19, with savings for longer stays."],
    ["How to pay.", PAY + " " + CONFIRM],
    ["What to bring.", BRING + " Rash guard and snorkel gear if you have them."]
  ]
},
{
  key: "pottery", name: "Info · Chorotega Pottery Workshop",
  subject: "Chorotega Pottery Family Workshop, Nov 21: all the details",
  preview: "At Nanku Ecovillage with Chorotega artisan Junior Matarrita Leal.",
  kicker: "SATURDAY, NOV 21 · NANKU ECOVILLAGE", title: "Chorotega Pottery Workshop", subtitle: "A family workshop with artisan Junior Matarrita Leal",
  intro: ["Thank you for reaching out! Here is everything you need to know about our family pottery morning at Nanku."],
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
    ["Sign up by Thursday, Nov 19.", "Spaces are limited."],
    ["How to pay.", "Zelle in USD, or bank transfer in USD or colones. Payment confirms your spot."]
  ],
  enrollBody: "To reserve, just reply with your family's names, how many will join and your preferred session. Your message comes straight to me at info@dandelionwildschooling.org, or WhatsApp us at +506 6164 0827."
}
];
window.__ENROLL_BODY = REGISTER;
