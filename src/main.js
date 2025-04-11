import { SpellingbeeApplication } from "./application.js";

export function main(argv) {
  const application = new SpellingbeeApplication();
  return application.runAsync(argv);
}
