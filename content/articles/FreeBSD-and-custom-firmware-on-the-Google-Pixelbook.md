+++
date = 2019-10-06T20:38:20+00:00
path = "/articles/FreeBSD-and-custom-firmware-on-the-Google-Pixelbook"
title = "FreeBSD and custom firmware on the Google Pixelbook"
updated = 2019-10-24T00:00:52+00:00

[taxonomies]
tag = ["freebsd","hardware","coreboot"]

+++

[Back in 2015](/articles/freebsd-on-the-thinkpad-x240), I jumped on the ThinkPad bandwagon by getting an X240 to run FreeBSD on.
Unlike most people in the ThinkPad crowd, I actually liked the clickpad and didn't use the trackpoint much.
But this summer I've decided that it was time for something newer.
I wanted something..

- lighter and thinner (ha, turns out this is actually important, I got tired of carrying a T H I C C laptop - Apple was right all along);
- with a 3:2 display (why is Lenovo making these Serious Work™ laptops 16:9 in the first place??
  16:9 is **awful** in below-13-inch sizes especially);
- with a HiDPI display (and ideally with a good size for exact 2x scaling instead of fractional);
- with USB-C ports;
- without a dGPU, *especially* without an NVIDIA GPU;
- assembled with screws and not glue (I don't necessarily need expansion and stuff in a laptop all that much,
  but being able to replace the battery without dealing with a glued chassis is good);
- supported by FreeBSD of course ("some development required" is okay but I'm not going to write *big* drivers);
- how about something with open source firmware, that would be fun.

The [Qualcomm aarch64 laptops](https://github.com/aarch64-laptops) were out because embedded GPU drivers like freedreno
(and UFS storage drivers, and Qualcomm Wi-Fi..) are not ported to FreeBSD.
And because Qualcomm firmware is very cursed.

[Samsung's RK3399 Chromebook](https://rosenzweig.io/blog/panfrost-on-the-rk3399-meow.html)
or the new [Pinebook Pro](https://www.pine64.org/pinebook-pro/) would've been awesome.. if I were a Linux user.
No embedded GPU drivers on FreeBSD, again. No one has added the stuff needed for FDT/OFW attachment to LinuxKPI.
It's rather tedious work, so we only support PCIe right now.
(Can someone please make an ARM laptop with a PCIe GPU, say with an [MXM slot](https://en.wikipedia.org/wiki/Mobile_PCI_Express_Module)?)

So it's still gonna be amd64 (x86) then.

I really liked the design of the Microsoft Surface Book, but the
[iFixit score of 1 (one)](https://www.ifixit.com/Teardown/Microsoft+Surface+Book+Teardown/51972#s113615)
and especially the Marvell Wi-Fi chip that doesn't have a driver in FreeBSD are dealbreakers.

I was considering a ThinkPad X1 Carbon from an old generation - the one from the same year as the X230 is corebootable, so that's fun.
But going *back* in processor generations just doesn't feel great.
I want something more efficient, not less!

And then I discovered the [Pixelbook](https://en.wikipedia.org/wiki/Google_Pixelbook).
Other than the big huge large bezels around the screen, I liked everything about it.
Thin aluminum design, a 3:2 HiDPI screen, **rubber palm rests** (why isn't every laptop ever doing that?!), 
the "convertibleness" (flip the screen around to turn it into.. something rather big for a tablet, but it is useful actually),
a Wacom touchscreen that supports a pen, mostly reasonable hardware (Intel Wi-Fi),
and that famous coreboot support (Chromebooks' stock firmware *is* coreboot + depthcharge).

So here it is, my new laptop, a Google Pixelbook.

## What is a Chromebook, even

The write protect screw is kind of a meme.
All these years later, it's That Thing everyone on various developer forums associates with Chromebooks.
But times have moved on.
As a reaction to glued devices and stuff, the Chrome firmware team has discovered a new innovative way of asserting
physical presence: sitting around for a few minutes, pressing the power button when asked.
Is actually pretty clever though, it *is* more secure than.. not doing that.

Wait, what was that about?

Let's go back to the beginning and look at firmware security in Chromebooks and other laptops.

These devices are designed for the mass market first.
Your average consumer trusts the vendor and (because they've read a lot of scary news) might be afraid of scary attackers
out to install a stealthy rootkit right into their firmware.
Businesses are even more afraid of that, and they push for boot security on company laptops even more.
This is why [Intel Boot Guard](https://github.com/corna/me_cleaner/wiki/Intel-Boot-Guard) is a thing
that the vast majority of laptops have these days.
It's a thing that makes sure only the vendor can update firmware.
Evil rootkits are out. Unfortunately, the user is also out.

Google is not like most laptop vendors.

Yes, Google is kind of a surveillance capitalism / advertising monster, but that's not what I'm talking about here.
Large parts of Google are very much driven by FOSS enthusiasts.
Or something. Anyway, the point is that Chromebooks are based on FOSS firmware and support
user control as much as possible.
(Without compromising regular-user security, but turns out these are not conflicting goals and we can all be happy.)

Instead of Boot Guard, Google has its own way of securing the boot process.
The root of trust in modern (>=2017) devices is a special
[Google Security Chip](https://www.youtube.com/watch?v=gC-lbMNmIsg), which in normal circumstances
also ensures that only Google firmware runs on the machine, but:

- if you sit through the aforementioned power-button-clicking procedure,
  you get into Developer Mode: OS verification is off, you have a warning screen at boot,
  and you can press Ctrl-D to boot into Chrome OS, or (if you enabled this via a command run as root)
  Ctrl-L to open SeaBIOS.
  - Here's the fun part.. it doesn't have to be SeaBIOS.
    You can flash any Coreboot payload into the `RW_LEGACY` slot right from Chrome OS, reboot, press a key
    and you're booting that payload!
- if you also [buy](https://www.sparkfun.com/products/14746) or
  [solder](https://chromium.googlesource.com/chromiumos/third_party/hdctools/+/master/docs/ccd.md#making-your-own-suzyq)
  a special cable ("SuzyQable") and do the procedure a couple times more, your laptop turns into the
  Ultimate Open Intel Firmware Development Machine. Seriously.
  - the security chip is a debug chip too!
    [Case Closed Debugging](https://chromium.googlesource.com/chromiumos/platform/ec/+/master/docs/case_closed_debugging_cr50.md)
    gives you serial consoles for the security chip itself, the embedded controller (EC) and the application processor (AP, i.e. your main CPU),
    and it also gives you a flasher
    (via [special flashrom](https://aur.archlinux.org/packages/flashrom-chromeos/) for now, but I'm told there's plans to upstream)
    that allows you to write AP and EC firmware;
  - some security is still preserved with all the debugging: you can (and should) set a CCD password, which lets you
    lock-unlock the debug capabilities and change write-protect whenever you want, so that only you can flash firmware
    (at least without opening the case and doing **very** invasive things, the flash chip is not even SOIC anymore I think);
  - and you can hack without fear: the security chip is not brickable! Yes, yes, that means the chip is only a
    "look but don't touch" kind of open source, it will only boot Google-signed firmware.
    Some especially paranoid people think this is An NSA Backdoor™.
    I think this is an awesome way to allow FULL control of the main processor and the EC,
    over just a cable, with **no way of bricking the device**!
    And to solve the paranoia, [reproducible builds](https://reproducible-builds.org/) would be great.

## You mentioned something about FreeBSD in the title?

Okay, okay, let's go.
I didn't even *want* to write an introduction to Chromebooks but here we are.
Anyway, while waiting for the debug cable to arrive, I've done a lot of work on FreeBSD,
using the first method above (`RW_LEGACY`).

SeaBIOS does not have display output working in OSes that don't specifically support the Coreboot framebuffer
(OpenBSD does, FreeBSD doesn't), and I really just hate legacy BIOS, so
I've had to install a UEFI implementation into `RW_LEGACY` since I didn't have the cable yet.
My own EDK2 build did not work (now I see that it's probably because it was a debug build and that has failing assertions).
So I've downloaded [MrChromebox's full ROM image](https://mrchromebox.tech), extracted the payload using `cbfstool`
and flashed that. Boom. Here we go, press Ctrl-L for UEFI. Nice. Let's install FreeBSD.

The live USB booted fine. With the EFI framebuffer, an NVMe SSD and a PS/2 keyboard it was a working basic system.
I've resized the Chrome OS data partition (Chrome OS recovers from that fine, without touching custom partitions),
found that there's already an EFI system partition (with a GRUB2 setup to boot Chrome OS, which didn't boot like that o_0),
installed everything and went on with configuration and developing support for more hardware.

(note: I'm leaving out the desktop configuration part here, it's mostly a development post; I use [Wayfire](https://github.com/WayfireWM/wayfire) as my display server if you're curious.)

So how's the hardware?

### Wi-Fi and Bluetooth

Well, that was easy.
The Pixelbook has an Intel 7265.
The exact same wireless chip that was in my ThinkPad.
So, Wi-Fi works great with `iwm`.

Bluetooth.. if this was the newer 8265, would've already just worked :D

These Intel devices present a "normal" `ubt` USB Bluetooth adapter, except it only becomes normal if you upload firmware
into it, otherwise it's kinda dead.
(And in that dead state, it spews interrupts, raising the idle power consumption by preventing the system
from going into package C7 state! So `usbconfig -d 0.3 power_off` that stuff.)
FreeBSD now has a firmware uploader for the 8260/8265, but it does not support the older protocol used by the 7260/7265.
It wouldn't be that hard to add that, but no one has done it yet.

### Input devices

#### Keyboard

Google kept the keyboard as good old PS/2, which is great for ensuring that you can get started with a custom OS
with a for-sure working keyboard.

About the only interesting thing with the keyboard was the Google Assistant key, where the Win key usually is.
It was not recognized as anything at all.
I used DTrace to detect the scancode without adding prints into the kernel and rebooting:

```
dtrace -n 'fbt::*scancode2key:entry { printf("[st %x] %x?\n", *(int*)arg0, arg1); } \
  fbt::*scancode2key:return { printf("%x\n", arg1);  }'
```

And wrote [a patch](https://reviews.freebsd.org/D21565) to interpret it as a useful key
(right meta, couldn't think of anything better).

#### Touch*

The touchpad and touchscreen are HID-over-I²C, like on many other modern laptops.
I don't know why this cursed bus from the 80s is *gaining* popularity, but it is.
At least FreeBSD has a driver for Intel (Synopsys DesignWare really) I²C controllers.

(Meanwhile Apple MacBooks now use [*SPI for even the keyboard*](https://github.com/roadrunner2/macbook12-spi-driver).
FreeBSD has an Intel SPI driver but right now it only supports ACPI attachment for Atoms and such, not PCIe yet.)

The even better news is that [there is a nice HID-over-I²C driver in development as well](https://github.com/wulf7/iichid).
(note: the [corresponding patch for configuring the devices via ACPI](https://people.freebsd.org/~wulf/acpi_iicbus.patch)
is pretty much a requirement, uncomment `-DHAVE_ACPI_IICBUS` in the iichid makefile too to get that to work.
Also, [upcoming Intel I²C improvement patch](https://bugs.freebsd.org/bugzilla/attachment.cgi?id=207356&action=diff).)

The touchscreen started working with that driver instantly.

The touchpad was.. a lot more "fun".
The I²C bus it was on would just appear dead.
After some [debugging](https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=240339), it turned out that the in-progress
iichid driver was sending a wrong extra out-of-spec command, which was causing Google's touchpad firmware
to throw up and lock up the whole bus.

But hey, nice bug discovery, if any other device turns out to be as strict in accepting input, no one else would have that problem.

Another touchpad thing: by default, you have to touch it with a lot of pressure.
Easily fixed in libinput:

```
% cat /usr/local/etc/libinput/local-overrides.quirks
[Eve touchpad]
MatchUdevType=touchpad
AttrPressureRange=12:6
```

#### **UPD 2019-10-24** Pixelbook Pen

The touchscreen in the Pixelbook is made by Wacom, and supports stylus input like the usual Wacom tablets.
For USB ones, on FreeBSD you can just use `webcamd` to run the Linux driver in userspace.
Can't exactly do that with I²C.

But! [Thankfully, it exposes generic HID stylus reports](/notes/2019-10-21-20-12-26), zero Wacom specifics required.
I've been able to [write a driver](https://github.com/wulf7/iichid/pull/5) for that quite easily.
Now it works. With pressure, tilt, the button, all the things :)

### Display backlight brightness

This was another "fun" debugging experience.
The `intel_backlight` console utility (which was still the thing to use on FreeBSD) did nothing.

I knew that the i915 driver on Chrome OS could adjust the brightness, so I made it work here too, and all it took is:

- [adding more things to LinuxKPI](https://reviews.freebsd.org/D21564) to allow uncommenting the
  brightness controls in i915kms;
- (and naturally, uncommenting them);
- finding out that this panel uses native DisplayPort brightness configured via DPCD (DisplayPort Configuration Data),
  enabling `compat.linuxkpi.i915_enable_dpcd_backlight="1"` in `/boot/loader.conf`;
- finding out that there's a fun bug in the.. hardware, sort of:
    - the panel reports that it supports both DPCD backlight and a direct PWM line (which is true);
    - Google/Quanta/whoever *did not connect* the PWM line;
    - (the panel is not aware of that);
    - the i915 driver prefers the PWM line when it's reported as available.

Turns out there was [a patch sent to Linux to add a "prefer DPCD" toggle](https://patchwork.kernel.org/patch/9640237/),
but for some reason it was not merged.
The patch does not apply cleanly so I just did a simpler hack version:

```diff
--- i/drivers/gpu/drm/i915/intel_dp_aux_backlight.c
+++ w/drivers/gpu/drm/i915/intel_dp_aux_backlight.c
@@ -252,8 +252,12 @@ intel_dp_aux_display_control_capable(struct intel_connector *connector)
         * the panel can support backlight control over the aux channel
         */
        if (intel_dp->edp_dpcd[1] & DP_EDP_TCON_BACKLIGHT_ADJUSTMENT_CAP &&
-           (intel_dp->edp_dpcd[2] & DP_EDP_BACKLIGHT_BRIGHTNESS_AUX_SET_CAP) &&
-           !(intel_dp->edp_dpcd[2] & DP_EDP_BACKLIGHT_BRIGHTNESS_PWM_PIN_CAP)) {
+           (intel_dp->edp_dpcd[2] & DP_EDP_BACKLIGHT_BRIGHTNESS_AUX_SET_CAP)
+/* for Pixelbook (eve), simpler version of https://patchwork.kernel.org/patch/9618065/ */
+#if 0
+            && !(intel_dp->edp_dpcd[2] & DP_EDP_BACKLIGHT_BRIGHTNESS_PWM_PIN_CAP)
+#endif
+                       ) {
                DRM_DEBUG_KMS("AUX Backlight Control Supported!\n");
                return true;
        }
```

And with that, it works, with 65536 steps of brightness adjustment even.

### Suspend/resume

The Pixelbook uses regular old ACPI S3 sleep, not the [fancy new S0ix thing](https://reviews.freebsd.org/D17676),
so that's good.

On every machine with a [TPM](https://en.wikipedia.org/wiki/Trusted_Platform_Module) though,
you have to tell the TPM to save state before suspending, otherwise you get a reset on resume.
I already knew this because I've [experienced that on the ThinkPad](/notes/2017-11-22-15-11-44).

The Google Security Chip runs an open-source TPM 2.0 implementation (fun fact, written by Microsoft)
and it's connected via… \*drum roll\* I²C. Big surprise (not).

FreeBSD already has TPM 2.0 support in the kernel, the
[userspace tool stack](https://github.com/tpm2-software/tpm2-tools) was recently added to Ports as well.
But of course there was no support for connecting to the TPM over I²C, and especially not to the
Cr50 (GSC) TPM specifically. (it has quirks!)

I [wrote a driver (WIP)](https://github.com/myfreeweb/freebsd/commit/600e6006c1b969b73d3fec86208f37011884f1e1)
hooking up the I²C transport (relies on the aforementioned ACPI-discovery-of-I²C patch).
It does not use the interrupt (I found it buggy: at first attachment, it fires continuously,
and after a reattach it stops completely) and after attach (or after system resume) the *first* command
errors out, but that can be fixed and other than that, it works.
Resume is fixed, entropy can be harvested, it [could be used for SSH keys](https://github.com/tpm2-software/tpm2-pkcs11) too.

Another thing with resume: I've had to build the kernel with `nodevice sdhci` to prevent the
Intel SD/MMC controller (which is not attached to anything here - I've heard that the 128GB model might be using eMMC
instead of NVMe but that's unclear) from [hanging for a couple minutes on resume](https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=211705).

### Dynamic CPU frequency

At least on the stock firmware, the old-school Intel SpeedStep did not work because the driver could not
find some required ACPI nodes (perf or something).

Forget that, the new [Intel Speed Shift](https://reviews.freebsd.org/D18028) (which lets the CPU adjust frequency on its own) works nicely with the linked patch.

### Tablet mode switch

When the lid is flipped around, the keyboard is disabled (unless you turn the display brightness to zero,
I've heard - which is fun because that means you can [connect a montior and have a sort-of
computer-in-a-keyboard look](https://www.reddit.com/r/PixelBook/comments/dalk1l/my_pixelbook_desktop_setup/f1u4nwi/),
like retro computers) and the system gets a notification (Chrome OS reacts to that by enabling tablet mode).

Looking at the DSDT table in ACPI, it was quite obvious how to support that notification:

```
Device (TBMC) {
    Name (_HID, "GOOG0006")  // _HID: Hardware ID
    Name (_UID, One)  // _UID: Unique ID
    Name (_DDN, "Tablet Motion Control")  // _DDN: DOS Device Name
    Method (TBMC, 0, NotSerialized) {
        If ((RCTM () == One)) { Return (One) }
        Else { Return (Zero) }
    }
}
```

On Linux, this is exposed as an evdev device with switch events.
I was able to [replicate that](https://reviews.freebsd.org/D21612) quite easily.
My display server does not support doing anything with that yet, but I'd like to do something like
enabling [an on-screen keyboard](https://source.puri.sm/Librem5/squeekboard) to pop up automatically
when tablet mode is active.

### Keyboard backlight brightness

I generally leave it off because I don't look at the keyboard, but this was
[a fun and easy driver to write](https://reviews.freebsd.org/D21746).

Also obvious how it works when looking at ACPI:

```
Device (KBLT) {
    Name (_HID, "GOOG0002")  // _HID: Hardware ID
    Name (_UID, One)  // _UID: Unique ID
    Method (KBQC, 0, NotSerialized) {
        Return (^^PCI0.LPCB.EC0.KBLV) /* \_SB_.PCI0.LPCB.EC0_.KBLV */
    }
    Method (KBCM, 1, NotSerialized) {
        ^^PCI0.LPCB.EC0.KBLV = Arg0
    }
}
```

### Using the debug cable **on** FreeBSD

The debug cable presents serial consoles as bulk endpoints without any configuration capabilities.
On Linux, they are supported by [the "simple" USB serial driver](https://github.com/torvalds/linux/blob/ba606975938179b1e893e44e190d0001de8e5262/drivers/usb/serial/usb-serial-simple.c).

Adding the device to the "simple" FreeBSD driver `ugensa` [took some debugging](https://reviews.freebsd.org/D21863).
The driver was clearing USB stalls when the port is opened.
That's allowed by the USB spec and quite necessary on some devices.
Unfortunately, the debug interface throws up when it sees that request.
The responsible code in the device [has a `/* Something we need to add support for? */` comment](https://chromium.googlesource.com/chromiumos/platform/ec/+/refs/tags/cr50_v4.5/chip/g/usb.c#835) :D

### Audio?

The only thing that's unsupported is onboard audio.
The usual HDA controller only exposes the DisplayPort audio-through-the-monitor thing.
The speakers, mic and headphone jack are all connected to various codecs exposed via… yet again, I²C.
I am not about to write the drivers for these codecs, since I'm not really interested in audio on laptops.

## Firmware is Fun

After the debug cable arrived, I've spent some time debugging the console-on-FreeBSD thing mentioned above,
and then started messing with coreboot and TianoCore EDK2.

My discoveries so far:

- there's nothing on the AP console on stock firmware because Google compiles release FW with serial output off,
  I think to save on power or something;
- `me_cleaner` [needs to be run with `-S -w MFS`](https://github.com/corna/me_cleaner/issues/300).
  As mentioned in the `--help`, the `MFS` partition contains PCIe related stuff.
  Removing it causes the NVMe drive to detach soon after boot;
- upstream Coreboot (including MrChromebox's builds) fails to initialize the TPM, just gets zero
  in response to the vendor ID request. Funnily enough, that would've solved the resume problem
  without me having to write the I²C TPM driver for FreeBSD - but now that I've written it, I'd prefer
  to actually have the ability to use the TPM;
- EDK2's recent `UefiPayloadPkg` doesn't support [PS/2 keyboard](https://bugzilla.tianocore.org/show_bug.cgi?id=2241)
  and [NVMe](https://bugzilla.tianocore.org/show_bug.cgi?id=2240) out of the box, but they're very easy to add
  (hopefully someone would add them upstream after seeing my bug reports);
- `UefiPayloadPkg` supports getting the framebuffer from coreboot very well;
- coreboot can run Intel's GOP driver before the payload (it's funny that we're running a UEFI module before
  running the UEFI implementation) and that works well;
- but `libgfxinit` - the nice FOSS, written-in-Ada, verified-with-SPARK implementation of Intel GPU
  initialization and framebuffer configuration - supports Kaby Lake now!
  - however, we have a DPCD thing again with this display panel here - it reports
    max lane bandwidth as `0x00`, `libgfxinit` interprets that as the slowest speed and
    we end up not having enough bandwidth for the high-res screen;
  - I've been told that this is because there's a new way of conveying this information that's unsupported. I'll dig
    around in the Linux i915 code and try to implement it properly here but for now, I just did a quick hack,
    hardcoding the faster bandwidth. Ta-da! My display is initialized with formally verified open source code!
    Minus one blob running at boot!
- persistent storage of EFI variables needs some SMM magic. There's
  [a quick patch](https://github.com/MrChromebox/edk2/commit/c792dbf1bd692bb95781a79d5d2d886a4933bc77) that
  changes EDK2's emulated variable store to use coreboot's SMM store.
  EDK2 has a proper SMM store of its own, I'd like to look into making that coreboot-compatible or at least
  just writing a separate coreboot-compatible store module.
- **UPD 2019-10-24** for external displays, DisplayPort alt mode on USB-C can be used. Things to note:
  - DP++ (DP cables literally becoming HDMI cables) can't work over USB Type C,
    which is why there are no `HDMI-A-n` connectors on the GPU, so a passive HDMI-mDP dongle plugged into a mDP-TypeC dongle won't work;
  - the Chrome EC runs the alt mode negotiation, the OS doesn't need any special support;
  - for DP dongles to work at all, the EC **must run RW firmware** and that doesn't happen as-is
    with upstream coreboot. There is a jump command on the EC console.
    Also [this patch](https://github.com/MrChromebox/coreboot/commit/3f6e950980e65980476808938f0395f187f36b3c)
    should help?? (+ [this](https://github.com/MrChromebox/coreboot/commit/23e81ecad1e20cd7bfbeb59e06804a5d5ba2f3bb))

### An aside: why mess with firmware?

If you're not the kind of person who's made happy by just the fact that some more code during the boot process
of their laptop is now open and verified, and you just want things to work, you might not be as excited
about open source firmware development as I am.

But you can do cool things with firmware that give you **practical** benefit.
The best example I'm seeing is better Hackintosh support.
Instead of patching macOS to work on your machine, you could patch your machine to pretend to almost be a Mac:

- [Creating hardware where no hardware exists](https://mjg59.dreamwidth.org/52149.html) (using SMM
  to emulate Apple's System Management Controller in coreboot);
- [AppleSupportPkg](https://github.com/acidanthera/AppleSupportPkg) (making EDK2 more compatible with Apple things).

Is this cool or what?

## Conclusion

Pixelbook, FreeBSD, coreboot, EDK2 good.

Seriously, I have no big words to say, other than just recommending this laptop to FOSS enthusiasts :)