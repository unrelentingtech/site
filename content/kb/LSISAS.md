+++
date = 2017-11-24T23:12:12+00:00
path = "/kb/LSISAS"
title = "LSISAS"

[taxonomies]
tag = ["hardware"]

+++

When flashing an OEM LSI SAS/SATA HBA/RAID card (Dell PERC H200, IBM ServeRAID M1015) into an LSI 9211-8i (IT mode), `megarec` / any DOS stuff is NOT required! If you get a "Failed to Validate Mfg" error when cross-flashing from EFI Shell, just **use an older version** (P14 or older I think, P5 works fine) of `sas2flash.efi`! (And maybe flash vendor firmware first? Not sure if required, probably not.)