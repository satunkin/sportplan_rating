export function getRuntimeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const postgresFallbackUrl = process.env.DATABASE_URL_POSTGRES?.trim() ?? "";

  if (databaseUrl && !databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  if (postgresFallbackUrl) {
    return postgresFallbackUrl;
  }

  return "";
}

export function getDirectDatabaseUrl() {
  return process.env.DIRECT_URL?.trim() ?? "";
}

export function getAppBaseUrl() {
  return process.env.APP_BASE_URL?.trim() ?? "";
}

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const portRaw = process.env.SMTP_PORT?.trim() ?? "";
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS ?? "";
  const secureRaw = process.env.SMTP_SECURE?.trim() ?? "";
  const from = process.env.EMAIL_FROM?.trim() ?? "";

  return {
    host,
    portRaw,
    port: Number(portRaw || "0"),
    user,
    pass,
    secureRaw,
    secure: secureRaw === "true",
    from,
  };
}

export function isSmtpConfigured() {
  const smtp = getSmtpConfig();

  return Boolean(
    smtp.host &&
      smtp.portRaw &&
      !Number.isNaN(smtp.port) &&
      smtp.user &&
      smtp.pass &&
      smtp.secureRaw &&
      smtp.from,
  );
}

export function isLocalhostUrl(value) {
  return value.includes("localhost") || value.includes("127.0.0.1");
}
