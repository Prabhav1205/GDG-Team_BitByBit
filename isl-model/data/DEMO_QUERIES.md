# Demo Queries for Hackathon Presentation

These 7 queries demonstrate the RAG system returning relevant, real government schemes.

---

## Query 1 — Education / Scholarship

**Query:** `"I need financial help for my child's education"`

**Expected Top 3:**
1. NSP Pre-Matric Scholarship (if Class 9-10)
2. NSP Post-Matric Scholarship (if higher education)
3. PM YASASVI Scholarship (if OBC/EBC community)

**Demo tip:** Shows how the semantic search captures "financial help" + "education" → scholarship schemes even without exact keyword match.

---

## Query 2 — Disability Support

**Query:** `"I have a disability and need assistive devices and support"`

**Expected Top 3:**
1. ADIP - Assistance for Aids & Appliances (wheelchairs, hearing aids)
2. NHFDC Self-Employment Loan (for disabled persons)
3. UDID Card (prerequisite for all disability benefits)

**Demo tip:** Demonstrates disability-specific search with semantics — "assistive devices" → ADIP, "support" → NHFDC.

---

## Query 3 — Healthcare

**Query:** `"I cannot afford hospital treatment for my family"`

**Expected Top 3:**
1. Ayushman Bharat PM-JAY (₹5 lakh cashless hospitalisation)
2. PMSBY Suraksha Bima (accident coverage)
3. National Food Security Act (comprehensive poor family support)

**Demo tip:** "Cannot afford" + "hospital" → PM-JAY is the top hit for this canonical government healthcare scheme.

---

## Query 4 — Women & Child

**Query:** `"I am a woman from a poor family and want to save for my daughter"`

**Expected Top 3:**
1. Sukanya Samriddhi Yojana (girl child savings)
2. Beti Bachao Beti Padhao (girl welfare)
3. PM Ujjwala Yojana (BPL women, LPG)

**Demo tip:** "Poor family" + "daughter" → Sukanya Samriddhi at top; semantic search distinguishes from male-oriented schemes.

---

## Query 5 — Housing

**Query:** `"I need help building a pucca house in my village"`

**Expected Top 3:**
1. PMAY Gramin (rural housing ₹1.2 lakh grant)
2. MGNREGS (100-day rural employment for labor)
3. National Food Security Act (BPL household support)

**Demo tip:** "Village" + "pucca house" → PMAY-G ranks first; demonstrates rural context disambiguation.

---

## Query 6 — Employment / Skill Development

**Query:** `"I am unemployed and want to learn a skill and start a small business"`

**Expected Top 3:**
1. PMKVY Skill Training (free 3-6 month certificate courses)
2. Stand-Up India (SC/ST/women startup loans)
3. NHFDC Skill Loan (disabled persons skill finance)

**Demo tip:** "Unemployed + skill + business" → PMKVY + Stand-Up India. Shows the system handles multi-intent queries.

---

## Query 7 — ISL Gesture → RAG (Sign Mode Demo)

**Gesture:** Select **MONEY** gesture in sign mode

**Mapped Query:** `"financial assistance and payment support"`

**Expected Top 3:**
1. PMJJBY Life Insurance (affordable financial protection)
2. PMSBY Accident Insurance (financial security)
3. Atal Pension Yojana (financial planning retirement)

**Demo tip:** Live ISL gesture → auto-mapped query → scheme results. Full offline pipeline: MediaPipe → ONNX → RAG → FAISS → Results.

---

## Backup Queries (if needed)

- `"I am a farmer and lost crops in flood"` → PMFBY Crop Insurance
- `"I am 65 years old and need monthly pension"` → IGNOAPS + Vaya Vandana
- `"I need identity proof to access government services"` → UDID Card + Jan Dhan
