import { name, templates, log } from './config.js';
import Core from './core.js'

export default class CopyEnvironmentPlayerSettings extends FormApplication {
  constructor() {
    super();
    this.settings = [];
    this.notFound = [];
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['copy-environment-player-settings'],
      height: 'auto',
      width: 600,
      id: `${name}-player-settings`,
      title: `${name}.forms.player-settings.title`,
      template: templates.playerSettings,
      tabs: [{
        navSelector: '.tabs',
        contentSelector: 'form',
        initial: 'export',
      }]
    });
  }

  getData() {
    return {
      settings: this.settings,
      notFound: this.notFound,
      users: game.users,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('input[name=import-file]').on("change", this._processImportFile.bind(this));

    html.on('click', '.export-save-player', () => {
      CopyEnvironmentPlayerSettings.exportPlayers();
      this.close();
    });

    html.on('click', '.import-players', (e) => {
      for (let field of this.form.getElementsByTagName('fieldset')) {
        let targetUser = null;
        let changes = {
          flags: {}
        };
        for (let input of field.elements) {
          if (!input.checked) {
            continue;
          }

          let target = input.dataset?.for;
          if (!this.settings[target]) {
            log(false, 'Import player settings: could not find target for', input);
            continue;
          }

          let type = input.dataset?.type;
          if (!type) {
            log(false, 'Import player settings: missing type (core or flag)');
            continue;
          }

          if (!targetUser) {
            targetUser = game.users.getName(this.settings[target].existingUser.name);
          }

          if (type === 'core') {
            changes[input.name] = this.settings[target].core[input.name];
          }

          if (type === 'flag') {
            changes.flags[input.name] = this.settings[target].flags[input.name];
          }
        }

        if (Object.keys(changes).length === 1 && Object.keys(changes.flags).length === 0) {
          log(false, 'No changes selected for', targetUser?.name);
          continue;
        }

        log(false, `Updating ${targetUser?.name} with`, changes);
        targetUser.update(changes);

        ui.notifications.info("Updated player settings for: " + targetUser.name, {});
      }

      this.close();
    });
  }

  async _updateObject(event, formData) {
    log(false, event, formData);
  }

  async _processImportFile() {
    const file = this.form.elements['import-file'].files[0];
    if (!file) {
      log(false, 'Player setting import file not found.');
      return;
    }

    let app = this;

    readTextFromFile(file).then(async result => {
      const existingSettings = JSON.parse(result);
      log(false, 'settings', existingSettings)
      log(false, 'players', game.users);
      let settings = [];
      let notFound = [];
      for (let i = 0; i < existingSettings.length; i++) {
        const setting = existingSettings[i];
        const existingUser = game.users.getName(setting.name);
        if (!existingUser) {
          notFound.push(setting);
          continue;
        }
        setting.coreDiff = {};
        setting.flagDiff = {};

        if (setting.core?.color !== existingUser.data.color) {
          setting.coreDiff.color = {
            name: 'color',
            oldVal: existingUser.data.color,
            oldString: JSON.stringify(existingUser.data.color),
            newVal: setting.core.color,
            newString: JSON.stringify(setting.core.color)
          };
        }

        if (setting.core?.role !== existingUser.data.role) {
          setting.coreDiff.role = {
            name: 'role',
            oldVal: existingUser.data.role,
            oldString: JSON.stringify(existingUser.data.role),
            newVal: setting.core.role,
            newString: JSON.stringify(setting.core.role)
          };
        }

        setting.existingUser = existingUser;
        let flagDiff = diffObject(existingUser.data.flags, setting.flags);

        for (const prop in flagDiff) {
          if (!flagDiff.hasOwnProperty(prop)) {
            continue;
          }
          setting.flagDiff[prop] = {
            name: prop,
            oldVal: existingUser.data.flags[prop],
            oldString: JSON.stringify(existingUser.data.flags[prop]),
            newVal: flagDiff[prop],
            newString: JSON.stringify(flagDiff[prop])
          };
        }

        if (Object.keys(setting.coreDiff).length === 0 && Object.keys(setting.flagDiff).length === 0) {
          // No change.
          continue;
        }

        settings.push(setting);
      }

      app.settings = settings;
      app.notFound = notFound;
      app.render(false);
    });
  }

  static exportPlayers() {
    let data = game.users.map(u => ({
      name: u.data.name,
      core: {
        avatar: u.data.avatar,
        color: u.data.color,
        permissions: u.data.permissions,
        role: u.data.role
      },
      flags: u.data.flags
    }));
    Core.download(data, 'foundry-player-settings-export.json');
  }
}
