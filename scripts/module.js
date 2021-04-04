import {name} from './config.js';
import Core from './core.js';

Hooks.once('devModeReady', ({registerPackageDebugFlag}) => {
  registerPackageDebugFlag(name);
});

Hooks.on('renderSettings', function (app, html, data) {
  if (game.user.isGM) {
    new ContextMenu(html, 'div.game-system, ul#game-details', [
      {
        name: game.i18n.localize('forien-copy-environment.menu.copy'),
        icon: '<i class="far fa-copy"></i>',
        callback: () => {
          Core.copyAsText();
        },
      },
      {
        name: game.i18n.localize('forien-copy-environment.menu.save'),
        icon: '<i class="fas fa-paste"></i>',
        callback: () => {
          Core.saveSummaryAsJSON();
        },
      },
      {
        name: game.i18n.localize('forien-copy-environment.menu.export'),
        icon: '<i class="fas fa-file-export"></i>',
        callback: () => {
          Core.exportGameSettings();
        },
      },
      {
        name: game.i18n.localize('forien-copy-environment.menu.import'),
        icon: '<i class="fas fa-file-import"></i>',
        callback: () => {
          Core.importGameSettingsQuick();
        },
      },
    ]);
  }
});
