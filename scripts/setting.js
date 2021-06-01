import {log} from './config.js';

export default class Setting {
  /**
   * @param {Object} data - either World settings or Player settings
   */
  constructor(data) {
    this.type = Setting.UnknownType;
    this.data = data;
    this.value = undefined;

    if (!data || typeof data !== 'object') {
      log(false, 'Unknown setting received:', data);
      return this;
    }

    if (data.key && data.value) {
      this.type = Setting.WorldType;
      this.value = new WorldSetting(this.data);
    } else if (data.name) {
      this.type = Setting.PlayerType;
      this.value = new PlayerSetting(this.data);
    }
  }

  static UnknownType = '_unknownType';
  static PlayerType = '_playerType';
  static WorldType = '_worldType';

  isWorldSetting() {
    return this.type === Setting.WorldType;
  }

  isPlayerSetting() {
    return this.type === Setting.PlayerType;
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
  }

  hasChanges() {
    return this.difference.hasChanges();
  }

  /**
   * Compares the parsed JSON setting data if possible to handle object order differences.
   * @returns {Difference}
   */
  calculateDifference() {
    let existingSettings = game.data.settings.find((s) => s.key === this.key);
    try {
      // World settings are stored as JSON strings, try to determine if they are
      // objects that can be compared, rather than string representations.
      let existingValue = existingSettings?.value;
      if (existingValue) {
        existingValue = JSON.parse(existingValue);
      }
      let newValue = this.value;
      if (newValue) {
        newValue = JSON.parse(newValue);
      }
      if (typeof existingValue === 'object' && typeof newValue === 'object') {
        let diff = diffObject(existingValue, newValue);
        if (isObjectEmpty(diff)) {
          // No difference in the underlying object.
          return new Difference(this.key, null, null);
        }
      }
    } catch (e) {
      log(false, 'Could not parse world setting values:', e, this.key);
    }

    // Return the difference of the original values, not the parsed values.
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

    if (setting.core.color !== existingUser.data.color) {
      this.playerDifferences.color = new Difference(
        'color',
        existingUser.data.color,
        setting.core.color
      );
    }

    if (setting.core.role !== existingUser.data.role) {
      this.playerDifferences.role = new Difference(
        'role',
        existingUser.data.role,
        setting.core.role
      );
    }

    if (
      JSON.stringify(setting.core.permissions) !==
      JSON.stringify(existingUser.data.permissions)
    ) {
      this.playerDifferences.permissions = new Difference(
        'permissions',
        existingUser.data.permissions,
        this.data.core.permissions
      );
    }

    let flagDiff = diffObject(existingUser.data.flags, setting.flags);
    for (const prop in flagDiff) {
      if (!flagDiff.hasOwnProperty(prop)) {
        continue;
      }
      this.playerFlagDifferences[prop] = new Difference(
        prop,
        existingUser.data.flags[prop],
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
    return (
      !isObjectEmpty(this.playerDifferences) ||
      !isObjectEmpty(this.playerFlagDifferences)
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
      this.oldVal = oldValue;
      this.oldString = JSON.stringify(oldValue);
      this.newVal = newValue;
      this.newString = JSON.stringify(newValue);
    }
  }

  hasChanges() {
    return this.oldVal !== this.newVal;
  }
}
