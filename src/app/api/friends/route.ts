import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { normalizeUsername } from "@/lib/server/validation";
import { rankProgress } from "@/lib/ranking";

type PublicUser = {
  id: string;
  username: string;
  xp: number;
  rank: string;
};

type Friendship = {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
};

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });
  const url = new URL(request.url);
  const query = normalizeUsername(url.searchParams.get("query") || "");
  const supabase = getSupabaseAdmin();

  if (query) {
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, xp, rank")
      .ilike("username", `%${query}%`)
      .neq("id", session.userId)
      .order("username", { ascending: true })
      .limit(12);

    if (usersError) return supabaseError("buscar usuarios", usersError);
    const candidates = (users ?? []) as PublicUser[];
    const ids = candidates.map((user) => user.id);
    const { data: allFriendships } = ids.length
      ? await supabase
          .from("friendships")
          .select("id, user_id, friend_id, status")
          .or(`user_id.eq.${session.userId},friend_id.eq.${session.userId}`)
      : { data: [] };
    const friendships = ((allFriendships ?? []) as Friendship[]).filter((row) => ids.includes(row.user_id === session.userId ? row.friend_id : row.user_id));

    return NextResponse.json({
      ok: true,
      results: candidates.map((user) => toSearchResult(user, friendships, session.userId))
    });
  }

  const { data: friendships, error } = await supabase
    .from("friendships")
    .select("id, user_id, friend_id, status")
    .or(`user_id.eq.${session.userId},friend_id.eq.${session.userId}`)
    .order("created_at", { ascending: false });

  if (error) return supabaseError("carregar amizades", error);
  const rows = (friendships ?? []) as Friendship[];
  const userIds = Array.from(new Set(rows.flatMap((row) => [row.user_id, row.friend_id]).filter((id) => id !== session.userId)));
  const { data: users, error: usersError } = userIds.length
    ? await supabase.from("users").select("id, username, xp, rank").in("id", userIds)
    : { data: [], error: null };

  if (usersError) return supabaseError("carregar usuarios das amizades", usersError);
  const byId = new Map(((users ?? []) as PublicUser[]).map((user) => [user.id, user]));

  return NextResponse.json({
    ok: true,
    friends: rows.filter((row) => row.status === "accepted").map((row) => toFriend(row, byId, session.userId)).filter(Boolean),
    pendingReceived: rows.filter((row) => row.status === "pending" && row.friend_id === session.userId).map((row) => toFriend(row, byId, session.userId)).filter(Boolean),
    pendingSent: rows.filter((row) => row.status === "pending" && row.user_id === session.userId).map((row) => toFriend(row, byId, session.userId)).filter(Boolean)
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const username = normalizeUsername(String(body.username || ""));
  if (!username) return NextResponse.json({ ok: false, message: "Informe um username valido." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: target, error: targetError } = await supabase.from("users").select("id, username").eq("username", username).maybeSingle();
  if (targetError) return supabaseError("buscar usuario", targetError);
  if (!target) return NextResponse.json({ ok: false, message: "Usuario nao encontrado." }, { status: 404 });
  if (target.id === session.userId) return NextResponse.json({ ok: false, message: "Voce nao pode adicionar voce mesmo." }, { status: 400 });

  const { data: currentFriendships, error: existingError } = await supabase
    .from("friendships")
    .select("id, user_id, friend_id, status")
    .or(`user_id.eq.${session.userId},friend_id.eq.${session.userId}`);

  if (existingError) return supabaseError("verificar amizade", existingError);
  const existing = ((currentFriendships ?? []) as Array<{ id: string; status: string; user_id?: string; friend_id?: string }>).find((row) =>
    (row.user_id === session.userId && row.friend_id === target.id) ||
    (row.friend_id === session.userId && row.user_id === target.id)
  );
  if (existing) return NextResponse.json({ ok: false, message: "Essa amizade ja existe ou esta pendente." }, { status: 409 });

  const { error } = await supabase.from("friendships").insert({
    user_id: session.userId,
    friend_id: target.id,
    status: "pending"
  });
  if (error) return supabaseError("criar pedido de amizade", error);
  return NextResponse.json({ ok: true, message: `Pedido enviado para ${target.username}.` });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const friendshipId = String(body.friendshipId || "");
  const action = String(body.action || "");
  if (!friendshipId || !["accept", "decline", "cancel"].includes(action)) return NextResponse.json({ ok: false, message: "Acao invalida." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: friendship, error: findError } = await supabase.from("friendships").select("id, user_id, friend_id, status").eq("id", friendshipId).maybeSingle<Friendship>();
  if (findError) return supabaseError("buscar amizade", findError);
  if (!friendship || (friendship.user_id !== session.userId && friendship.friend_id !== session.userId)) {
    return NextResponse.json({ ok: false, message: "Amizade nao encontrada." }, { status: 404 });
  }

  if (action === "accept") {
    if (friendship.friend_id !== session.userId) return NextResponse.json({ ok: false, message: "Voce so pode aceitar pedidos recebidos." }, { status: 403 });
    const { error } = await supabase.from("friendships").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", friendship.id);
    if (error) return supabaseError("aceitar amizade", error);
    return NextResponse.json({ ok: true, message: "Amizade aceita." });
  }

  const { error } = await supabase.from("friendships").delete().eq("id", friendship.id);
  if (error) return supabaseError("remover pedido de amizade", error);
  return NextResponse.json({ ok: true, message: action === "cancel" ? "Pedido cancelado." : "Pedido recusado." });
}

function toSearchResult(user: PublicUser, friendships: Friendship[], currentUserId: string) {
  const friendship = friendships.find((row) =>
    (row.user_id === currentUserId && row.friend_id === user.id) ||
    (row.friend_id === currentUserId && row.user_id === user.id)
  );
  return {
    username: user.username,
    xp: Number(user.xp || 0),
    rank: user.rank,
    progress: rankProgress(Number(user.xp || 0)),
    friendshipStatus: friendship ? relationStatus(friendship, currentUserId) : "none"
  };
}

function toFriend(row: Friendship, users: Map<string, PublicUser>, currentUserId: string) {
  const otherId = row.user_id === currentUserId ? row.friend_id : row.user_id;
  const user = users.get(otherId);
  if (!user) return null;
  return {
    friendshipId: row.id,
    username: user.username,
    xp: Number(user.xp || 0),
    rank: user.rank,
    progress: rankProgress(Number(user.xp || 0)),
    status: relationStatus(row, currentUserId)
  };
}

function relationStatus(row: Friendship, currentUserId: string) {
  if (row.status === "accepted") return "accepted";
  if (row.user_id === currentUserId) return "pending_sent";
  return "pending_received";
}

function supabaseError(action: string, caught: { message?: string; code?: string; details?: string; hint?: string }) {
  console.error(`[api/friends] erro Supabase ao ${action}`, caught);
  const parts = [caught.message, caught.code && `code=${caught.code}`, caught.details && `details=${caught.details}`, caught.hint && `hint=${caught.hint}`].filter(Boolean);
  return NextResponse.json({ ok: false, message: `Erro Supabase ao ${action}: ${parts.join(" | ") || "sem detalhes"}` }, { status: 500 });
}
