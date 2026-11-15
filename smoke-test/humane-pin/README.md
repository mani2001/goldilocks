# Smoke test #2 — Humane AI Pin (2026-11-15)

**Story:** MacRumors, Nov 9, 2023 (launch day) — "Humane Debuts $700 AI Pin With 'Laser Ink Display'", plus Humane's own Nov 9 press release as the claim source.
**Files:** `pass-a.json` (claims + queries), `verdict.json` (Pass B output, day-0 evidence only). Verdict passes `validate.py`.

## The card (day-0 view)
- Novelty **3** / Slop **4** / Confidence **med** / Access: announced (orders open Nov 16, first deliveries "early 2024")
- Five of six claims → **self_reported**. Only the price ($699 + $24/mo) is **confirmed** — the one thing with a hard number attached.
- The "first wearable AI device" claim survives only via the weasel words "full power": Ray-Ban Meta with Meta AI built in was announced Sep 27, 2023 and in stores Oct 17 at $299 — six weeks earlier, actually shipping.
- Undisclosed: independent evaluation (nobody outside Humane had used one), release date (vague "early 2024"); battery life per charge has no enum slot — recorded in `category_record.specs_undisclosed`.
- Recheck: when independent hands-on reviews land.

## vs the seed's expected read (novelty 3, slop 5)
Novelty matches. Slop is 4, not 5 — deliberately: on day 0 this was not pure vapour. A real physical device had been demoed on stage and a runway, with a price and an order date. The rubric's 5 is reserved for announcement-of-an-announcement with no product. What the card correctly says is "claims far ahead of evidence" (4) with everything that mattered unverified.
**Hindsight rescore:** shipped Apr 11, 2024 to historically harsh reviews (The Verge: "not even close"; MKBHD: worst product he'd reviewed), returns outpaced sales by Aug 2024, HP bought the assets for $116M in Feb 2025 and the Pins were bricked Feb 28, 2025. Rescored slop → **5**. Same pattern as R1, in the other direction: the day-0 card flagged exactly what needed time, and time resolved it against the product.

## Design fix found by this run
The schema's `access.via` enum had no value for hardware (api/weights/app/paper only). Added `"device"`. Also surfaced: the `undisclosed` enum has no slot for hardware specs like battery life — parked in `category_record.specs_undisclosed` for now; a per-category undisclosed list may be needed for the tool category at data-design time.
