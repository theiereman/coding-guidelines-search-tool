const fs = require("fs");
const environmentFileContent = `
export const environment = {
  production: true,
  GITLAB_APP_BASE_URI: '${process.env.GITLAB_APP_BASE_URI || ""}',
  GITLAB_API_BASE_URI: '${process.env.GITLAB_API_BASE_URI || ""}',
  GITLAB_APP_ID: '${process.env.GITLAB_APP_ID || ""}',
  GITLAB_AUTH_REDIRECT_URI: '${process.env.GITLAB_AUTH_REDIRECT_URI || ""}',
  GITLAB_ID_PROJET_REINTEGRATION: ${process.env.GITLAB_ID_PROJET_REINTEGRATION || 0},
  GITLAB_ID_PROJET_SUIVI_GENERAL: ${process.env.GITLAB_ID_PROJET_SUIVI_GENERAL || 0},
  GITLAB_ID_PROJET_CORRECTIONS_DIVERSES: ${process.env.GITLAB_ID_PROJET_CORRECTIONS_DIVERSES || 0},
};
`;
fs.writeFileSync("./src/environments/environment.ts", environmentFileContent);
console.log("Environment file generated successfully.");
