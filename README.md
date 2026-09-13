# Genus — offline noun genders

**Author:** BorabRepos

Six languages, no connection needed. Search a noun, see its article, plural, forms and a memory
hook, then drill it on flip cards.

| Language | Articles | Nouns | English meanings |
| --- | --- | --- | --- |
| German | der, die, das | 54,984 | 12,361 |
| Spanish | el, la | 4,916 | 4,782 |
| Italian | il, la | 4,285 | 4,174 |
| French | le, la | 3,912 | 3,779 |
| Portuguese | o, a | 3,386 | 2,948 |
| Dutch | de, het | 2,874 | — |

German is much larger because it has a dedicated Wiktionary dataset. The others are built from
Universal Dependencies treebanks, which tag the gender of every noun in a large body of real text,
so they cover everyday vocabulary rather than every word that exists. Dutch has no free English
glossary under a compatible licence, so meanings are missing there.

## Files

| File | What it is |
| --- | --- |
| `genus.jsx` | The whole app, with all six word lists embedded as gzip + base64 |
| `build_db.py` | Builds the German list from Wiktionary data |
| `build_ud.py` | Builds the other five from treebanks |
| `embed.py` | Puts the built lists back into `genus.jsx` |
| `refresh.sh` | One command: download sources, rebuild everything, re-embed |
| `dist/` | The built lists and manifests, ready to host as updates |
| `web/` | Everything needed to build the installable web app |
| `DEPLOY.md` | Hosting it and adding it to a phone Home Screen |
| `ADS.md` | Turning on the built-in AdSense slots, and when not to |

## What the app does

- **Search** with or without the article, in singular or plural. Misspellings, ae/oe/ue spellings
  and unknown German compounds all resolve. Unknown words fall back to an ending rule.
- **Forms**: German shows all four cases; the others show definite, indefinite and plural, with the
  elisions written properly — l'eau, lo zaino, gli amici, el agua.
- **Practice** with flip cards: article, plural or mixed, five word sets, an optional ten-second
  clock, streak bonuses and a Leitner box system that brings back what you miss.
- **Rules** with percentages counted live from the word list, so you can see how far each ending
  rule really goes, plus an explorer for any ending you type.
- **Progress** per language: day streak, card boxes, favourites, missed words.

Everything runs on the device, including the search index and the statistics. Audio uses whichever
voice the device has for the chosen language.

## Running it as a phone app

`web/build-web.sh` produces a `site/` folder you upload to any free static host. Safari's
Share → Add to Home Screen turns it into a full-screen app that works with no connection.
`DEPLOY.md` walks through it. The hosted build keeps each word list in its own file and caches them
with a service worker, so the JavaScript stays around 250 KB.

## The word lists

Compact, one noun per line, most frequent first:

```
Haus	n0^er	house; home; theatre
cheval	m2aux	horse; horsepower
huis	n1zen
```

The gender is `m`, `f`, `n` or `c` (Dutch common gender), and the plural is a recipe rather than a
spelled-out word: `0^er` means drop nothing, add an umlaut, add `er`; `2aux` means drop two letters
and add `aux`. A `?` means the plural isn't known, which happens in Dutch where it can't be guessed
safely. Spelling plurals out in full would nearly double the size.

## Updating every three months

The app never needs the network. If you host updates, set one line in `genus.jsx`:

```js
const UPDATE_MANIFEST_URL = "https://your-site.example/genus/manifest.json";
const UPDATE_EVERY_DAYS = 90;
```

The app then looks for `manifest-<lang>.json` next to it, at most once every 90 days per language,
checks the SHA-256, and only swaps a list in if it parses. Any failure is silent and the existing
list stays. The Progress screen shows the version and has a manual check button.

To publish a refresh:

```bash
./refresh.sh                  # rebuild every language and re-embed
cd web && ./build-web.sh      # rebuild the installable site
# upload dist/ to your update host, or site/ to your web host
```

## Sources and licence

- German nouns: [german-nouns](https://github.com/gambolputty/german-nouns), from German Wiktionary
- Other languages: [Universal Dependencies](https://github.com/UniversalDependencies) treebanks
- English meanings: [Wiktionary-Dictionaries](https://github.com/Vuizur/Wiktionary-Dictionaries)
- Word ordering: [FrequencyWords](https://github.com/hermitdave/FrequencyWords), OpenSubtitles 2018

All of it is CC BY-SA 4.0, so the generated lists are too: credit the sources, and share any
modified list under the same licence. That covers the data, not your application code. I'm not a
lawyer, so check it yourself before shipping commercially.

## Author

Built by **BorabRepos**.

## Known limits

- Treebank-based languages miss rarer nouns, and a noun whose spelling doubles as a verb or function
  word is dropped rather than guessed at.
- Dutch plurals appear only when the source text shows them or a safe rule applies, because `-en`
  plurals change spelling (man/mannen, huis/huizen).
- Compound splitting is German only.
- Pronunciation depends on the voices installed on the device.
- If odd words appear at the top of a list after a refresh, add them to `STOPWORDS` in
  `build_db.py`, which exists because the frequency lists are lower-cased.
