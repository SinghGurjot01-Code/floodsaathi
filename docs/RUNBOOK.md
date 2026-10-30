# Runbook (agent keeps this current; never write secrets here)

## Platforms
| Platform | Logged in | Resources created (floodsaathi-*) | Human still has to |
|---|---|---|---|
| GitHub | Yes (SinghGurjot01-Code) | `SinghGurjot01-Code/floodsaathi` | - |
| Cloudflare | Yes (singhgurjotpal84@gmail.com) | Pages: `floodsaathi`, D1: `floodsaathi-db`, KV: `floodsaathi-kv` | Add billing card if R2 bucket is desired (fallback gh-pages active per D-03) |
| Render | Device code prompted | - | User will connect soon |
| Hugging Face | CLI installed | - | HF token when M3 LLM / dataset sync is run |
| Copernicus Data Space | Probed public OData | - | User will connect account for bulk Sentinel-1 downloads in A7/D4 |
| NASA Earthdata | Probed public CMR | - | Earthdata login when GPM granules are pulled |
| Google Earth Engine (optional) | - | - | Optional for flood extent |

## Human-only items
- [ ] Verify state and district helpline numbers (1070, 1077) and give the agent the verified values and dates.
- [ ] Native-speaker review of Hindi and Punjabi cards.
- [ ] Test on at least one real mid-range Android phone (offline, install, SMS, map, voice).
- [ ] Confirm CWC and India-WRIS terms of use for scraping, or request formal access.
- [ ] Approve any paid plan before the agent starts it.
- [ ] Confirm the hackathon's judging rubric and data rules.

## Deployments
- Cloudflare Pages (PWA): https://floodsaathi.pages.dev/
- Relay Latest Data: https://floodsaathi.pages.dev/data/latest/punjab.json
- GitHub Actions CI: https://github.com/SinghGurjot01-Code/floodsaathi/actions
