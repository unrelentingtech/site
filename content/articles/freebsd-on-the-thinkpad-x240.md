+++
date = 2016-01-03T11:17:53+00:00
path = "/articles/freebsd-on-the-thinkpad-x240"
title = "FreeBSD on the ThinkPad X240"
updated = 2017-11-23T11:19:35+00:00

[extra]
client_id = ["https://micropublish.herokuapp.com"]

[taxonomies]
tag = ["freebsd"]

+++

So, I bought a laptop to run FreeBSD.

I was going to get a [C720 Chromebook](http://blog.grem.de/pages/c720.html), but I got a good deal for an X240. Yeah, yeah, a laptop from the preinstalled-insecure-adware company, whatever. Anyway, it’s a ThinkPad, so it feels very solid, has an excellent keyboard and good free software support.

So, let’s get FreeBSD running!

## Installation

I’ve replaced the stock HDD with an SSD, compiled the [drm-i915-update-38](https://github.com/freebsd/freebsd-base-graphics/tree/drm-i915-update-38) branch of FreeBSD on a different machine, wrote the memstick image to an old USB flash drive, booted it and installed FreeBSD on the ThinkPad.

<ins>**UPDATE**: that landed in head a long time ago, I think you can just pick up the latest release now.</ins>

The first installation, with ZFS root + UFS `/boot`, did not work because the EFI loader couldn’t load `zfs.ko`. After reinstalling on UFS, the loader does load `zfs.ko`… Oh well.

<ins>**UPDATE**: now ZFS root works out of the box.</ins>

GRUB 2 is also an option (and _the_ option for using [sysutils/beadm](https://www.freshports.org/sysutils/beadm)), but [the recent “backspace 28 times to bypass boot passphrase” vulnerability](https://unix.stackexchange.com/questions/250028/grub2-security-vulnerability-pressing-backspace-28-times-what-are-my-risks-wh/250079) really discouraged me from installing it. Of course, [what are you even trying to protect with that passphrase](https://twitter.com/rootkovska/status/677780387804901377), but ugh, GNU code “quality”.

## Power management

The usual laptop settings for `/etc/rc.conf`:

```
powerd_enable="YES"
powerd_flags="-a hiadaptive -b adaptive -i 75 -r 85 -p 500"
performance_cx_lowest="Cmax"
economy_cx_lowest="Cmax"
```

<ins>**UPDATE**: [powerd++](https://github.com/lonkamikaze/powerdxx) is a better powerd!</ins>

And for `/boot/loader.conf`:

```
hw.pci.do_power_nodriver=3
drm.i915.enable_rc6=7
hw.snd.latency=7
hint.pcm.0.buffersize=65536
hint.pcm.1.buffersize=65536
hint.pcm.2.buffersize=65536
hw.snd.feeder_buffersize=65536
```

Battery life with the internal + big external battery: ~8 - 8.5 hours of mostly surfing the web with Firefox on Wi-Fi with 50% screen brightness. (Obviously, more hours without Firefox :D) I don’t know how some reviewers got 20 hours of Wi-Fi browsing on Windows. Linux users say it’s [6-7 hours](https://www.reddit.com/r/Ubuntu/comments/2oheiu/linux_os_suggestion_for_lenovo_x240/cmn7n0o) or [above 8 hours](http://www.splitbrain.org/blog/2014-03/08-lenovo_thinkpad_x240_xubuntu), so FreeBSD is not worse than Linux there. That’s good :-)

I couldn’t get suspend/resume to work. It does suspend but doesn’t resume (pressing the power button makes the fans spin, but the power button is still blinking).

But putting the X240 into sleep mode for short breaks is not really necessary. With the huge battery and the ultra-low-power processor, just leaving it running for 15-30 minutes won’t drain the battery much.

Oh, and the power consumption can be measured with Intel’s performance counters. Install [sysutils/intel-pcm](https://freshports.org/sysutils/intel-pcm/) and run:

```
$ sudo kldload cpuctl
$ sudo pcm.x
```

Power consumption of the CPU (and GPU, and everything else on the chip) when idle and running Xorg is around 3 Watt.

## Ethernet and Wi-Fi

Works. This laptop has Intel’s networking hardware, which is great news for free operating systems. Not that I like Intel (super evil Management Engine!!) but they do write open source drivers for Linux, and BSD developers port them to the BSDs.

The Intel PRO/1000 Ethernet card is supported by the `em` driver.

The Intel 7260 wireless card is supported by the `iwm` driver.

Only `802.11a/b/g` is supported in `iwm` for now (IIRC because the driver is imported from OpenBSD, and they’re still working on `802.11n` support).

## Bluetooth

Doesn’t work.

Apparently, it’s [this one](http://www.ubuntu.com/certification/catalog/component/usb/4103/8087%3A07dc/).

It’s not even connecting as a USB device:

```
usbd_req_re_enumerate: addr=1, set address failed! (USB_ERR_TIMEOUT, ignored)
usbd_setup_device_desc: getting device descriptor at addr 1 failed, USB_ERR_TIMEOUT
ugen0.2: <Unknown> at usbus0 (disconnected)
uhub_reattach_port: could not allocate new device
```

I never use Bluetooth on laptops, anyway.

## Graphics (Intel HD Graphics on Haswell!)

Works. <s>Well, there’s a reason I’m using the `drm-i915-update-38` branch ;-) This is not in a release yet — it’s not even in `-CURRENT`! — so I’m not expecting perfect quality.</s>

<ins>**UPDATE**: this was merged a long time ago. There's a new `drm-next` in [the graphics team's fork](https://github.com/FreeBSDDesktop/freebsd-base-graphics) though, and it brings Skylake support, Wayland…</ins>

But it works fine with correct settings.

Do not load `i915kms` in the boot loader!! The system won’t boot. Instead, use the `kld_list` setting in `/etc/rc.conf` to load the module later in the boot process.

When you load `i915kms`, it will repeat this error for less than a second:

```
error: [drm:pid51453:intel_sbi_read] *ERROR* timeout waiting for SBI to complete read transaction
error: [drm:pid51453:intel_sbi_write] *ERROR* timeout waiting for SBI to complete write transaction
```

That’s okay, it works anyway. Looks like [this is not even Haswell specific](https://github.com/freebsd/freebsd/commit/4ef184b756b083683d4bac92ab02330aa08c4427).

So, here’s the `xorg.conf` part:

```
Section "Device"
      Option      "AccelMethod"            "sna"
      Option      "TripleBuffer"           "true"
      Option      "HotPlug"                "true"
      Option      "TearFree"               "false"
      Identifier  "Card0"
      Driver      "intel"
      BusID       "PCI:0:2:0"
EndSection
```

<ins>**UPDATE**: with `drm-next`, the `modesetting` driver with `glamor` acceleration works!</ins>

Brightness adjustment works via ~~both~~ [graphics/intel-backlight](https://www.freshports.org/graphics/intel-backlight/) ~~and `acpi_video` (`sysctl hw.acpi.video.lcd0.brightness`)~~. ~~The brightness keys on the keyboard don’t work properly though. The fn key on F5 (lower brightness) just sets the brightness to maximum, F6 (raise brightness) does nothing. Here’s the error that’s shown when pressing the lower brightness key with `drm.debug=3` in `/boot/loader.conf`:~~

```
[drm:KMS:pid12:intel_panel_get_max_backlight] max backlight PWM = 852
[drm:KMS:pid12:intel_panel_actually_set_backlight] set backlight PWM = 841
[drm:pid12:intel_opregion_gse_intr] PWM freq is not supported

```

~~So I’ve configured F5 and F6 (the real function keys, FnLock mode) to call `intel_backlight`.~~

<ins>**UPDATE**: `acpi_video` is the one incorrectly changing the brightness to max! Don't load it. `acpi_ibm` changes the brightness correctly!</ins>

HDMI output works with a Mini DisplayPort adapter. 1080p video playback on an HDMI TV using `mpv` is smooth.

VAAPI video output and hardware accelerated decoding works. With `mpv --vo=vaapi --hwdec=vaapi`, CPU usage is around 20% for a 1080p H.264 video (vs. 60% with software decoding), the fans stay silent. You’ll need to install [multimedia/libva-intel-driver](https://www.freshports.org/multimedia/libva-intel-driver/) and [multimedia/mpv](https://www.freshports.org/multimedia/mpv) from pkg, and rebuild [multimedia/ffmpeg](https://www.freshports.org/multimedia/ffmpeg) with the VAAPI option.

~~OpenCL on the Haswell GPU (powered by Beignet) doesn’t work yet. `clinfo` shows:~~

```
Beignet: self-test failed: (3, 7, 5) + (5, 7, 3) returned (3, 7, 5)
```

<ins>**UPDATE**: OpenCL was fixed a long time ago.</ins>

## Audio

Works. The built-in Realtek ALC292 sound card just works. FreeBSD’s audio support is good.

The internal microphone is recognized as a separate device:

```
$ cat /dev/sndstat
Installed devices:
pcm0: <Intel Haswell (HDMI/DP 8ch)> (play)
pcm1: <Realtek ALC292 (Analog 2.0+HP/2.0)> (play/rec) default
pcm2: <Realtek ALC292 (Internal Analog Mic)> (rec)
```

HDMI audio works too (`sysctl hw.snd.default_unit` to switch the sound card; applications that play sound have to be restarted.)

## Webcam

Works. With `webcamd`, of course. But I don’t need it, so I’ve disabled it in the BIOS Setup.

## SD card reader

Doesn’t work.

`pciconf` detects it as:

```
none2@pci0:2:0:0:       class=0xff0000 card=0x221417aa chip=0x522710ec rev=0x01 hdr=0x00
    vendor     = 'Realtek Semiconductor Co., Ltd.'
    device     = 'RTS5227 PCI Express Card Reader'
```

It’s supported in OpenBSD with [rtsx(4)](http://www.openbsd.org/cgi-bin/man.cgi/OpenBSD-current/man4/rtsx.4?query=rtsx&sec=4). FreeBSD bugs for this: [161719](https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=161719), [204521](https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=204521).

It should be possible to use it with OpenBSD/NetBSD/Linux in a bhyve VM with PCI passthrough, like [the Wi-Fi card before iwm was added](http://0xfeedface.org/2014/12/11/FreeBSD-Intel-wifi-via-bhyve.html). That would also be more secure (that’s what [Qubes](https://www.qubes-os.org) does for all the hardware.) But I don’t need to use SD cards on this laptop.

## Trackpad and TrackPoint

~~Oh, this is the most interesting part. Well, it works, sure. But there are at least three ways of using them, none of which is perfect.~~

<ins>**UPDATE**: [evdev synaptics landed in current](https://github.com/freebsd/freebsd/commit/bc8448b7c73bbbcaf15b375eb9648e963bcc8334)!</ins>

### moused

FreeBSD includes `moused`, a little daemon that watches the mouse device you tell it to watch and forwards all events to a virtualized mouse, which is accessible to Xorg at `/dev/sysmouse` and also works on the text console. It has advanced support (like sensitivity settings) for Synaptics touchpads and ThinkPad TrackPoints (set `hw.psm.synaptics_support=1` and `hw.psm.trackpoint_support=1` in `/boot/loader.conf` to enable).

Sadly, it forwards all events to a virtualized _mouse_. Not a trackpad, just a mouse, so the experience is not as good.

`xorg.conf`:

```
Section "InputDevice"
      Identifier "SysMouse"
      Driver     "mouse"
      Option     "Device" "/dev/sysmouse"
EndSection
```

### xf86-input-synaptics

This is the Synaptics driver that provides a great trackpad experience. Inertial scrolling, horizontal scrolling, natural scrolling, perfectly smooth cursor movement… Everything is as good as in OS X on a MacBook.

~~But the TrackPoint doesn’t work. On the X240, it’s attached to the trackpad as a guest mouse. The trackpad forwards the TrackPoint’s PS/2 events with a special mark (IIRC, it’s W = 3).~~

And the Synaptics driver [stopped supporting guest devices in 2010](http://cgit.freedesktop.org/xorg/driver/xf86-input-synaptics/commit/?id=b19e3782a77c171ca20fc962f95923495fdb7978).

<ins>**UPDATE**: [added the guest mouse support back to xf86-input-synaptics](https://github.com/myfreeweb/xf86-input-synaptics)! Also adds ClickPad support to the raw PS/2 protocol used by the driver on the BSDs (on Linux, it uses evdev, and they only added clickpad support there).</ins>

~~Also, clicking doesn’t work, but I don’t care. I’m used to tapping.~~

`xorg.conf`:

```
Section "InputDevice"
      Identifier  "Touchpad"
      Driver      "synaptics"
      Option      "Protocol" "psm"
      Option      "Device" "/dev/psm0"
      Option      "VertEdgeScroll" "off"
      Option      "VertTwoFingerScroll" "on"
      Option      "HorizEdgeScroll" "off"
      Option      "HorizTwoFingerScroll" "on"
      Option      "VertScrollDelta" "-111"
      Option      "HorizScrollDelta" "-111"
      Option      "ClickPad" "on"
      Option      "SoftButtonAreas" "4201 0 0 1950 2710 4200 0 1950"
      Option      "AreaTopEdge" "5%"
EndSection
```

### evdevfbsd

I accidentally found [evdevfbsd](https://github.com/jiixyj/evdevfbsd), a little program that exposes PS/2 devices as `evdev` devices via CUSE (**C**haracter Device in **Use**rspace).

`evdev` is a protocol that comes from Linux. It allows kernel (or CUSE) drivers to provide a standardized interface for devices so that Xorg wouldn’t care about any particular vendor.

`evdevfbsd` correctly separates the trackpad and the TrackPoint. Cursor movement works. But only cursor movement. No touch scrolling, no tapping, no clicking. And it looks like it might be `xf86-input-evdev`’s fault, because [evtest.py](https://github.com/gvalkov/python-evdev/blob/master/bin/evtest.py) shows tap events when tapping!

### ~~Something else?~~

~~I’ve tried to write a CUSE program that works as a proxy between `/dev/psm0` and the Synaptics driver, extracting guest (TrackPoint) events in the process.~~

~~It almost works… the only problem is that the Synaptics driver locks the whole X server while reading from my proxy, so only mouse movement works and nothing else, not even Ctrl+Alt+F1 to switch to a console. Well, the power button works. And SSHing into the laptop.~~

~~Seems like the problem with CUSE is that there’s no way to find out, in the `poll` method, that the process that polls your device wants to stop. So, when `moused` reads from the proxy, it works, but when you stop `moused` with Ctrl-C, it doesn’t stop until you touch the TrackPoint or the trackpad a little to send an event.~~

<ins>**UPDATE**: [added the guest mouse support back to xf86-input-synaptics](https://github.com/myfreeweb/xf86-input-synaptics)!</ins>

## Touchscreen

Works. It’s recognized as a USB HID device at `/dev/uhid0`. There are two ways to use it in Xorg.

### Mouse emulation

The simple way: you can use it with the `mouse` driver, as a regular mouse. Obviously, this does not provide multi-touch.

`xorg.conf`:

```
Section "InputDevice"
      Identifier "Touchscreen"
      Driver     "mouse"
      Option     "Protocol" "usb"
      Option     "Device" "/dev/uhid0"
EndSection
```

### Multi-touch

The other way: you can use it with `webcamd` and the `evdev` driver. This will actually support multi-touch.

Recompile [x11-drivers/xf86-input-evdev](https://freshports.org/x11-drivers/xf86-input-evdev) from ports with the `MULTITOUCH` option, start `webcamd` like this (note that CUSE is part of the base system on `11-CURRENT`, so it’s not called `cuse4bsd` anymore):

```
$ sudo make -C /usr/ports/x11-drivers/xf86-input-evdev config deinstall install clean
$ sudo kldload cuse
$ sudo webcamd -d ugen1.3 -N Touchscreen-ELAN -M 0
```
`xorg.conf`:

```
Section "InputDevice"
      Identifier "Touchscreen"
      Driver     "evdev"
      Option     "Device" "/dev/input/event0"
EndSection
```

Start `chrome --touch-events` and visit the [touch event test](http://www.snappymaria.com/canvas/TouchEventTest.html)! Also, you can scroll in GTK+ 3 applications like [Corebird](http://corebird.baedert.org/).

Unfortunately, it’s really bad at detecting when a touch _ends_. This means that scrolling and tapping [will get stuck](https://www.youtube.com/watch?v=nMR1o5cc2nc). So I’m using the `mouse` driver for now.

**UPDATE:** the new `wmt(4)` kernel driver supports the touchscreen perfectly, without that issue!! Also, `libinput`  is better than `evdev` in Xorg.

## TPM (Trusted Platform Module)

Works. (With the dedicated TPM 1.2 module. Haven’t tried Intel’s built-in TPM 2.0 support. The choice between them is in the BIOS/UEFI settings.)

OpenSSH works with a TPM key through [simple-tpm-pk11](https://github.com/ThomasHabets/simple-tpm-pk11).

**UPDATE:** turns out the TPM was preventing the laptop from waking up from suspend! (And I did unload the tpm module before suspend.) Disabled it in firmware settings.

## Conclusion

It’s possible to use a Haswell ThinkPad with FreeBSD right now :-) Everything except Bluetooth, SD cards and ~~waking up from sleep~~ works.

OpenBSD would be better though. They have excellent ThinkPad support, because OpenBSD developers use OpenBSD on ThinkPads. But I’m working on software that uses FreeBSD jails, and I just prefer FreeBSD.