import {name} from './config.js';
import Core from './core.js';

Hooks.once('init', function () {
  game.settings.register(name, 'selected-properties', {
    scope: 'client',
    config: false,
    type: Object,
    default: {},
  });

  game.settings.register(name, 'diff-length', {
    scope: 'world',
    config: true,
    type: Number,
    default: 500,
    name: "forien-copy-environment.settings.max-diff",
    hint: "forien-copy-environment.settings.max-diff-hint",
    requiresReload: false,
  });
});

Hooks.once('devModeReady', ({registerPackageDebugFlag}) => {
  registerPackageDebugFlag(name);
});

Hooks.on('renderSettings', function (app, html, data) {
  new ContextMenu(html, 'div.game-system, ul#game-details', [
    {
      name: game.i18n.localize('forien-copy-environment.menu.copy'),
      icon: '<i class="far fa-copy"></i>',
      callback: () => {
        try {
          Core.copyAsText();
        } catch (e) {
          console.error('Copy Environment | Error copying game settings to clipboard', e);
        }
      },
    },
    {
      name: game.i18n.localize('forien-copy-environment.menu.save'),
      icon: '<i class="fas fa-copy"></i>',
      callback: () => {
        try {
          Core.saveSummaryAsJSON();
        } catch (e) {
          console.error('Copy Environment | Error copying game settings to JSON', e);
        }
      },
    },
    {
      name: game.i18n.localize('forien-copy-environment.menu.export'),
      icon: '<i class="fas fa-file-export"></i>',
      callback: () => {
        try {
          Core.exportGameSettings();
        } catch (e) {
          console.error('Copy Environment | Error exporting game settings', e);
        }
      },
    },
    {
      name: game.i18n.localize('forien-copy-environment.menu.import'),
      icon: '<i class="fas fa-file-import"></i>',
      callback: () => {
        try {
          Core.importGameSettingsQuick();
        } catch (e) {
          console.error('Copy Environment | Error importing game settings', e);
        }
      },
    },
  ]);
});
