const fs = require("fs/promises");
const path = require("path");
const { existsSync } = require("fs");

let tmpDir = path.join(__dirname, "..", "store", "tmp");

if (existsSync(tmpDir)) {
  fs.readdir(tmpDir, { encoding: "utf-8" }).then(async (files) => {
    for (const file of files) {
      await fs.rm(path.join(tmpDir, file), { encoding: true, recursive: true });
      console.log("Deleted: ", file);
    }
  });
}
