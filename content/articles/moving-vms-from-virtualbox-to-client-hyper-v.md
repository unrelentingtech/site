+++
date = 2017-07-20T20:39:20+00:00
path = "/articles/moving-vms-from-virtualbox-to-client-hyper-v"
title = "Moving VMs from VirtualBox to Client Hyper-V"
description = "The year of the Windows desktop?"
updated = 2021-06-27T20:20:31+00:00

[extra]

[[extra.photo]]
height = 1361
id = "screenshot"
tiny_preview = "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAABQBQCdASowACAAP+Hq6Gy/vLAptVv4A/A8CWUAAFvoq1QAz3i1Z8XiXfRZhGz5R7FJeYAA/lHT2bCUVBNGZjAIYCm9raJANh9WUjtiCqakB89wXAwAAA=="
width = 1981

[[extra.photo.palette]]
b = 230
g = 232
r = 233

[[extra.photo.palette]]
b = 116
g = 84
r = 91

[[extra.photo.palette]]
b = 4
g = 4
r = 5

[[extra.photo.palette]]
b = 215
g = 190
r = 157

[[extra.photo.palette]]
b = 194
g = 69
r = 180

[[extra.photo.palette]]
b = 203
g = 143
r = 101

[[extra.photo.palette]]
b = 156
g = 152
r = 151

[[extra.photo.palette]]
b = 111
g = 98
r = 152

[[extra.photo.palette]]
b = 116
g = 69
r = 23

[[extra.photo.source]]
original = false
type = "image/png"

[[extra.photo.source.srcset]]
src = "https://dl.unrelenting.technology/cf14465b27bb_0dd1c915-hyperv.1981.png"
width = 1981

[[extra.photo.source]]
original = true
type = "image/png"

[[extra.photo.source.srcset]]
src = "https://dl.unrelenting.technology/0dd1c915-hyperv.png"
width = 1981

[taxonomies]
tag = ["windows","freebsd","linux","openbsd","virtualization"]

+++

I've decided to move the VMs on my desktop from VirtualBox to Microsoft Hyper-V.
Because reasons.

Actually because I've upgraded my desktop to an AMD Ryzen CPU: first, AMD-V/SVM is not supported by the *Intel* HAXM thing from the Android SDK, so I wanted to try out Microsoft's Hyper-V based Android "emulator" (VM configurator/runner thingy) instead.
Second, giving 16 virtual CPUs on an SMT 8-core to a FreeBSD guest in VirtualBox results in a weird performance issue.
(Though giving 4 vCPUs to *multiple* VMs on a 4-core CPU worked fine.)
Third, it's *Oracle* VM VirtualBox and no one likes Oracle.

{{ photo(id="screenshot") }}

So, here's how you can do it as well.

## How to get Hyper-V

You need Windows 10 Pro, Enterprise or Education.
(Or Windows Server, obviously.)
Just enable it as a feature and restart.

Alternatively, installing the [MS Android "emulator"](https://www.visualstudio.com/vs/msft-android-emulator/) automatically enables it.

## How to migrate a VM (FreeBSD, Linux or Windows with EFI)

(NOTE: older versions of FreeBSD apparently had some loader issue that prevented EFI boot in Hyper-V. Everything works for me on a recent build of 11-STABLE.)

In VirtualBox, go to the Virtual Media Manager (Ctrl+D) and copy your disk as `VHD`.
In the Hyper-V Manager, use the Edit Disk dialog to convert the `VHD` to `VHDX`.

If you haven't done that yet, go to the Virtual Switch Manager and make a virtual switch ("External" is like bridge mode in VBox).

Now make a virtual machine.
Generation 2, no dynamic memory (FreeBSD doesn't support that), select the virtual switch and the VHDX disk.

Click Connect and it should just work.

By the way, it's nice that you can always close the console window without powering off the VM, unlike in VirtualBox where you need a special "Detachable start".

Interestingly, if you create the VM without a disk and attach the disk later, you won't see "boot from hard drive" in the firmware / boot order settings.
And there's no add button! (WTF?)
The fix is to use PowerShell:

```powershell
$vm = Get-VM "YOUR VM NAME"
Set-VMFirmware $vm -FirstBootDevice (Get-VMHardDiskDrive $vm)
```

Speaking of which, it's nice to have a directly integrated PowerShell interface to all the things.
My little [xvmmgr](https://github.com/myfreeweb/xvmmgr) script was initially written for VirtualBox, and that required *COM*.

## How to migrate a VM (other OS)

Well, a similar process, but use Generation 1.

## My experience so far

Client Hyper-V has pleasantly surprised me.
It's a very smooth experience: it *looks* like a Type 2 hypervisor even though it's actually Type 1, it runs VMs without any performance issues… what else could you ask for?

Well, the downside is its lack of flexibility in terms of paravirtualized (MS calls them "synthetic" or something) vs emulated devices.

All you get is the choice between two generations.
Generation 1 means legacy BIOS boot from an emulated *IDE* drive with emulated all the things plus optionally some paravirtualized devices like the NIC.
Generation 2 means EFI boot from a SCSI drive with paravirtualized *everything*.
Oh and the SCSI controller is also on the `vmbus`.
So there's no way to use EFI and SCSI with e.g. OpenBSD, you need full Hyper-V support for at least the disk and network to do that.
Thankfully Microsoft contributed that support to FreeBSD! :)
