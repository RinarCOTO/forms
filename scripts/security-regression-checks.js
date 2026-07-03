const fs = require("fs");

const env = {};
for (const file of [".env.local", ".env"]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    env[line.slice(0, separator).trim()] = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

const baseUrl = (process.env.SECURITY_TEST_BASE_URL || env.SECURITY_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const crossToken = process.env.SECURITY_TEST_CROSS_TOKEN || env.SECURITY_TEST_CROSS_TOKEN;
const otherBuildingId = process.env.SECURITY_TEST_OTHER_BUILDING_ID || env.SECURITY_TEST_OTHER_BUILDING_ID;
const otherLandId = process.env.SECURITY_TEST_OTHER_LAND_ID || env.SECURITY_TEST_OTHER_LAND_ID;
const otherMachineryId = process.env.SECURITY_TEST_OTHER_MACHINERY_ID || env.SECURITY_TEST_OTHER_MACHINERY_ID;
const allowMutationChecks = (process.env.SECURITY_TEST_ALLOW_MUTATION_CHECKS || env.SECURITY_TEST_ALLOW_MUTATION_CHECKS) === "1";

const results = [];

function record(status, name, detail = "") {
  results.push({ status, name, detail });
  console.log(`${status} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });
}

async function expectStatus(name, path, expected, options = {}) {
  const response = await request(path, options);
  if (expected.includes(response.status)) {
    record("PASS", name, `HTTP ${response.status}`);
  } else {
    const body = await response.text().catch(() => "");
    record("FAIL", name, `expected ${expected.join("/")} got ${response.status} ${body.slice(0, 200)}`);
  }
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function main() {
  console.log(`# Security regression checks against ${baseUrl}`);
  console.log("These checks are safe by default. Mutating cross-record checks require SECURITY_TEST_ALLOW_MUTATION_CHECKS=1 and disposable test records.");

  const machineryId = otherMachineryId || otherBuildingId || "1";
  await expectStatus("anonymous machinery direct GET is blocked", `/api/faas/machinery/${machineryId}`, [401]);
  await expectStatus("anonymous machinery direct PUT is blocked", `/api/faas/machinery/${machineryId}`, [401], {
    method: "PUT",
    body: JSON.stringify({ status: "draft" }),
  });
  await expectStatus("anonymous building photo listing is blocked", "/api/faas/building-structures/photos?buildingId=1", [401]);
  await expectStatus("anonymous land photo listing is blocked", "/api/faas/land-improvements/photos?landImprovementId=1", [401]);
  await expectStatus("anonymous machinery photo listing is blocked", "/api/faas/machinery/photos?machineryId=1", [401]);

  if (!crossToken || !otherBuildingId || !otherLandId) {
    record(
      "SKIP",
      "cross-municipality checks",
      "set SECURITY_TEST_CROSS_TOKEN, SECURITY_TEST_OTHER_BUILDING_ID, and SECURITY_TEST_OTHER_LAND_ID",
    );
  } else {
    const headers = authHeaders(crossToken);
    await expectStatus("cross-municipality building GET is forbidden", `/api/faas/building-structures/${otherBuildingId}`, [403], { headers });
    await expectStatus("cross-municipality land GET is forbidden", `/api/faas/land-improvements/${otherLandId}`, [403], { headers });
    await expectStatus("cross-municipality building comments GET is forbidden", `/api/faas/building-structures/${otherBuildingId}/comments`, [403], { headers });
    await expectStatus("cross-municipality land comments GET is forbidden", `/api/faas/land-improvements/${otherLandId}/comments`, [403], { headers });
    await expectStatus("cross-municipality building photos GET is forbidden", `/api/faas/building-structures/photos?buildingId=${otherBuildingId}`, [403], { headers });
    await expectStatus("cross-municipality land photos GET is forbidden", `/api/faas/land-improvements/photos?landImprovementId=${otherLandId}`, [403], { headers });

    if (allowMutationChecks) {
      await expectStatus("cross-municipality building PUT is forbidden", `/api/faas/building-structures/${otherBuildingId}`, [403], {
        method: "PUT",
        headers,
        body: JSON.stringify({ owner_name: "SECURITY_TEST_SHOULD_NOT_WRITE" }),
      });
      await expectStatus("cross-municipality land PUT is forbidden", `/api/faas/land-improvements/${otherLandId}`, [403], {
        method: "PUT",
        headers,
        body: JSON.stringify({ owner_name: "SECURITY_TEST_SHOULD_NOT_WRITE" }),
      });
      await expectStatus("cross-municipality building assign is forbidden", `/api/faas/building-structures/${otherBuildingId}/assign`, [403], {
        method: "POST",
        headers,
        body: JSON.stringify({ assigned_to: null }),
      });
      await expectStatus("cross-municipality land assign is forbidden", `/api/faas/land-improvements/${otherLandId}/assign`, [403], {
        method: "POST",
        headers,
        body: JSON.stringify({ assigned_to: null }),
      });
      await expectStatus("cross-municipality building submit is forbidden", `/api/faas/building-structures/${otherBuildingId}/submit`, [403], {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      await expectStatus("cross-municipality land submit is forbidden", `/api/faas/land-improvements/${otherLandId}/submit`, [403], {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      await expectStatus("cross-municipality building review is forbidden", `/api/faas/building-structures/${otherBuildingId}/review`, [403], {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "return", comments: "security regression check" }),
      });
      await expectStatus("cross-municipality land review is forbidden", `/api/faas/land-improvements/${otherLandId}/review`, [403], {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "return", comments: "security regression check" }),
      });
    } else {
      record("SKIP", "mutating cross-record checks", "set SECURITY_TEST_ALLOW_MUTATION_CHECKS=1 with disposable records");
    }
  }

  const failed = results.filter((result) => result.status === "FAIL");
  if (failed.length) {
    console.error(`\n${failed.length} security regression check(s) failed.`);
    process.exit(1);
  }

  console.log("\nSecurity regression checks completed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
