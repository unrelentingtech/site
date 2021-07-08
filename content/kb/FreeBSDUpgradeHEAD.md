+++
date = 2018-10-27T15:28:42+00:00
path = "/kb/FreeBSDUpgradeHEAD"
title = "FreeBSDUpgradeHEAD"
updated = 2018-10-27T15:29:03+00:00

[taxonomies]
tag = ["freebsd"]

+++

Unpacking a new base.txz snapshot:

```bash
doas chflags schg /etc/{rc.conf,pwd.db,group,passwd,master.passwd,dhclient.conf} && doas chflags noschg /lib/{libc.so.*,libcrypt.so.*,libthr.so.*} /libexec/ld-elf.so.1 /sbin/init /usr/bin/{passwd,chpass,crontab,login,opieinfo,opiepasswd,su} /usr/lib/librt.so.*
cd /
doas tar -xvf ~/base.txz
doas chflags noschg /etc/{rc.conf,pwd.db,group,passwd,master.passwd,dhclient.conf} && doas chflags schg /lib/{libc.so.*,libcrypt.so.*,libthr.so.*} /libexec/ld-elf.so.1 /sbin/init /usr/bin/{passwd,chpass,crontab,login,opieinfo,opiepasswd,su} /usr/lib/librt.so.*
```

Cross-building a new kernel for aarch64:

```bash
nice -n20 time make -j14 buildkernel KERNCONF=GENERIC-NODEBUG MACHINE=arm64 MACHINE_ARCH=aarch64 MACHINE_CPUARCH=aarch64
```

Sending to a remote machine:

```bash
scp /usr/obj/usr/src/arm64.aarch64/sys/GENERIC-NODEBUG/kernel example.lan:~
find /usr/obj/usr/src/arm64.aarch64/sys/GENERIC-NODEBUG -name '*.ko' -exec scp "{}" example.lan:~ ";" 
```