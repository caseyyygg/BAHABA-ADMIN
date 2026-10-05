# BAHABA-ADMIN NLP monitor

The real-time NLP monitor is embedded in the existing **Reports** section of the BAHABA-ADMIN console. It displays the detector's post text, source/location, Flood/Non-Flood classification, Low/Mid/High severity, Neutral/Concerned/Distress urgency, confidence, and detection time. The panel refreshes every five seconds and uses the logged-in admin's Reports permissions and location scope. LGU accounts are assigned one supported location; platform administrators can select among all supported locations and have a separate **All Reports** section with reports and NLP detections across all locations.

LGU admins can select a barangay when adding evacuation centers, add multiple centers, update occupancy, and delete centers created by their account in **Evacuees**. Older centers without creator IDs can also be deleted when their recorded creator matches the admin's organization label. Center details and live counts are saved to the shared database and shown to signed-in app users in that location under **Command Center**; deletions are reflected after the app refreshes its location data.

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
