import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { rankProgress } from "@/lib/ranking";

type PublicUser = {
  id: string;
  username: string;
  xp: number;
  rank: string;
};

type Friendship = {
  user_id: string;
  friend_id: string;
  status: string;
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope") === "friends" ? "friends" : "global";
  const supabase = getSupabaseAdmin();

  if (scope === "friends") {
    const { data: friendships, error: friendshipError } = await supabase
      .from("friendships")
      .select("user_id, friend_id, status")
      .eq("status", "accepted")
      .or(`user_id.eq.${session.userId},friend_id.eq.${session.userId}`);

    if (friendshipError) return supabaseError("carregar amigos", friendshipError);

    const friendIds = new Set<string>([session.userId]);
    for (const friendship of (friendships ?? []) as Friendship[]) {
      friendIds.add(friendship.user_id === session.userId ? friendship.friend_id : friendship.user_id);
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, xp, rank")
      .in("id", Array.from(friendIds));

    if (usersError) return supabaseError("carregar ranking de amigos", usersError);
    return NextResponse.json({ ok: true, scope, leaders: toLeaders((users ?? []) as PublicUser[]) });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, username, xp, rank")
    .order("xp", { ascending: false })
    .order("username", { ascending: true })
    .limit(100);

  if (error) return supabaseError("carregar ranking global", error);
  return NextResponse.json({ ok: true, scope, leaders: toLeaders((data ?? []) as PublicUser[]) });
}

function toLeaders(users: PublicUser[]) {
  return users
    .slice()
    .sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0) || a.username.localeCompare(b.username))
    .map((user, index) => ({
      position: index + 1,
      username: user.username,
      rank: user.rank,
      xp: Number(user.xp || 0),
      progress: rankProgress(Number(user.xp || 0))
    }));
}

function supabaseError(action: string, caught: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[api/ranking] erro Supabase ao ${action}`, caught);
  const parts = [caught.message, caught.code && `code=${caught.code}`, caught.details && `details=${caught.details}`, caught.hint && `hint=${caught.hint}`].filter(Boolean);
  return NextResponse.json({ ok: false, message: `Erro Supabase ao ${action}: ${parts.join(" | ") || "sem detalhes"}` }, { status: 500 });
}
