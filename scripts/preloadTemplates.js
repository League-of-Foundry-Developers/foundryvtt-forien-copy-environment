import {templates} from './config.js';

export const preloadTemplates = async function () {
  return loadTemplates(
    Object.keys(templates).map(function (key) {
      return templates[key];
    })
  );
};
