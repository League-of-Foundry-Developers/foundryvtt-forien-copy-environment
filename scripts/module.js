import {name} from './config.js';
import Core from './core.js';

Hooks.once('init', function () {
  game.settings.register(name, 'selected-properties', {
    scope: 'client',
    config: false,
    type: Object,
    default: {
      'core.time': false,
      'pf2e.worldClock.worldCreatedOn': false,
    },
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

  game.settings.register(name, 'include-defaults', {
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    name: "forien-copy-environment.settings.include-defaults",
    hint: "forien-copy-environment.settings.include-defaults-hint",
    requiresReload: false,
  });

  // Visible Export/Import buttons in the module's section of the Game
  // Settings window, mirroring the sidebar context menu actions, which are
  // hard to discover and unusable without a right-click.
  const actionMenu = (action) => class extends foundry.applications.api.ApplicationV2 {
    async render() {
      action();
      return this;
    }
  };

  game.settings.registerMenu(name, 'export', {
    name: 'forien-copy-environment.menu.export',
    label: 'forien-copy-environment.menu.export',
    hint: 'forien-copy-environment.menu.export-hint',
    icon: 'fas fa-file-export',
    type: actionMenu(() => Core.exportGameSettings()),
    restricted: false,
  });

  game.settings.registerMenu(name, 'import', {
    name: 'forien-copy-environment.menu.import',
    label: 'forien-copy-environment.menu.import',
    hint: 'forien-copy-environment.menu.import-hint',
    icon: 'fas fa-file-import',
    type: actionMenu(() => Core.importGameSettingsQuick()),
    restricted: false,
  });
});

Hooks.once('devModeReady', ({registerPackageDebugFlag}) => {
  registerPackageDebugFlag(name);
});

Hooks.on('renderSettings', function (app, html, data) {
  new foundry.applications.ux.ContextMenu.implementation(html, '#settings section.info', [
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
  ], {jQuery: false});
});
