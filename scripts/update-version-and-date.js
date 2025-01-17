const fs = require("fs");
const path = require("path");

if (!process.env.FLAG_VERSION) {
  console.log("FLAG_VERSION flag not set. Skipping version and date update.");
  process.exit(0);
}

const appComponentPath = path.join(__dirname, "../src/app/app.component.html");
const version = process.env.FLAG_VERSION;
const date = new Date().toLocaleDateString("fr-FR");

fs.readFile(appComponentPath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading app.component.html:", err);
    return;
  }

  const updatedData = data.replace(
    /%%%VERSION AND DATE%%%/,
    `Custy ${new Date().getFullYear()} - v${version} - ${date}`,
  );

  fs.writeFile(appComponentPath, updatedData, "utf8", (err) => {
    if (err) {
      console.error("Error writing app.component.html:", err);
      return;
    }
    console.log("app.component.html updated successfully.");
  });
});
