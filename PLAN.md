CheaterCheck.ai Plan

Status: in progress

Phase 1: MVP UX + Data Flow
1.1 Confirm MVP scope
- Inputs: photo, name, location, app
- Output: blurred summary, paywall, then reveal match/no-match + confidence
- Copy/branding: CheaterCheck.ai naming, tone, legal disclaimers

1.2 Search UI polish
- Validate upload, preview, and required fields
- Display blurred result card even before payment
- Payment prompt modal and unlock UX
- Success state: reveal match/no-match + signal cards

1.3 API contract
- /api/lookup accepts: imageData, fullName, location, app
- Response: found, confidence, score, matches, profile
- Demo response for non-configured env

Phase 2: HarperDB Wiring
2.1 Schema + seed data
- Create schema + signals table (already scaffolded in harperdb/schema.sql)
- Seed sample data (harperdb/seed.json)
- Document insert/read commands for local dev

2.2 Query logic
- Name/location/app filters (current)
- Optional: add image_hash matching when face pipeline is ready
- Add pagination or limit caps

Phase 3: Payment + Unlock
3.1 Choose payment provider
- Stripe (Checkout or PaymentIntent) or PayOS
- Payment config in env (.env.local)

3.2 Unlock flow
- Add /api/create-checkout-session
- Add /api/webhook to confirm payment
- Frontend: replace demo unlock with real payment redirect

Phase 4: Face Recognition Pipeline
4.1 Provider decision
- Options: AWS Rekognition, Face++, or custom model
- Privacy policy and retention rules

4.2 Image processing
- Generate face embedding or hash
- Store only anonymized values (no raw images)
- Update lookup to include image_hash similarity

Phase 5: Deployment (HarperDB App Platform)
5.1 App setup
- Create HarperDB app with built-in Next.js
- Configure env vars in HarperDB Studio

5.2 Validation
- Test /api/lookup on deployed URL
- Confirm build, routing, and env availability
