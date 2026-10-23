# Interaction events

GA4 stream: G-K6SPCN20DE. Existing page views remain unchanged.

- quiz_start: nonempty deck or retry starts; quiz_mode=deck/retry
- quiz_answer: accepted answer; repeated calls ignored
- quiz_timeout: accepted timeout; repeated calls ignored
- quiz_complete: reaches the end of the current pass
- creator_site_visit: portfolio link activated; target_site

Events use gtag event commands, transport_type=beacon, and explicit send_to. Added payloads omit answers, correctness, scores, health/treatment selections, search strings, query parameters, fragments and personal identifiers. Parameters are allowlisted. Measurement failures never block the interaction. Only the public GitHub Pages hostname sends these events.

Verify event receipt with GA4 Realtime/DebugView. Browser tests check forwarding and payloads; they cannot prove GA ingestion. These changes do not mark key events or alter GA property settings.
