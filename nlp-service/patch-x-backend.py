from pathlib import Path
import twitter_cli.client
p=Path(twitter_cli.client.__file__)
s=p.read_text(encoding='utf-8')
old='''            ct_headers = _gen_ct_headers()
            home_page = cffi_session.get(
                "https://x.com", headers=ct_headers, timeout=10,
            )'''
new='''            ct_headers = _gen_ct_headers()
            # Upstream compatibility fix: public-clis/twitter-cli PR #93.
            # Current root HTML omits the bundle metadata. Use the signed-in
            # home route with the explicitly supplied session instead.
            ct_headers["Cookie"] = self._cookie_string or "auth_token=%s; ct0=%s" % (self._auth_token, self._ct0)
            home_page = cffi_session.get(
                "https://x.com/home", headers=ct_headers, timeout=10,
            )'''
if new in s:
    print('Authenticated-home bootstrap fix is already installed.')
    raise SystemExit(0)
if old not in s: raise RuntimeError('Unexpected twitter-cli bootstrap source; no changes made')
p.write_text(s.replace(old,new,1),encoding='utf-8')
print('Applied reviewed upstream authenticated-home bootstrap fix.')
