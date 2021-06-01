import {name, templates, log} from './config.js';
import Setting from './setting.js';

export default class Core extends FormApplication {
  /**
   * @param {Array.<Object>} settings Read from previously exported settings
   */
  constructor(settings) {
    super();
    this.settings = [];
    this.hasWorldSettings = false;
    this.playerSettings = [];
    this.hasPlayerSettings = false;
    this.notChangedSettings = [];
    this.notChangedPlayers = [];
    this.notFoundPlayers = [];

    if (settings && Array.isArray(settings)) {
      log(false, 'Parsing provided settings', settings);

      settings.forEach((data) => {
        try {
          let setting = new Setting(data);
          if (setting) {
            switch (setting.type) {
              case Setting.WorldType:
                if (setting.hasChanges()) {
                  this.settings.push(setting.value);
                  this.hasWorldSettings = true;
                } else {
                  this.notChangedSettings.push(setting.data.key);
                }
                break;
              case Setting.PlayerType:
                if (!setting.hasChanges()) {
                  this.notChangedPlayers.push(setting.data.name);
                  break;
                }
                if (setting.value.playerNotFound) {
                  this.notFoundPlayers.push(setting.value);
                  break;
                }
                this.playerSettings.push(setting.value);
                this.hasPlayerSettings = true;
            }
          }
        } catch (e) {
          log(false, 'Error importing setting:', e, data);
        }
      });
    }

    log(false, 'Processing world settings', this.settings);
    log(false, 'Processing player settings', this.playerSettings);
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['copy-environment-settings'],
      height: 'auto',
      width: Math.ceil(window.innerWidth / 2),
      id: `${name}-settings`,
      title: `${name}.title`,
      template: templates.settings,
    });
  }

  getData() {
    return {
      settings: this.settings,
      playerSettings: this.playerSettings,
      hasWorldSettings: this.hasWorldSettings,
      hasPlayerSettings: this.hasPlayerSettings,
      hasChanges: this.hasWorldSettings || this.hasPlayerSettings,
      notChangedSettings: this.notChangedSettings,
      notChangedPlayers: this.notChangedPlayers,
      notFoundPlayers: this.notFoundPlayers,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.on('click', '.close', () => {
      this.close();
    });

    html.on('change', '.toggle-selections', (el) => {
      $(el.target.closest('fieldset'))
        .find('td input')
        .prop('checked', el.target.checked);
    });

    html.on('click', '.import', () => {
      for (let field of this.form.getElementsByTagName('fieldset')) {
        let targetType = field.dataset?.type;
        if (!targetType) {
          log(false, 'Could not find fieldset target type');
          continue;
        }

        switch (targetType) {
          case 'world':
            this.importWorldSettings(field);
            break;
          case 'player':
            this.importPlayerSettings(field);
            break;
        }
      }

      this.close();
    });
  }

  importWorldSettings(fieldset) {
    let changes = [];
    for (let input of fieldset.elements) {
      if (!input.checked || !input.name) {
        continue;
      }

      let target = input.dataset?.for;
      if (!this.settings[target]) {
        log(false, 'Import world settings: could not find target for', input);
        continue;
      }

      log(false, 'Importing world setting', this.settings[target]);
      changes.push(this.settings[target]);
    }
    if (changes.length) {
      Core.processSettings(changes).then(() => {
        ui.notifications.info(
          game.i18n.localize('forien-copy-environment.updatedReloading'),
          {},
        );
        window.setTimeout(window.location.reload.bind(window.location), 5000);
      });
    }
  }

  importPlayerSettings(fieldset) {
    let targetUser = null;
    let changes = {
      flags: {},
    };
    for (let input of fieldset.elements) {
      if (!input.checked || !input.name) {
        continue;
      }

      let target = input.dataset?.for;
      if (!this.playerSettings[target]) {
        log(false, 'Import player settings: could not find target for', input);
        continue;
      }

      let type = input.dataset?.type;
      if (!type) {
        log(false, 'Import player settings: missing type (core or flag)');
        continue;
      }

      if (!targetUser) {
        targetUser = game.users.getName(this.playerSettings[target].name);
      }

      if (type === 'core') {
        changes[input.name] = this.playerSettings[target].playerDifferences[input.name].newVal;
      }

      if (type === 'flag') {
        changes.flags[input.name] = this.playerSettings[target].playerFlagDifferences[input.name].newVal;
      }
    }

    if (!targetUser) {
      log(false, 'No targetUser found.');
      return;
    }

    if (Object.keys(changes).length === 1 && isObjectEmpty(changes.flags)) {
      log(false, 'No changes selected for', targetUser?.name);
      return;
    }

    log(false, `Updating ${targetUser.name} with`, changes);
    targetUser.update(changes);

    ui.notifications.info(
      game.i18n.format('forien-copy-environment.import.updatedPlayer', {
        name: targetUser.name,
      }),
      {},
    );
  }

  static download(data, filename) {
    if (!filename) {
      log(false, 'Missing filename on download request');
      return;
    }

    let jsonStr = JSON.stringify(data, null, 2);

    saveDataToFile(jsonStr, 'application/json', filename);
  }

  static data() {
    let modules = game.data.modules.filter((m) => m.active);
    let system = game.data.system;
    let core = game.data.version;

    let message = game.i18n.localize('forien-copy-environment.message');

    return {
      message,
      core,
      system,
      modules,
    };
  }

  static getText() {
    let data = this.data();
    let text = `Core Version: ${data.core}\n\n`;

    text += `System: ${data.system.id} ${data.system.data.version} (${data.system.data.author}) \n\n`;

    text += `Modules: \n`;
    data.modules.forEach((m) => {
      text += `${m.id} ${m.data.version} (${m.data.author})\n`;
    });

    text += `\n${data.message}`;

    log(false, text);

    return text;
  }

  static copyAsText() {
    let text = this.getText();

    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    ui.notifications.info(
      game.i18n.localize('forien-copy-environment.copiedToClipboard'),
      {},
    );
  }

  static saveSummaryAsJSON() {
    let data = this.data();

    data.core = {
      version: data.core,
    };
    data.system = {
      id: data.system.id,
      version: data.system.data.version,
      author: data.system.data.author,
      manifest: data.system.data.manifest,
    };
    data.modules = data.modules.map((m) => {
      return {
        id: m.id,
        version: m.data.version,
        author: m.data.author,
        manifest: m.data.manifest,
      };
    });

    this.download(data, 'foundry-environment.json');
  }

  static exportGameSettings() {
    // Return an array with both the world settings and player settings together.
    let data = Array.prototype.concat(
      game.data.settings.map((s) => ({
        key: s.key,
        value: s.value,
      })),
      game.users.map((u) => ({
        name: u.data.name,
        core: {
          avatar: u.data.avatar,
          color: u.data.color,
          permissions: u.data.permissions,
          role: u.data.role,
        },
        flags: u.data.flags,
      })),
    );
    this.download(data, 'foundry-settings-export.json');
  }

  static importGameSettingsQuick() {
    const input = $('<input type="file">');
    input.on('change', this.importGameSettings);
    input.trigger('click');
  }

  static importGameSettings() {
    const file = this.files[0];
    if (!file) {
      log(false, 'No file provided for game settings importer.');
      return;
    }

    readTextFromFile(file).then(async (result) => {
      try {
        const settings = JSON.parse(result);
        let coreSettings = new Core(settings);
        coreSettings.render(true);
      } catch (e) {
        log(false, 'Could not parse import data.');
      }
    });
  }

  static async processSettings(settings) {
    if (isNewerVersion(game.data.version, '0.7.9')) {
      const updates = [];
      const creates = [];
      settings.forEach(data => {
        const config = game.settings.settings.get(data.key);
        if (config?.scope === 'client') {
          const storage = game.settings.storage.get(config.scope);
          if (storage) {
            storage.setItem(setting.key, setting.value);
          }
        } else if (game.user.isGM) {
          const existing = game.data.settings.find((s) => s.key === data.key);
          if (existing?._id) {
            data._id = existing._id;
            updates.push(data);
          } else {
            creates.push(data);
          }
        }
      });
      try {
        if (updates.length) {
          await SocketInterface.dispatch('modifyDocument', {
            type: 'Setting',
            action: 'update',
            updates: updates,
          });
        }
        if (creates.length) {
          await SocketInterface.dispatch('modifyDocument', {
            type: 'Setting',
            action: 'create',
            data: creates,
          });
        }
      } catch (e) {
        log(
          false,
          `Settings update could not be dispatched to server.`,
        );
        console.error(e);
      }
      return;
    }
    for (const setting of settings) {
      const config = game.settings.settings.get(setting.key);
      if (config?.scope === 'client') {
        const storage = game.settings.storage.get(config.scope);
        storage.setItem(setting.key, setting.value);
      } else if (game.user.isGM) {
        try {
          await SocketInterface.dispatch('modifyDocument', {
            type: 'Setting',
            action: 'update',
            data: setting,
          });
        } catch (e) {
          log(
            false,
            `Setting key ${setting.key} could not be dispatched to server.`,
          );
          console.error(e);
        }
      }
    }
  }
}
