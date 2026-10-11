Facebook and Threads keyword collection
======================================

The local NLP service starts separate read-only Facebook and Threads collectors
alongside X. Each platform searches flood, baha and lubog paired with Navotas,
Bulacan, Marikina, Pampanga and Malolos. It rotates five of the 15 searches per
poll, with a 300-second minimum interval after each batch. A full keyword/city
rotation therefore takes about 15 minutes plus browser loading time. This is
periodic collection, not a real-time streaming API or an exhaustive archive.

If a platform requires authentication, run in PowerShell:

    .\nlp-service\configure-social.ps1 -SignIn Facebook
    .\nlp-service\configure-social.ps1 -SignIn Threads

Sign in in the dedicated browser, then press Enter in the PowerShell window.
Only this collector's session is saved in ignored nlp-service/.state. It never
reads your normal Chrome profile, asks for passwords in chat, posts, likes,
comments, or changes account settings. Session expiry can require signing in
again. Login challenges and rate limits are reported, not bypassed.

Optional settings in nlp-service/.env (reloaded every poll):

    SOCIAL_SCRAPER_SEARCH_ENABLED=true
    SOCIAL_SCRAPER_KEYWORDS=["flood","baha","lubog"]
    SOCIAL_SCRAPER_POLL_SECONDS=300
    FACEBOOK_SCRAPER_URLS=[]
    THREADS_SCRAPER_URLS=[]

URL lists optionally add public page/profile targets to the rotating search
queue. Set search enabled to false to monitor only those URLs. [] disables a
platform only when keyword search is also disabled.

Posts need text, a valid platform permalink and a keyword match. They are
classified by the existing four NLP models and forwarded to the existing admin
ingestion endpoint with Facebook/Threads source labels and original links.
Deduplication is persistent and saved only after successful NLP/database delivery;
failed deliveries retry later. Location comes from the actual post text/NLP, not
the search term. No coordinates or flood extents are invented. Unmatched locations
may appear only in the platform-wide feed rather than an LGU-specific feed.

Provenance
----------

Facebook: https://github.com/brutalsavage/facebook-post-scraper
commit acf0bfdf7463c22811b39c9e0fd5654b7f8bf8b7 (GPL-3.0; original source and
license retained under vendor/facebook-post-scraper). The original post-message
helper is loaded using AST without executing its plaintext credential reader,
obsolete Selenium login, or HTML dumps. Modern rendered-message selectors and a
bounded Playwright browser loop supplement that helper.

Threads: https://github.com/Zeeshanahmad4/Threads-Scraper
commit 9b98d1ab3b94a3d6a92b61c112dbbe3eef4fcf60 (repository LICENSE retained).
Its src/main.py imports scraper.threads_scraper, which is absent in that revision.
The original ThreadsParser is reused; our browser layer supplies public-page
extraction. Upstream sample/offline mode and proxy logic are never enabled.

Third-party licenses and attribution remain with these adapters. Review GPL
obligations if redistributing the combined collector. The resident front end does
not bundle either scraper. Network/platform layout changes can prevent collection;
the dashboard shows explicit errors instead of claiming no flood activity.
