# Renault Alpine — Home Assistant custom vehicle card

![Renault Alpine card desktop preview](docs/preview-desktop.png)

A custom Lovelace card for the [official Renault integration](https://www.home-assistant.io/integrations/renault). Designed for Home Assistant OS and backed by live entity states and Home Assistant service calls.

> **Repository privacy:** This sample config includes the vehicle-specific entity prefix `tuin_alpine` and home location label `Tuin`. Review or replace these before making the repository public. Never commit passwords, tokens, VINs, or URLs containing credentials.

**Version:** 1.0.0 · **Appearance:** Graphite, compact, regular icons, timer, headlights · **Dependencies:** none

The card is a live replacement for the earlier *offline mockup* and retains the approved card layout: title aligned left, Renault diamond on the right, Alpine vehicle artwork, 4 charging metrics, 4 information tiles (including **Time remaining**), 4 action buttons and the location/update footer.

**Important:** This ZIP is a *prepared* custom Lovelace card, not a deployment to your Home Assistant instance. Installation is local to your Home Assistant OS Raspberry Pi. No `configuration.yaml` edits are required. The card does not need HACS.

## Files

This project is installable manually; it does **not** require HACS and is not yet distributed as a HACS integration.

- `renault-alpine-card.js` — all JavaScript, HTML and CSS; this is the dashboard resource.
- `alpine-hero.webp` — image from your approved mockup.
- `card-config.yaml` — dashboard **card** configuration only, **not** `configuration.yaml`.
- `preview.html` — standalone test page containing simulated Home Assistant states and simulated button actions. Only intended for local testing.
- `preview-1100.png`, `preview-450.png` — screenshots generated from the test harness.

## Installation on Home Assistant OS (no config YAML)

1. In **Settings → Apps**, install **File editor** (if you don't already have it). Start it and open its Web UI. This editor can create folders and upload files into `/config`.
2. Under the Home Assistant configuration directory (`/config`), create `www/renault-alpine/` (two folders if needed), and copy or upload **just these two files** into it:
   - `/config/www/renault-alpine/renault-alpine-card.js`
   - `/config/www/renault-alpine/alpine-hero.webp`
   If `www` is newly created, **restart Home Assistant** once to make `/local/` serve the new folder.
3. In Home Assistant, go to **Settings → Dashboards**, select the **⋮** menu and **Resources**. Add resource:
   - **URL:** `/local/renault-alpine/renault-alpine-card.js?v=1.0.0`
   - **Resource type:** `JavaScript module`
4. Go to your target dashboard, **Edit dashboard → Add card**, search for **Renault Alpine**, and select it. If it doesn't appear in the card picker yet, use **Manual** card and paste the contents of `card-config.yaml`.
5. In the card editor, verify the **entity prefix `tuin_alpine`** and all suggested mappings. Click **Entity mapping** to enter the exact IDs for your car as needed. Save the dashboard.

The dashboard resource configuration is saved in Home Assistant's UI-managed storage. **Do not add the resource to `configuration.yaml`.**

When updating the JS file later, change the resource URL query from `?v=1.0.0` to `?v=1.0.1` and reload the dashboard, to avoid stale browser caches.

## Entity handling

Only the flash button ID is confirmed from the supplied information:

`button.tuin_alpine_flash_lights`

The remaining mappings are **suggestions**, derived from `entity_prefix: tuin_alpine`; they must be checked on your vehicle device page under **Settings → Devices & services → Renault → your vehicle → Entities**.

| Display / command | Default guessed ID |
| --- | --- |
| Battery | `sensor.tuin_alpine_battery` |
| Range | `sensor.tuin_alpine_battery_autonomy` |
| Charge state | `sensor.tuin_alpine_charge_state` |
| Plug state | `sensor.tuin_alpine_plug_state` |
| Charging sensor | `binary_sensor.tuin_alpine_charging` |
| Plug connected | `binary_sensor.tuin_alpine_plug` |
| Lock | `binary_sensor.tuin_alpine_lock` |
| HVAC | `binary_sensor.tuin_alpine_hvac` |
| Time remaining | `sensor.tuin_alpine_charging_remaining_time` |
| Mileage | `sensor.tuin_alpine_mileage` |
| Location | `device_tracker.tuin_alpine_location` |
| Start A/C | `button.tuin_alpine_start_air_conditioner` |
| Start charge | `button.tuin_alpine_start_charge` |
| Stop charge | `button.tuin_alpine_stop_charge` |
| Flash lights | **`button.tuin_alpine_flash_lights` (supplied)** |
| Sound horn | `button.tuin_alpine_sound_horn` |

If the battery or any other entity doesn't exist or is unavailable, the display shows `—`, never fabricated car data. Unavailable action buttons are disabled. A small information message indicates how many status sensors have no available data.

**Time remaining:** It uses the live `Charging remaining time` sensor; numeric values are converted according to their unit (`min`, `s`, `h`). If the car explicitly reports it isn't charging, the card shows `—` to avoid displaying a stale completion estimate.

**Lock status:** Home Assistant's `binary_sensor` `lock` device class is **on = unlocked, off = locked**. This tile is read-only, not a lock/unlock command.

**A/C:** If HVAC is off, the card sends `button.press` to your start A/C button (the integration's standard button uses 21°C). If HVAC is on, `Stop A/C` becomes available only when a `renault_vehicle_id` has been entered, using official `renault.ac_cancel`. You can get the ID without executing an action using Home Assistant's visual action editor: create/edit a script under Settings → Automations & scenes, add a Renault: Cancel A/C action, select your vehicle, then switch the action to YAML to copy its `vehicle:` field. Do not save or run the test script unless you intend to use it. A vehicle ID can also enable official Renault service fallback for Start A/C and Start charging when their button entities are not present.

**Start/stop charging:** The card uses the official `Start charge` and `Stop charge` button entities if available. If the plug is explicitly disconnected, Start charging is disabled. Some vehicles do not support remote stop charging: their button will be missing, and the card intentionally leaves Stop charging disabled.

**Flash lights:** Calls `button.press` on `button.tuin_alpine_flash_lights` if it exists. The border is permanently blue as requested, with a brief animation after the Home Assistant service returns.

**Horn:** Requires a corresponding button entity and confirmation before sounding the real car horn (safety default). You can turn the confirmation off in the visual card editor.

**Location:** Tapping the location badge opens the Home Assistant entity details for the configured tracker.

**Last update:** Uses `sensor.tuin_alpine_last_battery_activity` if available and parseable (this diagnostic entity may be disabled by default), otherwise the battery entity's `last_updated` timestamp.

## Safety / troubleshooting

- This is **not** a direct Renault API integration. All commands are sent to Home Assistant using `hass.callService()`, and Home Assistant's Renault integration handles vehicle communications.
- Commands may take time to show up in the sensors due to Renault cloud polling. A successful HA call only means the request was accepted by Home Assistant, not that the car has already performed it.
- Some button entities may never be created for your vehicle or subscription; that is normal. Avoid creating fake buttons just to make the interface light up.
- Home Assistant's `/config/www` content is **served publicly to anyone able to access your HA URL**, without extra per-file authentication. Store **no passwords, account tokens, VINs or sensitive information** in these files. The default config includes no secrets.
- If the dashboard says **Custom element doesn't exist**, check the JavaScript resource path, module type and browser cache. If the image is missing, check `/local/renault-alpine/alpine-hero.webp` directly in your browser.
- If remote actions fail, test the corresponding button on the Renault device page first and check Renault subscription/support. Do not rely on the card as an urgent vehicle control.

The official docs for manual resources: https://contributors.home-assistant.io/frontend/custom-ui/resources/

The official Renault integration: https://www.home-assistant.io/integrations/renault

## Local development

Open `preview.html` in your browser for a simulated Home Assistant test harness. This preview does not contact your car.

Validate JavaScript syntax using Node.js:

```sh
node --check renault-alpine-card.js
```

The GitHub Actions workflow runs this syntax check on pushes and pull requests.

## Attribution and licensing

This is a community-created dashboard card, not an official Renault, Alpine, or Home Assistant product. Brand names and emblems belong to their respective owners. No open-source license has been selected; repository owners should choose one explicitly before inviting outside contributions.