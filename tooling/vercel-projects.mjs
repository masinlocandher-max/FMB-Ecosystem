#!/usr/bin/env node

/**
 * Create or verify the independent Vercel projects for the FMB monorepo.
 *
 * Safety rules:
 * - Never moves or attaches production domains.
 * - Never copies environment variables.
 * - Never deletes or modifies the legacy `withlovefmb` project.
 * - Existing desired projects are verified, not silently rewritten.
 *
 * Usage:
 *   node tooling/vercel-projects.mjs plan
 *   VERCEL_TOKEN=... node tooling/vercel-projects.mjs verify
 *   VERCEL_TOKEN=... node tooling/vercel-projects.mjs apply
 */

const API_BASE = "https://api.vercel.com";
const DEFAULT_TEAM_ID = "team_KRSlI8wfigrmTrcCfbLIu9C6";
const REPOSITORY = "masinlocandher-max/FMB-Ecosystem";

const projects = [
  {
    name: "fmb-public-and-yoni",
    rootDirectory: "apps/withlovefmb",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    installCommand: "npm install --no-audit --no-fund"
  },
  {
    name: "senz",
    rootDirectory: "apps/senz",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    installCommand: "npm install --no-audit --no-fund"
  },
  {
    name: "cognita",
    rootDirectory: "apps/cognita",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    installCommand: "npm ci"
  }
];

const mode = process.argv[2] || "plan";
const allowedModes = new Set(["plan", "verify", "apply"]);

if (!allowedModes.has(mode)) {
  console.error(`Unknown mode: ${mode}. Use plan, verify, or apply.`);
  process.exit(2);
}

const token = process.env.VERCEL_TOKEN || "";
const teamId = process.env.VERCEL_TEAM_ID || DEFAULT_TEAM_ID;

if (mode !== "plan" && !token) {
  console.error("VERCEL_TOKEN is required for verify or apply mode.");
  process.exit(2);
}

function expectedPayload(project) {
  return {
    name: project.name,
    gitRepository: {
      type: "github",
      repo: REPOSITORY
    },
    rootDirectory: project.rootDirectory,
    buildCommand: project.buildCommand,
    outputDirectory: project.outputDirectory,
    installCommand: project.installCommand,
    enableAffectedProjectsDeployments: true
  };
}

async function vercelRequest(pathname, options = {}) {
  const url = new URL(pathname, API_BASE);
  url.searchParams.set("teamId", teamId);

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { response, body };
}

async function getProject(name) {
  const { response, body } = await vercelRequest(`/v9/projects/${encodeURIComponent(name)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Unable to read Vercel project ${name}: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

function connectedRepository(project) {
  const link = project.link || project.gitRepository || {};
  const owner = link.org || link.owner || link.repoOwner || "";
  const repo = link.repo || link.repoName || "";

  if (repo.includes("/")) return repo;
  if (owner && repo) return `${owner}/${repo}`;
  return repo;
}

function mismatches(actual, expected) {
  const differences = [];
  const checks = [
    ["rootDirectory", actual.rootDirectory ?? null, expected.rootDirectory],
    ["buildCommand", actual.buildCommand ?? null, expected.buildCommand],
    ["outputDirectory", actual.outputDirectory ?? null, expected.outputDirectory]
  ];

  for (const [field, value, expectedValue] of checks) {
    if (value !== expectedValue) {
      differences.push(`${field}: expected ${JSON.stringify(expectedValue)}, found ${JSON.stringify(value)}`);
    }
  }

  const repository = connectedRepository(actual);
  if (repository && repository.toLowerCase() !== REPOSITORY.toLowerCase()) {
    differences.push(`gitRepository: expected ${REPOSITORY}, found ${repository}`);
  }

  return differences;
}

async function createProject(project) {
  const payload = expectedPayload(project);
  const { response, body } = await vercelRequest("/v11/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Unable to create Vercel project ${project.name}: ${response.status} ${JSON.stringify(body)}`);
  }

  return body;
}

function printPlan() {
  console.log(`Vercel team: ${teamId}`);
  console.log(`GitHub repository: ${REPOSITORY}`);
  console.log("\nProjects to create or verify:");
  for (const project of projects) {
    console.log(`- ${project.name}`);
    console.log(`  root: ${project.rootDirectory}`);
    console.log(`  build: ${project.buildCommand}`);
    console.log(`  output: ${project.outputDirectory}`);
  }
  console.log("\nNo domains or environment variables are changed by this command.");
}

async function run() {
  if (mode === "plan") {
    printPlan();
    return;
  }

  let failures = 0;

  for (const project of projects) {
    let actual = await getProject(project.name);

    if (!actual && mode === "verify") {
      console.error(`MISSING ${project.name}`);
      failures += 1;
      continue;
    }

    if (!actual && mode === "apply") {
      console.log(`Creating ${project.name}...`);
      actual = await createProject(project);
      console.log(`CREATED ${project.name} (${actual.id || "project created"})`);
    }

    if (!actual) continue;

    const differences = mismatches(actual, project);
    if (differences.length) {
      console.error(`MISMATCH ${project.name}`);
      for (const difference of differences) console.error(`  - ${difference}`);
      console.error("  Existing projects are not silently modified. Correct this project in Vercel before moving any domain.");
      failures += 1;
      continue;
    }

    console.log(`OK ${project.name} (${actual.id || "verified"})`);
  }

  if (failures) {
    console.error(`\nVercel project verification failed for ${failures} project(s).`);
    process.exit(1);
  }

  console.log("\nAll requested Vercel project boundaries are present and correctly configured.");
  console.log("Production domains and environment variables remain untouched.");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
