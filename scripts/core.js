import {name, isV10orNewer, templates, log} from './config.js';
import Setting from './setting.js';

export default class Core extends FormApplication {
  /**
   * @param {Array.<Object>} settings Read from previously exported settings
   */
  constructor(settings) {
    super();
    this.settingGroups = new Map();
    this.settings = [];
    this.hasWorldSettings = false;
    this.playerSettings = [];
    this.hasPlayerSettings = false;
    this.notChangedSettings = [];
    this.notChangedPlayers = [];
    this.notFoundPlayers = [];
    this.selectedProperties = game.settings.get(name, 'selected-properties') || {};

    if (settings && Array.isArray(settings)) {
      log(false, 'Parsing provided settings', settings);

      settings.forEach((data) => {
        try {
          let setting = new Setting(data);
          if (setting) {
            switch (setting.type) {
              case Setting.WorldType:
                if (setting.hasChanges()) {
                  if (!this.settingGroups.has(setting.value.group)) {
                    this.settingGroups.set(setting.value.group, []);
                  }
                  this.settingGroups.get(setting.value.group).push(setting.value);
                  if (typeof this.selectedProperties[setting.value.key] === 'undefined') {
                    this.selectedProperties[setting.value.key] = true;
                  }
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
                for (const [key, val] of Object.entries(setting.value.playerDifferences)) {
                  const combinedKey = `${setting.value.name}--${key}`;
                  if (typeof this.selectedProperties[combinedKey] === 'undefined') {
                    this.selectedProperties[combinedKey] = true;
                  }
                }
                for (const [key, val] of Object.entries(setting.value.playerFlagDifferences)) {
                  const combinedKey = `${setting.value.name}--flag--${key}`;
                  if (typeof this.selectedProperties[combinedKey] === 'undefined') {
                    this.selectedProperties[combinedKey] = true;
                  }
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

    this.settings = Object.entries(Object.fromEntries(this.settingGroups));
    this.settings.sort((a, b) => a[0].localeCompare(b[0]));
    this.playerSettings.sort((a, b) => a.key.localeCompare(b.key));

    log(true, 'Processing world settings', this.settings);
    log(true, 'Processing player settings', this.playerSettings);
    log(true, 'Selected Properties', this.selectedProperties);
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
      selectedProperties: this.selectedProperties,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const updateCheckboxStates = (el) => {
      let overall = $(el.closest('tbody')).find('input[type=checkbox].toggle-selections')[0];
      if ($(el).data()?.type === 'core' || $(el).data()?.type === 'flag') {
        overall = $(el.closest('fieldset')).find('input[type=checkbox].toggle-selections')[0];
      }

      if (!overall) {
        return;
      }

      const options = $(el.closest('tbody')).find(
        'input[type=checkbox]:not(.toggle-selections)'
      );

      var checkedCount = 0;
      for (var i = 0; i < options.length; i++) {
        if (options[i].checked) {
          checkedCount++;
        }
      }

      if (checkedCount === 0) {
        overall.checked = false;
        overall.indeterminate = false;
      } else if (checkedCount === options.length) {
        overall.checked = true;
        overall.indeterminate = false;
      } else {
        overall.checked = false;
        overall.indeterminate = true;
      }
    };

    html.on('click', '.close', () => {
      this.close();
    });

    html.on('change', '.toggle-all-selections', (el) => {
      $(el.target.closest('fieldset'))
        .find('td input')
        .not(el.target)
        .prop('checked', el.target.checked)
        .change();
    });

    html.on('change', '.toggle-selections', (el) => {
      $(el.target.closest('tbody'))
        .find('td input')
        .not(el.target)
        .prop('checked', el.target.checked)
        .change();
    });

    html.on('click', '.show-settings', (el) => {
      $(el.target.closest('tbody'))
        .find('tr')
        .not(el.target.closest('tr'))
        .toggleClass('none');
    });

    html.on('change', 'input[type=checkbox]', (el) => {
      if (!el.target.name) {
        return;
      }

      console.log(`Setting ${el.target.name} to ${el.target.checked}`);
      const selectedProperties = game.settings.get(name, 'selected-properties');
      selectedProperties[el.target.name] = el.target.checked;
      game.settings.set(name, 'selected-properties', selectedProperties);

      updateCheckboxStates(el.target);
    });

    html.on('click', '.import', async () => {
      for (let field of this.form.getElementsByTagName('fieldset')) {
        let targetType = field.dataset?.type;
        if (!targetType) {
          log(false, 'Could not find fieldset target type');
          continue;
        }

        switch (targetType) {
          case 'world':
            await this.importWorldSettings(field);
            break;
          case 'player':
            await this.importPlayerSettings(field);
            break;
        }
      }

      this.close();
    });

    html.find('tbody').each((i, el) => {
      updateCheckboxStates($(el).find('input[type=checkbox]:first'));
    });
  }

  async importWorldSettings(fieldset) {
    let changes = [];
    for (let input of fieldset.elements) {
      if (!input.checked || !input.name) {
        continue;
      }

      const target = input.dataset?.for;
      if (!target) {
        continue;
      }

      const [group, val] = target.split('--');
      if (!this.settings[group] || !this.settings[group][1] || !this.settings[group][1][val]) {
        log(false, 'Import world settings: could not find target for', input);
        continue;
      }

      log(false, 'Importing world setting', this.settings[group][1][val]);
      changes.push(this.settings[group][1][val]);
    }
    if (changes.length) {
      if (await Core.processSettings(changes)) {
        ui.notifications.info(game.i18n.localize('forien-copy-environment.updatedReloading'));
        window.setTimeout(window.location.reload.bind(window.location), 5000);
      }
    }
  }

  async importPlayerSettings(fieldset) {
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
        log(true, 'Import player settings: could not find target for', input);
        continue;
      }

      let type = input.dataset?.type;
      if (!type) {
        log(true, 'Import player settings: missing type (core or flag)');
        continue;
      }

      if (!targetUser) {
        targetUser = game.users.getName(this.playerSettings[target].name);
      }

      const fieldName = input.name.split('--').pop();
      if (!type) {
        log(true, 'Import player settings: missing value for', input.name);
        continue;
      }

      if (type === 'core') {
        changes[fieldName] =
          this.playerSettings[target].playerDifferences[fieldName].newVal;
      }

      if (type === 'flag') {
        changes.flags[fieldName] =
          this.playerSettings[target].playerFlagDifferences[fieldName].newVal;
      }
    }

    if (!targetUser) {
      log(true, 'No targetUser found.');
      return;
    }

    if (Object.keys(changes).length === 1 && isObjectEmpty(changes.flags)) {
      log(true, 'No changes selected for', targetUser?.name);
      return;
    }

    log(true, `Updating ${targetUser.name} with`, changes);
    await targetUser.update(changes);

    ui.notifications.info(
      game.i18n.format('forien-copy-environment.import.updatedPlayer', {
        name: targetUser.name,
      })
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
    let core = game.version || game.data.version;

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
    const excludeModules = game.data.modules.filter((m) => m.data?.flags?.noCopyEnvironmentSettings).map((m) => m.id) || [];

    // Return an array with both the world settings and player settings together.
    let data = Array.prototype.concat(
      Array.from(game.settings.settings)
        .filter(([k, v]) => {
          const value = game.settings.get(v.namespace, v.key);
          let sameValue = value === v.default;
          if (typeof value === 'object' && typeof v.default === 'object') {
            sameValue = !Object.keys(diffObject(value, v.default)).length;
          }
          return !excludeModules.some((e) => v.namespace === e) && !sameValue;
        })
        .map(([k, v]) => ({
          key: k,
          value: JSON.stringify(game.settings.get(v.namespace, v.key)),
        }))
        .sort((a, b) => a.key.localeCompare(b.key)),
      game.users.map((u) => {
        const userData = isV10orNewer() ? u : u.data;
        return {
          name: userData.name,
          core: {
            avatar: userData.avatar,
            color: userData.color,
            permissions: userData.permissions,
            role: userData.role,
          },
          flags: userData.flags,
        };
    }),
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
    if (isNewerVersion((game.version || game.data.version), '0.7.9')) {
      const updates = [];
      const creates = [];
      settings.forEach(data => {
        const config = game.settings.settings.get(data.key);
        if (config?.scope === 'client') {
          const storage = game.settings.storage.get(config.scope);
          if (storage) {
            storage.setItem(data.key, data.value);
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
        return true;
      } catch (e) {
        log(true, `Settings update could not be dispatched to server.`);
        console.error(e);
      }
      return false;
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
          return true;
        } catch (e) {
          log(true, `Setting key ${setting.key} could not be dispatched to server.`);
          console.error(e);
        }
        return false;
      }
    }
  }
}
