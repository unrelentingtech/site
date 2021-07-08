+++
date = 2017-11-01T18:42:51+00:00
path = "/kb/FirefoxSettings"
title = "FirefoxSettings"
updated = 2020-01-07T20:40:03+00:00

[taxonomies]
tag = ["firefox"]

+++

[Buffer more video](https://support.mozilla.org/en-US/questions/1168957): `media.cache_readhead_limit` = lots

Disable backspace-to-go-back to prevent accidental form loss: `browser.backspace_action = 0`

Warning on Ctrl-Q: `browser.tabs.warnOnClose = true` `browser.showQuitWarning = true` and [DO NOT SET "Show my windows and tabs from last time"](https://support.mozilla.org/en-US/questions/1127960)! Also, [a WebExtension](https://addons.mozilla.org/en-US/firefox/addon/disable-ctrl-q-and-cmd-q/) for this.

Wide gamut color: `gfx.color_management.mode = 1`

Save session less often: `browser.sessionstore.interval = 60000`

[Kill safe mode prompt](https://support.mozilla.org/en-US/questions/951221): `toolkit.startup.max_resumed_crashes = -1`

Force compositing acceleration: `layers.acceleration.force-enabled = true`

Force canvas acceleration: `gfx.canvas.azure.accelerated = true` (must create)

Smooth libinput touchpad scrolling and touchscreen on X11 (not needed on Wayland): `MOZ_USE_XINPUT2=1`

Faster mouse scrolling: `mousewheel.default.delta_multiplier_y = 150`

[Arch Wiki Firefox/Tweaks](https://wiki.archlinux.org/index.php/Firefox/Tweaks)

[How to stop Firefox from making automatic connections](https://support.mozilla.org/en-US/kb/how-stop-firefox-making-automatic-connections)