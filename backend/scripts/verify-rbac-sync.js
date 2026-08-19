import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendPermsPath = path.resolve(__dirname, "../src/config/permissions.js");
const frontendPermsPath = path.resolve(__dirname, "../../frontend/src/rbac/permissions.ts");

if (!fs.existsSync(backendPermsPath)) {
  console.error("Backend permissions.js not found at:", backendPermsPath);
  process.exit(1);
}
if (!fs.existsSync(frontendPermsPath)) {
  console.error("Frontend permissions.ts not found at:", frontendPermsPath);
  process.exit(1);
}

function parseRolePermissions(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const rolePermissions = {};
  
  const roleRegex = /(\w+)\s*:\s*(?:new\s+Set\s*\()?\[([\s\S]*?)\]/g;
  let match;
  while ((match = roleRegex.exec(content)) !== null) {
    const role = match[1];
    if (role === "Record" || role === "super_admin") continue; 
    
    const permsStr = match[2];
    const perms = permsStr
      .split(",")
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => {
        return p.replace(/PERMISSIONS\./g, "").replace(/['"]/g, "");
      });
    
    rolePermissions[role] = new Set(perms);
  }
  return rolePermissions;
}

const backendRoles = parseRolePermissions(backendPermsPath);
const frontendRoles = parseRolePermissions(frontendPermsPath);

let hasDrift = false;

const allRoles = new Set([...Object.keys(backendRoles), ...Object.keys(frontendRoles)]);

for (const role of allRoles) {
  if (!backendRoles[role]) {
    console.error(`❌ Role '${role}' exists in frontend but is missing in backend!`);
    hasDrift = true;
    continue;
  }
  if (!frontendRoles[role]) {
    console.error(`❌ Role '${role}' exists in backend but is missing in frontend!`);
    hasDrift = true;
    continue;
  }

  const bSet = backendRoles[role];
  const fSet = frontendRoles[role];

  for (const p of bSet) {
    if (!fSet.has(p)) {
      console.error(`❌ Permission '${p}' for role '${role}' exists in backend but is missing in frontend!`);
      hasDrift = true;
    }
  }

  for (const p of fSet) {
    if (!bSet.has(p)) {
      console.error(`❌ Permission '${p}' for role '${role}' exists in frontend but is missing in backend!`);
      hasDrift = true;
    }
  }
}

if (hasDrift) {
  console.error("❌ RBAC Drift Detected! Please synchronize permissions.js and permissions.ts.");
  process.exit(1);
} else {
  console.log("✅ RBAC configurations are in sync!");
  process.exit(0);
}
