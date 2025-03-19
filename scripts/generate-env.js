const fs = require("fs");
const path = "./src/environments";

// Vérifie si le répertoire existe, sinon le créer
if (!fs.existsSync(path)) {
  fs.mkdirSync(path, { recursive: true });
}

const environmentFileContent = `
export const environment = {
  production: true,
  GITLAB_APP_BASE_URI: '${process.env.GITLAB_APP_BASE_URI || ""}',
  GITLAB_APP_ID: '${process.env.GITLAB_APP_ID || ""}',
  GITLAB_AUTH_REDIRECT_URI: '${process.env.GITLAB_AUTH_REDIRECT_URI || ""}',
  GITLAB_ID_PROJET_REINTEGRATION: ${process.env.GITLAB_ID_PROJET_REINTEGRATION || 0},
  GITLAB_ID_PROJET_SUIVI_GENERAL: ${process.env.GITLAB_ID_PROJET_SUIVI_GENERAL || 0},
  GITLAB_ID_PROJET_CORRECTIONS_DIVERSES: ${process.env.GITLAB_ID_PROJET_CORRECTIONS_DIVERSES || 0},
  MS_CLIENT_ID: '${process.env.MS_CLIENT_ID || ""}',
  MS_DRIVE_ID: '${process.env.MS_DRIVE_ID || ""}',
  MS_SITE_ID: '${process.env.MS_SITE_ID || ""}',
  MS_TENANT_ID: '${process.env.MS_TENANT_ID || ""}',
  MS_WORKBOOK_ID: '${process.env.MS_WORKBOOK_ID || ""}',
  MS_WORKSHEET_LINK: '${process.env.MS_WORKSHEET_LINK || ""}',
};
`;

// Écriture du fichier environment.ts
fs.writeFileSync(`${path}/environment.ts`, environmentFileContent);
