# K2 dashboard and settings consolidation

Work on `k2-dashboard-cards`, based on `k2`. Installer integration lives on
K2-improvements branch `fluidd-ui-consolidation`. Neither branch is a release.

The complete UI includes Bed Assist, Global Carto Scan/Touch, Global No-Carto,
Material Z-offset editors, the Creality camera service, K2 Fans, and K2 Filament/CFS.
Capability markers: `k2-ui-overlay-support.txt` = 9 and
`k2-device-cards-api.txt` = 1. Keep those files in future builds.

## Build and inspect

```sh
pnpm run lint --no-fix
pnpm run type-check
pnpm run test:unit --run
pnpm run circular-check
pnpm run build
python3 tools/package_k2_build.py
```

The resulting `fluidd.zip` contains compiled assets and Rcpilot33 release metadata.
`k2-build.json` records source provenance. The K2 test workflow performs these
checks and uploads the same ZIP as an Actions artifact without publishing a release.

For a development-only preview using simulated data and commands:

```sh
pnpm run dev
```

Open `/tools/k2-preview.html` on that development server. The preview never
connects to a printer. Its source and sample data are not in the production entry.

## Install and test

Transfer the ZIP to an idle test printer using the matching K2-improvements branch:

```sh
sh features/fluidd/install.sh --archive /absolute/path/fluidd.zip --nocam
```

The installer also sets up the `k2_device` Moonraker bridge. Its GET status API
and notifications supply slot snapshots and percentages. Fan commands use
Moonraker G-code (`M106 P0/P1/P2` for Model/Case/Side). Feed/Retract uses Creality's
native `feedInOrOut` command after validating both native and Klipper idle state.
Disconnected/stale data, empty/unknown slots, printing, paused state and repeat
movement requests are blocked. A sent command is not a physical completion claim.

On the test printer check:

- All three fan switches and sliders against Creality Print and touchscreen.
- External spool and CFS slot IDs, colors, materials, humidity, and empty slots.
- Slot selection followed by Feed/Retract while idle; native heating/movement.
- Print/pause guards, native-service disconnect/reconnect and firmware restart.
- Bed Assist and every installed offset dialog: open, adjust, save and cancel.
- Creality camera playback, existing layout persistence and mobile layout.
- Reinstall/update behavior and restoration of the saved previous UI.

Use the K2-improvements installer menus to update the pinned test ZIP. After
the installer’s test-updater isolation migration is applied, the stable Fluidd
web updater is absent from the software-update list during testing. The first version shows
auto-refill state but does not edit filament profiles, reread RFID, or change
auto-refill. The slot highlight is the user's selection, not a claim about the
currently loaded filament.

## Promote

RC1 hardware checks completed with one CFS unit:

- All three fan controls and idle CFS Feed/Retract passed owner testing.
- Feed/Retract remained disabled during a print and while paused.
- The installed Z-offset editors and Bed Assist UIs worked.
- Camera playback and card reconnection worked after a power-cycle.

Four units and per-unit humidity were verified with simulated data. Physical
multi-unit testing was not performed. A Creality Print attempt reported XD0114;
the retry proceeded into printing. The initial transfer failure was not isolated.

The factory dashboard defaults place K2 Fans and K2 Filament / CFS in the right
column immediately after Console and before Jobs. Existing saved layouts keep
their card positions; reset the default layout to adopt the new factory order.

After hardware verification, merge the Fluidd changes into `k2`, bump version and
changelog, then tag that commit. The release workflow checks that the tagged
commit belongs to `k2`, packages the complete ZIP and publishes the normal release.
Promote the installer branch through `integration-testing` to `main` after the
combined Fluidd release is available, so new installations cannot fetch an older
release lacking the required capabilities. Keep the marker/API contract compatible
when making later Fluidd or bridge changes.
