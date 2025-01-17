const fs = require("fs");
const path = require("path");

const appComponentPath = path.join(__dirname, "../src/app/app.component.html");
const version = process.env.FLAG_VERSION ?? "test";
const now = new Date();
const date = now.toLocaleDateString("fr-FR");
const time = now.toLocaleTimeString("fr-FR");

fs.readFile(appComponentPath, "utf8", (err, data) => {
  if (err) {
    console.error("Impossible de lire le fichier app.component.html:", err);
    return;
  }

  const updatedData = data.replace(
    /%%%VERSION AND DATE%%%/,
    `Custy ${now.getFullYear()} - ${version} - ${date} ${time}`,
  );

  fs.writeFile(appComponentPath, updatedData, "utf8", (err) => {
    if (err) {
      console.error("Impossible d'écrire le fichier app.component.html:", err);
      return;
    }
    console.log("app.component.html mis à jour avec succès.");
  });
});
