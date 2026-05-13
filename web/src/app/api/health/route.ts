import { NextResponse } from "next/server";

import { getDeploymentReadinessReport } from "@/lib/deployment-readiness";

export async function GET() {
  const report = await getDeploymentReadinessReport();
  const isHealthy = report.blockers.length === 0;

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      blockers: report.blockers,
      warnings: report.warnings,
      timestamp: new Date().toISOString(),
    },
    {
      status: isHealthy ? 200 : 503,
    },
  );
}
