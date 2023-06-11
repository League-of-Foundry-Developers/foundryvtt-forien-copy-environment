# FoundryVTT - Forien's Copy Environment

![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/League-of-Foundry-Developers/foundryvtt-forien-copy-environment) ![GitHub Releases](https://img.shields.io/github/downloads/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/latest/total) ![GitHub Releases](https://img.shields.io/github/downloads/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/total) ![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fforien-copy-environment&colorB=4aa94a) ![Foundry Version](https://img.shields.io/badge/dynamic/json.svg?url=https://github.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/releases/latest/download/module.json&label=foundry%20version&query=$.compatibleCoreVersion&colorB=blueviolet) ![Forien's Copy Environment](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FLeague-of-Foundry-Developers%2Fleague-repo-status%2Fshields-endpoint%2Fforien-copy-environment.json)



**NOTE** This is an unofficial forked version of the module maintained by the League of Foundry Developers to provide module continuity while Forien is unavailable.

**[Compatibility]**: *FoundryVTT* 0.6.0 - 11.0+

**[Systems]**: *any*

This module allows for fast copy/save environment data such as core version or list of installed modules and their versions. Supports copying as TXT or saving as JSON.

Module also allows to export (save/backup) current game settings and then import (restore) them. Non-GM users can only import client-side settings.

## Installation

1. Install Forien's Copy Environment using manifest URL: https://raw.githubusercontent.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/master/module.json
2. While loaded in World, enable **_Forien's Copy Environment_** module.

### Usage

Go to Settings tab in Sidebar and **right click** on data **below** "General Information" header

![](https://i.gyazo.com/8f41b4e7f52e8f560f9265774a9849db.gif)

## Features

* Copy Environment (core, system and module versions) to clipboard
* Save Environment (including manifest links) as a JSON file
* Export game settings (both 'world' and 'client' scopes)
* Import game settings ('client' ones, and if you are GM also 'world' ones - you will be able to choose which ones you want to import)

*Please note that importing 'world' scope settings en masse as GM might cause some issues to connected players. I advise players should logout before attempting to import World Settings*

## Info for Module Developers

### How do I opt out?

Perhaps you have a module that you don't want the settings being copied between worlds. You can add the following to your module manifest file to opt out of having the settings copied. The `active` state of your module will still be copied, just the settings won't.

1. Add `noCopyEnvironmentSettings: true` to your manifest json inside of the `flags` field of the manifest.

module.json
```md
  "flags": {
    "noCopyEnvironmentSettings": true
  }
```

## Contact

[League of Foundry Developers](https://discord.gg/gzemMfHURH) ~~If you wish to contact me for any reason, reach me out on Discord using my tag: `Forien#2130`~~

## Translations

- Japanese by touge
- German by brockhaus
- Portuguese by vithort

## Support

If you wish to support module development, please consider [becoming Patron](https://www.patreon.com/foundryworkshop) or donating [through Paypal](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=6P2RRX7HVEMV2&source=url). Thanks!

## License

Forien's Copy Environment is a module for Foundry VTT by Forien and is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

This work is licensed under Foundry Virtual Tabletop [EULA - Limited License Agreement for module development from May 29, 2020](https://foundryvtt.com/article/license/).
