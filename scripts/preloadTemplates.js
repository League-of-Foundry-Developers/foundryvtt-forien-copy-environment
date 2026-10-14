import {templates} from './config.js';

export const preloadTemplates = async function () {
  return foundry.applications.handlebars.loadTemplates(
    Object.keys(templates).map(function (key) {
      return templates[key];
    })
  );
};
