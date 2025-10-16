import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const certDir = path.resolve(rootDir, "../backend/certs");
const certPath = path.join(certDir, "dev.crt");
const keyPath = path.join(certDir, "dev.key");

const hasCertificates = fs.existsSync(certPath) && fs.existsSync(keyPath);
const httpsCredentials = hasCertificates
  ? {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    }
  : undefined;

export default defineConfig(() => ({
  plugins: [react(), basicSsl()],
  ...(httpsCredentials
    ? {
        server: {
          https: httpsCredentials,
        },
        preview: {
          https: httpsCredentials,
        },
      }
    : {}),
}));
