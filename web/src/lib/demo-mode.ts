export function isDemoMode() {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return process.env.DEMO_DATA_MODE === "fixtures";
}
