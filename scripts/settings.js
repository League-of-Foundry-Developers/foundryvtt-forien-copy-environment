import {
  log
} from './config.js';

export default class Settings {
  /**
   * 
   * @param {Object} data - either World settings or Player settings
   */
  constructor(data) {
    this.type = Settings.UnknownType;
    this.data = data;
    this.value = undefined;

    if (!data || typeof data !== 'object') {
      log(false, 'Unknown setting received:', data);
      return this;
    }

    if (data.key && data.value) {
      this.type = Settings.WorldType;
      this.value = new WorldSetting(this.data);
    } else if (data.name) {
      this.type = Settings.PlayerType;
      this.value = new PlayerSetting(this.data);
    }
  }

  static UnknownType = '_unknownType';
  static PlayerType = '_playerType';
  static WorldType = '_worldType';

  isWorldSetting() {
    return this.type === Settings.WorldType;
  }

  isPlayerSetting() {
    return this.type === Settings.PlayerType;
  }

  hasChanges() {
    switch (this.type) {
      case Settings.WorldType:
        return Object.keys(this.worldDifferences).length !== 0;
      case Settings.PlayerType:
        return Object.keys(this.playerDifferences).length !== 0 || Object.keys(this.playerFlagDifferences).length !== 0;
      default:
        return false;
    }
  }

  parsePlayerSetting() {
    if (!this.data) {
      log(false, 'Warning, tried to parse data that is not set.');
      return;
    }

    const existingUser = game.users.getName(this.data.name);
    if (!existingUser) {
      this.playerNotFound = true;
      return;
    }

    if (this.data.core.color !== existingUser.data.color) {
      this.playerDifferences.color = new Difference('color', existingUser.data.color, this.data.core.color);
    }

    if (this.data.core.role !== existingUser.data.role) {
      this.playerDifferences.role = new Difference('role', existingUser.data.role, this.data.core.role);
    }

    if (JSON.stringify(this.data.core.permissions) !== JSON.stringify(existingUser.data.permissions)) {
      this.playerDifferences.permissions = new Difference('permissions', existingUser.data.permissions, this.data.core.permissions);
    }


    let flagDiff = diffObject(existingUser.data.flags, this.data.flags);
    for (const prop in flagDiff) {
      if (!flagDiff.hasOwnProperty(prop)) {
        continue;
      }
      this.playerFlagDifferences[prop] = new Difference(prop, existingUser.data.flags[prop], flagDiff[prop]);
    }
  }

  parseWorldsetting() {
    if (!this.data) {
      log(false, 'Warning, tried to parse data that is not set.');
      return;
    }

    // TODO Compare against current world
    this.worldDifferences = new Difference(this.data.key, undefined, this.data);
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

    let existingSettings = game.data.settings.find(s => s.key == this.key);

    this.difference = new Difference(this.key, existingSettings?.value, this.value);
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

    const existingUser = game.users.getName(this.data.name);
    if (!existingUser) {
      this.playerNotFound = true;
      return this;
    }

    if (this.data.core.color !== existingUser.data.color) {
      this.playerDifferences.color = new Difference('color', existingUser.data.color, this.data.core.color);
    }

    if (this.data.core.role !== existingUser.data.role) {
      this.playerDifferences.role = new Difference('role', existingUser.data.role, this.data.core.role);
    }

    if (JSON.stringify(this.data.core.permissions) !== JSON.stringify(existingUser.data.permissions)) {
      this.playerDifferences.permissions = new Difference('permissions', existingUser.data.permissions, this.data.core.permissions);
    }


    let flagDiff = diffObject(existingUser.data.flags, this.data.flags);
    for (const prop in flagDiff) {
      if (!flagDiff.hasOwnProperty(prop)) {
        continue;
      }
      this.playerFlagDifferences[prop] = new Difference(prop, existingUser.data.flags[prop], flagDiff[prop]);
    }

    this.name = setting.name;
    this.value = setting.value;
    this.difference = new Difference(this.key, undefined, this.value);
  }

  /**
   * Returns whether this player setting is identical to a player of the same name in the current world.
   * @returns boolean
   */
  hasChanges() {
      return this.playerNotFound || this.hasDataChanges();
  }

  /**
   * Returns whehter this player setting has the same data values as a player of the same name in the current world.
   * Note that if there is not a matching player, there are no data changes.
   * @see hasChanges
   * @returns boolean
   */
  hasDataChanges() {
    return Object.keys(this.playerDifferences).length !== 0 || Object.keys(this.playerFlagDifferences).length !== 0;
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
    this.oldVal = oldValue;
    this.oldString = JSON.stringify(oldValue);
    this.newVal = newValue;
    this.newString = JSON.stringify(newValue);
  }
}
