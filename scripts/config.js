export const name = 'forien-copy-environment';

export const templates = {
  settings: `modules/${name}/templates/settings.html`,
};

export function isV10orNewer() {
  const gameVersion = game.version || game.data.version;
  return gameVersion === '10.0' || isNewerVersion(gameVersion, '10');
}

export function log(force, ...args) {
  try {
    if (typeof force !== "boolean") {
      console.warn(
        'Copy Environment | Invalid log usage. Expected "log(force, ...args)" as boolean but got',
        force
      );
    }

    const isDebugging = window.DEV?.getPackageDebugValue(name);

    if (force || isDebugging) {
      console.log("Copy Environment |", ...args);
    }
  } catch (e) {
  }
}
