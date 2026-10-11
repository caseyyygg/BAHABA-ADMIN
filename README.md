# BAHABA-ADMIN NLP monitor

The real-time NLP monitor is embedded in the existing **Reports** section of the BAHABA-ADMIN console. It displays the detector's post text, source/location, Flood/Non-Flood classification, Low/Mid/High severity, Neutral/Concerned/Distress urgency, confidence, and detection time. The panel refreshes every five seconds and uses the logged-in admin's Reports permissions and location scope. LGU accounts are assigned one supported location; platform administrators can select among all supported locations and have a separate **All Reports** section with reports and NLP detections across all locations.

LGU admins can select a barangay when adding evacuation centers, add multiple centers, update occupancy, and delete centers created by their account in **Evacuees**. Older centers without creator IDs can also be deleted when their recorded creator matches the admin's organization label. Center details and live counts are saved to the shared database and shown to signed-in app users in that location under **Command Center**; deletions are reflected after the app refreshes its location data.

The resident app, admin portal, and serverless API are deployed separately on Vercel. Both frontends proxy API calls to `https://bahaba-api.vercel.app`. The API uses Neon Postgres; its empty database needs the SQL in `BAHABA-official/bahaba-api/schema.sql` and the `DATABASE_URL` Vercel production environment variable before authentication or live data can work. Do not migrate local database records. The API project also needs a private `SESSION_SECRET` (already configured), and the first platform administrator must be created once through the documented bootstrap endpoint. Resident signup activation requires `RESEND_API_KEY`, `MAIL_FROM`, and a verified sender. The free hosting setup does not include the Python NLP service, so NLP detection and social monitoring remain offline.

Supported location IDs, display names, aliases, and map geometry filters are centralized in `BAHABA-official/bahaba-app/location-config.json`. The user app uses the bundled barangay GeoJSON boundaries; Malolos City uses the `City of Malolos (Capital)` municipality features within the Bulacan dataset. The PHP APIs apply additive location-column/table migrations automatically. A platform administrator can assign or reassign an LGU account's location in **Account Manager**; new LGU registrations remain pending until approved.

The admin API creates an `nlp_events` table automatically. The trained model archives are under `nlp-service`; the Python inference service runs the Flood/Non-Flood, severity, urgency, and location checkpoints. Optional social listening runs through Apify Actors and sends matching public posts through the same classifier: `scraper_one/facebook-posts-search`, `xquik/x-tweet-scraper`, and `themineworks/threads-scraper`. Public RSS/Atom collection is also supported. This uses third-party hosted scraping services; it does not access private posts or groups.

The Windows launcher `start-local.ps1` starts both local APIs and generates separate high-entropy ingestion/collector tokens in memory (it never prints or saves them). Run it from PowerShell in the BAHABA-ADMIN folder. The generated tokens are inherited by the launched processes; rerunning the launcher creates a fresh token pair.

For manual setup or another operating system:

1. Install Python 3.11+ and run `pip install -r requirements.txt` from `BAHABA-ADMIN/nlp-service`.
2. Create an Apify account and review the three actor pricing pages linked below. Actor results and Apify platform usage both count toward billing.
3. Put a fresh Apify API token in `nlp-service/.env` as `APIFY_API_TOKEN`. Keep it private and do not include the `Bearer ` prefix.
4. Set `APIFY_SOCIAL_ENABLED=true`. The default OR keywords are `baha`, `flood`, and `lubog`; defaults limit each term to one result, poll hourly, and cap each actor run at `$0.005`.
5. Run `start-local.ps1`, then inspect `http://127.0.0.1:8002/health` for `apify_social_running`, per-platform errors, and processed counts. This starts paid actor calls; keep the caps low until you’ve checked actual usage.
6. Set `BAHABA_INGEST_TOKEN` for both PHP and Python services when running them manually. First inference extracts about 2.8 GB of weights into `model-cache` and needs several GB of RAM.
7. To disable Apify collection, set `APIFY_SOCIAL_ENABLED=false` and restart the services.

For Apify social keyword collection, set a fresh `APIFY_API_TOKEN` and `APIFY_SOCIAL_ENABLED=true` in `nlp-service/.env`. `APIFY_KEYWORDS` uses OR matching; the default terms are `baha`, `flood`, and `lubog`. The actors are [Facebook Posts Search](https://apify.com/scraper_one/facebook-posts-search), [Xquik X Tweet Scraper](https://apify.com/xquik/x-tweet-scraper), and [Threads Scraper](https://apify.com/themineworks/threads-scraper). The collector requests latest/recent results, deduplicates posts across polls, and sends them through BAHABA's classifier. The safe starter settings are hourly polling, one result per keyword per actor, and a $0.005 maximum charge per actor run. Keep those limits until you've verified actual usage in Apify Billing.

At the configured limit of one result per keyword, once per hour, current Starter/Bronze rates imply roughly $15/month in result and Threads run-start charges if every search returns a result. The $0.005 cap on each of seven hourly actor calls bounds actor charges to at most about $25.20/month before platform overage. Apify Starter is $19/month and includes $19 in usage, so the capped worst case could add roughly $6.20 plus any separately billed platform usage. Actual results and costs are usually lower. Prices can change; check each actor's pricing tab and Billing before enabling or increasing limits. The collector stays disabled unless both the enable flag and API token are set.

For additional self-hosted public-feed collection, set `RSS_FEED_URLS` in `nlp-service/.env` to a JSON array of public RSS or Atom feed URLs, for example `["https://example.gov/news/feed.xml"]`. The collector polls every 5 minutes by default, processes up to 10 existing entries per feed on first startup, then deduplicates later entries locally and sends them through the same classifier. Set `RSS_DEFAULT_CITY` and `RSS_DEFAULT_BARANGAY` when a feed covers one known area; otherwise the location model extracts what it can from each item. Only feed URLs are supported here, not arbitrary HTML pages.

Facebook Pages generally do not provide RSS feeds. For a Page you manage, use the existing Meta Graph API or webhook integration with its required permissions. This self-hosted feed collector does not scrape Facebook pages or bypass Meta access controls; for other public sources, use their official API or published RSS/Atom feed.

The service also keeps `POST http://127.0.0.1:8002/detect` available for an authorized non-Facebook collector that sends raw posts with `Authorization: Bearer <NLP_SERVICE_TOKEN>`.

The inference service then sends classified results to `http://localhost:8001/api.php?action=nlp-ingest` using the configured `BAHABA_INGEST_TOKEN`. The detector request should include `source`, `post_id`, `post_text`, `post_url` (original permalink), `timestamp`, and, when available, `city` and `barangay`. The output classifier supplies `classification`, `severity`, `urgency`, `confidence`, and extracted `location`.

For a collector that already has pre-classified results and does not need these models, it can post directly to `http://localhost:8001/api.php?action=nlp-ingest` with `Authorization: Bearer <nlp_ingest_token>` and a JSON body like:

```json
{
  "source": "Facebook",
  "post_id": "source-post-id",
  "post_text": "Water is rising near the riverside homes.",
  "location": "Riverside area",
  "city": "Malabon City",
  "barangay": "Concepcion",
  "timestamp": "2026-09-28T10:20:00+08:00",
  "classification": "Flood",
  "severity": "High",
  "urgency": "Distress",
  "confidence": 0.96,
  "post_url": "https://www.facebook.com/example/posts/123456789"
}
```

`confidence` accepts a decimal from 0–1 or a percentage from 0–100. Include the actual public source permalink in `post_url`; `original_post_url`, `permalink_url`, `source_url`, `post_link`, and `url` are accepted aliases. Without a valid `http`/`https` source link, a link cannot be displayed or reliably reconstructed from post text alone. Existing sample posts do not include real source links. Use city and barangay values that match the admin account records so LGU users see only their permitted scope.

## LGU map reporting

Reports includes an OpenFreeMap map and a flood report form. LGUs select a barangay within their assigned location, choose severity, and describe conditions. New reports are saved as pending and become available to the resident map on its next refresh. The API validates the selected barangay ID against the location scope and saves its canonical name. MapLibre assets and barangay geometry are bundled locally in map-vendor and map-data; deploy-build.js includes both. No map API key is required.


### Agent-Reach X collector

Agent-Reach 1.5.0 uses twitter-cli 0.8.5 for X search. The NLP service calls its read-only search client with explicit session credentials, never browser cookie extraction. Install in an isolated Python environment from https://github.com/Panniantong/Agent-Reach and set X_AGENT_REACH_PYTHON to that environment's Python executable. Run nlp-service/configure-x.ps1 and enter the auth_token and ct0 values you manually exported from your signed-in x.com session using Cookie-Editor. Do not paste them into chat or commit .env. The running service reloads these two values each polling cycle; no restart is needed after login setup.

The collector polls Latest search every 60 seconds (minimum), using flood keywords and the five supported location names, with an overlapping recent-day window and at most 30 results per check. It is near-real-time polling, not a streaming feed or complete archive. Duplicate post IDs are skipped after successful classification and ingestion; failed deliveries retry. X rate-limit failures pause at least five minutes. Original URLs and dates are retained. Both Reports and All Reports expose the collector status. New results flow through the supplied NLP models and existing API location/role scope. No synthetic posts are inserted.

Start local API and inference together with start-local.ps1 so their generated ingestion tokens match. X credentials remain in the ignored NLP .env and are sent only to X by the backend. If the session expires, re-run configure-x.ps1.
`nX search compatibility: the isolated twitter-cli 0.8.5 backend includes the authenticated /home bootstrap fix reviewed from https://github.com/public-clis/twitter-cli/pull/93. After reinstalling twitter-cli, run patch-x-backend.py using X_AGENT_REACH_PYTHON to reapply it. configure-x.ps1 rejects duplicate cookie values before saving either setting.


### Automatic local collection

The BAHABA Local Collector scheduled task starts keep-running.ps1 in the background when this Windows user signs in. It checks the local API and NLP processes every 30 seconds and restarts both together if either exits, keeping their ingestion tokens synchronized. Existing X cookies are reused from the ignored nlp-service/.env. Updated cookies take effect on the next collection cycle, including after a service restart.

This local collector requires the PC to remain powered on and awake. X can revoke or expire sessions; then configure-x.ps1 must be run again. There is no password storage or automatic login. Logs are in .runtime/supervisor.log and .runtime/nlp-service-error.log. To stop automatic restarts, disable the BAHABA Local Collector task in Task Scheduler and end its running instance before stopping the API/NLP processes.

Facebook and Threads keyword collectors are documented in [nlp-service/SOCIAL-COLLECTORS.md](nlp-service/SOCIAL-COLLECTORS.md). Both run independently alongside X; local sign-in may be required.
