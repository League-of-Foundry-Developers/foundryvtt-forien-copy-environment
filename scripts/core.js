import {
  name,
  templates,
  log
} from './config.js'

export default class Core extends FormApplication {

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['copy-environment-world-settings'],
      height: 'auto',
      width: 600,
      id: `${name}-world-settings`,
      title: `${name}.forms.world.title`,
      template: templates.worldSettings,
      tabs: [{
        navSelector: '.tabs',
        contentSelector: 'form',
        initial: 'settings',
      }]
    });
  }

  getData() {
    return {};
  }


  activateListeners(html) {
    super.activateListeners(html);

    html.on('click', '.export-save-world-env', () => {
      Core.saveSummaryAsJSON();
      this.close();
    });

    html.on('click', '.export-copy-world-env', () => {
      Core.copyAsText();
      this.close();
    });

    html.on('click', '.export-save-world-settings', () => {
      Core.exportGameSettings();
      this.close();
    });

    html.on('change', '.import-world-settings', (el) => {
      Core.importGameSettings(el.target);
      this.close();
    });
  }

  static download(data, filename) {
    if (!filename) {
      log(false, 'Missing filename on download request');
      return;
    }

    let jsonStr = JSON.stringify(data, null, 2);

    saveDataToFile(jsonStr, 'application/json', filename);
  }

  static getData() {
    let modules = game.data.modules.filter(m => m.active);
    let system = game.data.system;
    let core = game.data.version;

    let message = "List generated with Forien's Copy Environment: https://github.com/League-of-Foundry-Developers/foundryvtt-forien-copy-environment";

    return {
      message,
      core,
      system,
      modules
    };
  }

  static getText() {
    let data = this.getData();
    let text = `Core Version: ${data.core}\n\n`;

    text += `System: ${data.system.id} ${data.system.data.version} (${data.system.data.author}) \n\n`;

    text += `Modules: \n`;
    data.modules.forEach(m => {
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

    ui.notifications.info("Environment data copied to clipboard!", {});
  }

  static saveSummaryAsJSON() {
    let data = this.getData();

    data.core = {
      version: data.core
    };
    data.system = {
      id: data.system.id,
      version: data.system.data.version,
      author: data.system.data.author,
      manifest: data.system.data.manifest
    };
    data.modules = data.modules.map(m => {
      return {
        id: m.id,
        version: m.data.version,
        author: m.data.author,
        manifest: m.data.manifest
      }
    });

    this.download(data, 'foundry-environment.json');
  }

  static exportGameSettings() {
    let data = game.data.settings.map(s => ({
      key: s.key,
      value: s.value
    }));
    this.download(data, 'foundry-settings-export.json');
  }

  static importGameSettingsQuick() {
    const input = $('<input type="file">');
    input.on("change", () => Core.importGameSettings(input.get(0)));
    input.trigger('click');
  }

  static importGameSettings(el) {
    const file = el?.files[0];
    if (!file) {
      log(false, 'No file provided for game settings importer.');
      return;
    }

    readTextFromFile(file).then(async result => {
      const settings = JSON.parse(result);
      log(false, 'import settings', settings);
      for (const setting of settings) {
        await Core.processSetting(setting);
      }

      ui.notifications.info("Updated world settings. Reloading world in 5sec...", {});
      window.setTimeout(window.location.reload.bind(window.location), 5000);
    });
  }

  static async processSetting(setting) {
    const config = game.settings.settings.get(setting.key);
    if (config?.scope === "client") {
      const storage = game.settings.storage.get(config.scope);
      storage.setItem(setting.key, setting.value);
    } else if (game.user.isGM) {
      try {
        await SocketInterface.dispatch("modifyDocument", {
          type: "Setting",
          action: "update",
          data: setting
        });
      } catch (e) {
        log(false, `Setting key ${setting.key} could not be dispatched to server.`);
        console.error(e);
      }
    }
  }
}
