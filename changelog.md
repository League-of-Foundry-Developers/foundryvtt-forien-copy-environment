# Changelog

## v2.1.7

- Mark compatible with v11.
- Append world name to the generated settings file on export.
- Added Portuguese by vithort

## v2.1.6

- Exclude invalid settings from export [#35](https://github.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/issues/35)

## v2.1.5

- Allow non-GM users to use the module.
  - Fixes [#32](https://github.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/issues/32)
  - Users will see errors for any settings they do not have permission to update.
- Removed deprecated fields in module manifest.
  - Fixes [#33](https://github.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/issues/33)

## v2.1.4

- Added timestamp to file export.
  - As requested in [#30](https://github.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/issues/30)
- Re-added "Save as JSON" which was removed in v2.1.2 as requested in [#29](https://github.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/issues/29)
  - Have renamed this to `Copy as JSON` to help differentiate it from the `Export Settings` option.

## v2.1.3

- Fixed issue where having a player other than GM in the world would prevent the importer from correctly importing anything.

## v2.1.2

* Better handling of config options to make it less likely to break on certain module's configuration settings.
* Added more logging to assist with any future issues.
* Adjust process order to make sure that the server has time to process the updates before the client reloads.
* Removed the `Save as JSON` context menu option as it was rarely the desired action and was confusing (it was not the version that allowed the user to import the settings).

### v2.1.1

* Fixed settings stored in an object not being compared correctly.
  * Importantly, this makes the "Enabled Modules" setting to be correctly saved and imported.

### v2.1.0

* Added compatibility with Foundry VTT v10
* Sorted the settings in the import dialog to make them easier to find.
* Client settings are now correctly exported and imported.
  * Request: [#10](https://github.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/issues/10)
* Grouped the settings by their module and collapsed them by default.
  * Request: [#13](https://github.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/issues/13)
* Selecting (or unselecting) a setting will now remember that state across imports, saving you time from choosing just the selections you want.
  * Request: [#18](https://github.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment/issues/18)

### v2.0.7

* Added German translation thanks to brockhaus
* Added Foundry VTT Core v9 compatibility

### v2.0.6

* Added Japanese translation thanks to touge

### v2.0.5

* Fix client side settings not importing in v0.8.x

### v2.0.4

* Allow module developers to opt out of settings being copied.
* Re-added bug reporter compatibility since 0.8.2.

### v2.0.3

* Added 0.8.4 compatibility

### v2.0.2

* Tested 0.8.1 compatibility

### v2.0.1

* Merged world and player settings into a single json to simplify use.
* Added differential style selection for world settings import.
* Finished adding localization support.

### v2.0.0

* Migrated to [League of Foundry Developers](https://discord.gg/gzemMfHURH) stewardship
* Added Settings configuration in addition to the right-click context menu
* Added export/import of player settings including differential based selection
* Tested and bumped compatible core version to 0.8.0

### v1.1.1

* Added 0.6.6 compatibility 

## v1.1.0
* Added manifest URL link to JSON environment structure
* Added options to export and import game settings. Non-GM users can only import client-side settings.
* Tested and bumped compatible core version to 0.7.1

### v1.0.1
* Initial release
