export const name = 'forien-copy-environment';

export const templates = {
  playerSettings: `modules/${name}/templates/player-settings.html`,
  worldSettings: `modules/${name}/templates/world-settings.html`,
};

export function log(force, ...args) {
  try {
    if (typeof force !== 'boolean') {
      console.warn('Copy Environment | Invalid log usage. Expected "log(force, ...args)" as boolean but got', force);
    }

    const isDebugging = window.DEV?.getPackageDebugValue(name);

    if (force || isDebugging) {
      console.log('Copy Environment |', ...args);
    }
  } catch (e) {}
}
