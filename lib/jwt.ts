import { SignJWT, jwtVerify } from "jose";

function getSecretRaw(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "JWT_SECRET not set — using insecure development fallback. Set JWT_SECRET for production.",
      );
      return "dev-secret-change-me";
    }
    throw new Error("Missing JWT_SECRET in environment");
  }
  return secret;
}

function getKey() {
  return new TextEncoder().encode(getSecretRaw());
}

export async function signToken(
  payload: Record<string, unknown>,
  expiresIn: string | number = "30d",
) {
  const alg = "HS256";
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(
      typeof expiresIn === "string" ? expiresIn : `${expiresIn}s`,
    )
    .sign(getKey());
  return jwt;
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getKey());
  return payload as Record<string, unknown>;
}

export default { signToken, verifyToken };
