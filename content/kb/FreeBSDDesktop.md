+++
date = 2017-11-04T14:51:34+00:00
path = "/kb/FreeBSDDesktop"
title = "FreeBSDDesktop"
updated = 2020-07-06T13:47:28+00:00

[taxonomies]
tag = ["freebsd"]

+++

This infodump tries to be an up-to-date place for information regarding FreeBSD Wayland desktop setup.
It's not a step-by-step guide but if you know the basics you should be able to figure everything out.

## Base

My Base Fork: [https://github.com/DankBSD/base](https://github.com/DankBSD/base)

You probably don't need all the things from there, stock -CURRENT is good for most people.

## Ports

My Ports Fork: [https://github.com/DankBSD/ports](https://github.com/DankBSD/ports)

Some port maintainers (hello x11@ gnome@) are kinda slow sometimes :)
so I maintain a patchset for the ports repo that includes new shiny things.

It is sort of becoming a more proper "distro"/fork currently..

The most important things to get from my ports are:

- ~~`libepoll-shim`~~ ([finally, updates are upstream](https://github.com/freebsd/freebsd-ports/commit/acf2f60a8fdba68037d92fa9502e8ab23b0079eb))
- ~~`libudev-devd`: git rev update - includes fixes for
  [display hotplug](https://github.com/FreeBSDDesktop/libudev-devd/pull/7)
  and (see below) input device enumeration without root access~~
  ([finally, updates are upstream](https://github.com/freebsd/freebsd-ports/commit/f6d96c34328b2992912ffede0613362c3f9af81f))
- `consolekit2`: wayland support (see below)

## GPU Kernel Drivers

[The FreeBSDDesktop git repo](https://github.com/FreeBSDDesktop/kms-drm) is currently outdated,
[freebsd/drm-kmod](https://github.com/freebsd/drm-kmod) currently has 5.3 and it's in ports as `drm-devel-kmod`.

- YOU HAVE TO REBUILD AND REINSTALL EXTERNAL KERNEL MODULES LIKE THESE AFTER INSTALLING A NEW KERNEL!
  the behavior is UNDEFINED if you don't, it might not break so hard that it doesn't load,
  but it is VERY likely to break in SOME way!
  - when building a module, your `/usr/src` tree MUST match the kernel you WILL be loading the module into!!
- The first two Radeon GCN generations are supported by both `amdgpu` and `radeonkms`. Use `amdgpu`!
  It's the modern driver, it supports everything needed for Vulkan and it doesn't have weird crashes `radeonkms` sometimes can have.
- AMD Radeon (amdgpu) + UEFI very often has a framebuffer conflict problem, for a workaround
  [disable efifb with `hw.syscons.disable=1` in `/boot/loader.conf`](https://github.com/FreeBSDDesktop/freebsd-base-graphics/issues/170)
  and enjoy no display output until driver loads.
- Intel Kaby Lake [doesn't refresh the vt sometimes](https://github.com/FreeBSDDesktop/kms-drm/issues/151),
  disabling PSR (`compat.linuxkpi.i915_enable_psr=0`) seems to fix it.
- [amdgpu works on aarch64 machines btw](https://github.com/FreeBSDDesktop/kms-drm/pull/154)

### GPU tunables/sysctls

Make sure the tunables you set actually exist!
Sometimes you'll find their old names in various blogs etc. — translate to the current format:

- Back in the day, driver tunables were `drm.i915.TUNABLENAME` or something.
- For a brief period, they were `compat.linuxkpi.TUNABLENAME` (e.g. `compat.linuxkpi.ppfeaturemask`).
- Currently, they are `compat.linuxkpi.DRIVERNAME_TUNABLENAME` (e.g. `compat.linuxkpi.amdgpu_ppfeaturemask`).

Other than driver tunables, there are tunables corresponding to Linux sysfs's "classes".
These are under `sys.class` and they include **laptop display backlight brightness** (`sys.class.backlight`) on both Intel and AMD.

Anyway: DO NOT cargo-cult tunables from the internet :) Most of them are good by default.
I pretty much only use these:

```
compat.linuxkpi.i915_enable_dc="7" # deepest power states
compat.linuxkpi.i915_enable_dpcd_backlight="1" # better brightness control on some modern laptops
# (the Pixelbook requires this and also some patching for backlight to work)
compat.linuxkpi.amdgpu_ppfeaturemask="4294803455" # default | 0x4000 for Overdrive overclocking
```

## GPU Userspace Drivers (Mesa)

The `mesa-libs`/`mesa-dri`/`clover`/`osmesa` stuff in upstream ports is not a complete disaster
(at least Wayland and Vulkan stuff is enabled out of the box now, though not VA-API it seems)
but it's still a bit outdated.

Now there's `mesa-devel` in ports!
But only with [D25020](https://reviews.freebsd.org/D25020) it will be easy to switch between GL implementations
without rebuilding all the packages.

## Input Device Support

The modern way of doing input is `evdev`.
Forget `moused`, `xf86-input-<ANYTHING that's not libinput>`, etc.
(tbh forget xorg also :D)

`EVDEV_SUPPORT` kernel option (to expose most things like `psm` as evdev) was enabled by default in
[rS340387](https://reviews.freebsd.org/rS340387) (Nov 2018).

It's REALLY IMPORTANT to set sysctl `kern.evdev.rcpt_mask="12"` —
send evdev events from individual mice/keyboards instead of sysmouse/kbdmux. (UPD: this is default in -CURRENT now!)

(UNLESS you have e.g. a MacBook with a USB touchpad — atp(4) doesn't have evdev support yet.
In that case, for now you can use moused. But someone should add the support!)

For PS/2 Synaptics touchpads, also set loader tunable `hw.psm.synaptics_support="1"`
and `hw.psm.trackpoint_support="1"` for ThinkPad TrackPoints.
(The TrackPoint will appear as an extra device in evdev!)
(UPD: this is all enabled by default now in -CURRENT, hopefully won't be rolled back.)

For HID over I²C install the [wulf7/iichid](https://github.com/wulf7/iichid) driver.
(well, it's a next gen input stack really, that abstracts HID from USB. I contributed pen tablet support there!)
(upd: It's in ports now)

For Wacom tablets, gamepads, and other USB devices that Linux supports,
you can use [webcamd](https://www.freshports.org/multimedia/webcamd/),
which just runs the Linux drivers in userspace (and uses `cuse` to provide them to the kernel) which is pretty cool.


### Cool evdev tools

- [evemu](https://www.freshports.org/devel/evemu/) provides lower-level (than libinput's CLI) debug view, record and replay, etc
- [evhz](https://www.freshports.org/sysutils/evhz) measures event rate
- [netevent](https://www.freshports.org/sysutils/netevent/) forwards devices over the network (like Synergy but without fancy seamless mouse handover, you have to press a hotkey to switch to remote)
- [evscript](https://github.com/myfreeweb/evscript) I made this a while ago: a scripting thing to make [xcape](https://github.com/alols/xcape) style key tricks happen. I don't really use it anymore because I have a Wayfire plugin for that

## Session Management

A session manager is a daemon that tracks user sessions (huh).
This was originally invented for GUI user switching, but now it has a more fundamental task:
letting you run your GUI session *as your user account* without needing root
(this works by passing file descriptors to GPU and input devices over D-Bus).
It also configures your `$XDG_RUNTIME_DIR` directory.

On Linux, `systemd-logind` or `elogind` is used for this.
We only have the good old ConsoleKit2 for now.
(I'd like to work on a new thing in Rust but I have so many projects already)

- included in my ports (also at [D18754](https://reviews.freebsd.org/D18754)) is
  a patch for CK2 that enables FreeBSD+Wayland support, you need that;
- for wlroots-based compositors (display servers) like sway and wayfire, you need
  a [CK2 support patch](https://github.com/swaywm/wlroots/pull/1467/files),
  it's actually available in the wlroots port as the `CONSOLEKIT` option;
- some shenanigans related to our `udev` implementation not really being `udev`:
  - make sure the kernel exposes `kern.evdev.input` sysctls, if it doesn't then it's too old;
  - make sure `libudev-devd` is at least v0.4.1, i.e. it must include
    [8efdba3c](https://github.com/FreeBSDDesktop/libudev-devd/commit/8efdba3cd5d28dcd4dc847995670d7e2b4392b21);
- to enable automatic CK2 session creation on login,
  add `session         optional        pam_ck_connector.so`
  to the `# session` section of `/etc/pam.d/login` and log out and back in;
- you can always use `ck-launch-session` to start the compositor if the automatic PAM thing doesn't work out.

## Compositors / Display Servers

[wlroots](https://github.com/swaywm/wlroots) based compositors are the best supported (and these ones are in ports):

- [Wayfire](https://github.com/WayfireWM/wayfire) is a general extensible compositor with
  various Compiz features (wobbly windows, desktop cube) and stuff, I use it daily, it's awesome;
- [sway](https://github.com/swaywm/sway) is an i3 (tiling WM) clone;
- [hikari](https://hub.darcs.net/raichoo/hikari) is inspired by cwm;
- [cage](https://github.com/Hjdskes/cage) is a kiosk (runs a single, maximized application) —
  like all wlr compositors it can be used in a window, so there's some other usages for that;

If you have done the aforementioned CK2 setup, they should just work as your regular user.

[My abandoned Weston fork](https://gitlab.freedesktop.org/myfreeweb/weston) is a thing also if you're interested for some reason.

KDE Plasma 5 should be possible (already supported CK2!), [here's a patch attempt](https://reviews.freebsd.org/differential/diff/52600/)
from some time ago, it got to the lock screen at least for me.

## Power Management

### Frequency Management

Most CPUs: run [powerd++](https://github.com/lonkamikaze/powerdxx) (`powerdxx` in ports).

Current Intel CPUs (>=Skylake): the [Intel Speed Shift patch](https://reviews.freebsd.org/D18028)
which lets the CPU handle it has landed! If you have speed shift mentioned in your dmesg, your CPU is already adjusting everything dynamically.

(To clear any confusion: Speed **Shift** is on-CPU adjustment, Speed**Step** is OS-driven adjustment that's exposed as sysctls that powerd(++) touches.)

### C-states

This is the most important thing for not eating power when idle.

Set sysctl `hw.acpi.cpu.cx_lowest` as low as it goes e.g. `"C8"`.
(Or `economy_cx_lowest="Cmax"` and `performance_cx_lowest="Cmax"` in `/etc/rc.conf` as a shortcut for that
if not using [runit](https://github.com/t6/freebsd-runit) or any other alternative init.)

On Intel CPUs, use `pcm.x 1` (from `intel-pcm`) to check C-state residency and energy consumption.
You want to be in C7 (both core and package) (or deeper if some chip does that) as much as possible when not doing anything.

Use `vmstat -i` to check interrupt rates.
Some misbehaving devices (e.g. inactive USB Bluetooth on Intel Wi-Fi cards) can spew a lot of interrupts
and waste power, disable them by running e.g. `usbconfig -d 0.3 power_off`.

### More

There's more power tips [here](https://vermaden.wordpress.com/2018/11/28/the-power-to-serve-freebsd-power-management/)
(e.g. for SATA disks)
but don't copy all the GPU tunables :)

## Various stuff

### Extra /boot/loader.conf tweaks

```
vfs.zfs.arc_max="4G" # limit ZFS ARC size — generally it yields memory to userspace programs, but ehh
hw.nvme.use_nvd="0" # use CAM-based NVMe disk driver (default on powerpc64 and aarch64 already)
hw.usb.no_boot_wait="1" # don't waste time on probing USB at early boot time (don't enable when booting from USB)
kern.vt.splash_cpu="1" # remember penguins on console? that's orbs on console
kern.msgbufsize="512000" # more space for dmesg
kern.hwpmc.nsamples="8192" # more space for pmcstat
kern.hwpmc.nbuffers_pcpu="128" # more space for pmcstat
```

### devd event rules

Restart devd to activate new rules!!

USB phone connection (vendor 0x18d1 is Google Nexus/Pixel) for
running ADB, MTP `fusefs-simple-mtpfs` etc. as regular user:

```
notify 100 {
        match "system"          "USB";
        match "subsystem"       "DEVICE";
        match "type"            "ATTACH";
        match "vendor"          "0x18d1";
        action  "chgrp wheel /dev/$cdev; chmod g+rw /dev/$cdev";
};
```

U2F token: `/usr/local/etc/devd/u2f.conf.sample` was installed by package `libu2f-host-1.1.4`

Asetek liquid cooler for control scripts like
[leviathan](https://github.com/jaksi/leviathan),
[krakenx](https://github.com/KsenijaS/krakenx) etc.
(all the Python scripts "for Linux" that use Python USB libraries work on FreeBSD):

```
notify 100 {
        match "system"          "USB";
        match "subsystem"       "DEVICE";
        match "type"            "ATTACH";
        match "vendor"          "0x2433";
        action  "chgrp wheel /dev/$cdev; chmod g+rw /dev/$cdev";
};
```

### Extra links/notes

AMD Ryzen CPUs: load `amdtemp` to read temperature (`sysctl dev.cpu.0.temperature`), BIOS overclocking works fine even though sysctl might show freq 2700 [#218262](https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=218262), ignore that

~~USB keyboard/mouse multimedia keys: [#222646](https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=222646)~~ use iichid!

MSI desktop mainboard RGB lighting: [msi-rgb](https://github.com/nagisa/msi-rgb)

Bluetooth audio, fake microphone from audio files, etc.: [audio/virtual_oss](https://www.freshports.org/audio/virtual_oss). 