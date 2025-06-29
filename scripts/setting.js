import {name as moduleName} from './config.js';

export default class Setting {
  /**
   * @param {Object} data - either World settings or Player settings
   */
  constructor(data) {
    this.type = Setting.UnknownType;
    this.data = data;
    this.value = undefined;

    if (!data || typeof data !== 'object') {
      console.error('Copy Environment | Unknown setting received:', data);
      return this;
    }

    if (data.key && data.value) {
      this.type = Setting.WorldType;
      this.value = new WorldSetting(this.data);
    } else if (data.name) {
      this.type = Setting.PlayerType;
      this.value = new PlayerSetting(this.data);
    } else if (data.type === Setting.SupportingDataType) {
      this.type = Setting.SupportingDataType;
      this.value = data.value;
    }
  }

  static UnknownType = '_unknownType';
  static PlayerType = '_playerType';
  static WorldType = '_worldType';
  static SupportingDataType = '_supportingDataType';

  isWorldSetting() {
    return this.type === Setting.WorldType;
  }

  isPlayerSetting() {
    return this.type === Setting.PlayerType;
  }

  isSupportingDataSetting() {
    return this.type === Setting.SupportingDataType;
  }

  hasChanges() {
    if (!this.value) {
      return false;
    }

    return this.value.hasChanges();
  }
}

/**
 * WorldSetting represents a world level setting.
 */
export class WorldSetting {
  /**
   * Create a world setting from Foundry data.
   * @param {Object} setting
   */
  constructor(setting) {
    if (!setting) {
      throw 'Invalid data';
    }

    this.key = setting.key;
    this.value = setting.value;
    this.difference = this.calculateDifference();
    this.group = this.key.split('.').shift();
  }

  hasChanges() {
    return this.difference.hasChanges();
  }

  /**
   * Compares the parsed JSON setting data if possible to handle object order differences.
   * @returns {Difference}
   */
  calculateDifference() {
    const keyParts = this.key.split('.');
    const namespace = keyParts.shift();
    const key = keyParts.join('.');
    let existingSetting;
    try {
      existingSetting = game.settings.get(namespace, key);
    } catch (e) {
      // do nothing, it just means the setting isn't registered, likely because the module isn't enabled.
    }
    try {
      let newValue = this.value;
      if (newValue) {
        newValue = JSON.parse(newValue);
      }
      if (typeof existingSetting === 'object' && typeof newValue === 'object') {
        let diff = foundry.utils.diffObject(existingSetting, newValue);
        if (typeof foundry.utils.isEmpty === 'function' ? foundry.utils.isEmpty(diff) : foundry.utils.isObjectEmpty(diff)) {
          // No difference in the underlying object.
          return new Difference(this.key, null, null);
        }
      }

      if (existingSetting === newValue) {
        return new Difference(this.key, null, null);
      }

      return new Difference(this.key, existingSetting, newValue);
    } catch (e) {
      console.error('Copy Environment | Could not parse world setting values:', this.key, e);
    }

    // Return the difference of the original values, not the parsed values.
    let existingSettings = game.data.settings.find((s) => s.key === this.key);
    return new Difference(this.key, existingSettings?.value, this.value);
  }
}

/**
 * PlayerSetting represents a player level setting.
 */
export class PlayerSetting {
  /**
   * Create a player setting from Foundry data.
   * @param {Object} setting
   */
  constructor(setting) {
    if (!setting) {
      throw 'Invalid data';
    }

    this.name = setting.name;
    this.playerNotFound = false;
    this.playerDifferences = {};
    this.playerFlagDifferences = {};

    const existingUser = game.users.getName(this.name);
    if (!existingUser) {
      this.playerNotFound = true;
      return this;
    }

    const userData = existingUser;

    if (setting.core.color !== userData.color) {
      this.playerDifferences.color = new Difference(
        'color',
        userData.color,
        setting.core.color
      );
    }

    if (setting.core.role !== userData.role) {
      this.playerDifferences.role = new Difference(
        'role',
        userData.role,
        setting.core.role
      );
    }

    if (JSON.stringify(setting.core.permissions) !== JSON.stringify(userData.permissions)) {
      this.playerDifferences.permissions = new Difference(
        'permissions',
        userData.permissions,
        this.data.core.permissions
      );
    }

    let flagDiff = foundry.utils.diffObject(userData.flags, setting.flags);
    for (const prop in flagDiff) {
      if (!flagDiff.hasOwnProperty(prop)) {
        continue;
      }
      this.playerFlagDifferences[prop] = new Difference(
        prop,
        userData.flags[prop],
        flagDiff[prop]
      );
    }

    this.name = setting.name;
    this.value = setting.value;
  }

  /**
   * Returns whether this player setting is identical to a player of the same name in the current world.
   * @returns boolean
   */
  hasChanges() {
    return this.playerNotFound || this.hasDataChanges();
  }

  /**
   * Returns whether this player setting has the same data values as a player of the same name in the current world.
   * Note that if there is not a matching player, there are no data changes.
   * @see hasChanges
   * @returns boolean
   */
  hasDataChanges() {
    if (typeof foundry.utils.isEmpty === 'function') {
      return !foundry.utils.isEmpty(this.playerDifferences) || !foundry.utils.isEmpty(this.playerFlagDifferences);
    }

    return (
      !foundry.utils.isObjectEmpty(this.playerDifferences) ||
      !foundry.utils.isObjectEmpty(this.playerFlagDifferences)
    );
  }
}

/**
 * Difference represents the difference between the existing setting and the proposed setting.
 */
export class Difference {
  /**
   * Create a setting difference.
   * @param {string} name
   * @param {*} oldValue
   * @param {*} newValue
   */
  constructor(name, oldValue, newValue) {
    this.name = name;
    if (oldValue !== newValue) {
      let diffSize = game.settings.get(moduleName, "diff-length");
      if (diffSize < 0) {
        diffSize = 0;
      }

      this.oldVal = oldValue;
      this.oldString = JSON.stringify(oldValue);
      if (diffSize && this.oldString?.length > diffSize) {
        this.oldString = this.oldString.substring(0, diffSize) + '...';
      }
      this.newVal = newValue;
      this.newString = JSON.stringify(newValue);
      if (diffSize && this.newString?.length > diffSize) {
        this.newString = this.newString.substring(0, diffSize) + '...';
      }
    }
  }

  hasChanges() {
    return this.oldVal !== this.newVal;
  }
}
