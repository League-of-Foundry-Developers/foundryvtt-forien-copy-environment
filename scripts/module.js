import { name } from './config.js';
import Core from './core.js'
import CopyEnvironmentPlayerSettings from './player-settings.js';

Hooks.once('init', async function () {

});

Hooks.once('ready', async function () {
  game.settings.registerMenu(name, 'world-settings', {
    name: `${name}.settings.world.Name`,
    label: `${name}.settings.world.Label`,
    icon: 'fas fa-cogs',
    type: Core,
    restricted: true,
    hint: `${name}.settings.world.Hint`,
  });
  game.settings.registerMenu(name, 'player-settings', {
    name: `${name}.settings.player-settings.Name`,
    label: `${name}.settings.player-settings.Label`,
    icon: 'fas fa-cogs',
    type: CopyEnvironmentPlayerSettings,
    restricted: true,
    hint: `${name}.settings.player-settings.Hint`,
  });
});

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(name);
});

Hooks.on("renderSettings", function (app, html, data) {
  if (game.user.isGM) {
    new ContextMenu(html, "div.game-system, ul#game-details", [{
        name: "Copy as text",
        icon: '<i class="far fa-copy"></i>',
        callback: () => {
          Core.copyAsText();
        }
      },
      {
        name: "Save as JSON",
        icon: '<i class="fas fa-paste"></i>',
        callback: () => {
          Core.saveSummaryAsJSON();
        }
      },
      {
        name: "Export Settings",
        icon: '<i class="fas fa-file-export"></i>',
        callback: li => {
          Core.exportGameSettings();
        }
      },
      {
        name: "Import Settings",
        icon: '<i class="fas fa-file-import"></i>',
        callback: li => {
          Core.importGameSettingsQuick();
        }
      },
      {
        name: "More options under Module Settings",
        icon: '<i class="far fa-user"></i>',
        callback: li => {
          new SettingsConfig().render(true);
        }
      }
    ]);
  }
});
