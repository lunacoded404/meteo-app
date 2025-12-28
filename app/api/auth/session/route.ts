import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type SessionState = { authenticated: boolean; username: string | null };

export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token")?.value;

  if (!access) {
    return NextResponse.json({ authenticated: false, username: null } satisfies SessionState);
  }

  try {
    const r = await fetch(`${process.env.DJANGO_API_BASE}/api/auth/me/`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      // ✅ token rác/expired → clear cookie để middleware cho vào login lại
      const res = NextResponse.json({ authenticated: false, username: null } satisfies SessionState);
      res.cookies.set("access_token", "", { httpOnly: true, path: "/", maxAge: 0 });
      res.cookies.set("refresh_token", "", { httpOnly: true, path: "/", maxAge: 0 });
      return res;
    }

    // ✅ quan trọng: data phải có username
    return NextResponse.json({
      authenticated: true,
      username: data?.username ?? data?.user?.username ?? null,
    } satisfies SessionState);
  } catch {
    return NextResponse.json({ authenticated: false, username: null } satisfies SessionState);
  }
}
