"use client";

import type React from "react";
import { useMemo, useState } from "react";
import type { AdminUser } from "./page";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  Search,
  UserPlus,
  Save,
  Trash2,
  KeyRound,
  Shield,
  User as UserIcon,
  X,
  ChevronDown,
  Check,
} from "lucide-react";

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(" ");
}

// ========================
// API helpers
// ========================
async function createUser(payload: { username: string; email: string; password: string; is_staff: boolean }) {
  const res = await fetch("/api/admin/users/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await res.text().catch(() => "");
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data) || text || `HTTP ${res.status}`);
  return data as AdminUser;
}

async function patchUser(id: number, payload: Partial<Pick<AdminUser, "username" | "email" | "is_staff">>) {
  const res = await fetch(`/api/admin/users/${id}/`, {   // ✅ thêm /
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await res.text().catch(() => "");
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) throw new Error(data?.detail || JSON.stringify(data) || text || `HTTP ${res.status}`);
  return data as AdminUser;
}

async function deleteUser(id: number) {
  const res = await fetch(`/api/admin/users/${id}/`, { // ✅ có dấu /
    method: "DELETE",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
}



async function setPassword(id: number, password: string) {
  const res = await fetch(`/api/admin/users/${id}/set-password/`, { // ✅ thêm /
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
}


type BusyId = number | "create" | null;

// ========================
// UI atoms
// ========================
function RoleBadge({ isStaff }: { isStaff: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium border",
        isStaff ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/30" : "bg-white/5 text-white/70 border-white/10"
      )}
    >
      {isStaff ? <Shield className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
      {isStaff ? "Admin" : "User"}
    </span>
  );
}

function FieldLabel({ children }: { children: any }) {
  return <div className="text-[11px] text-white/55 mb-1">{children}</div>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 outline-none",
        "text-white placeholder:text-white/35",
        "focus:border-white/20 focus:bg-white/10",
        props.className
      )}
    />
  );
}

// ✅ Custom combobox (Radix)
function ComboSelect({
  value,
  onValueChange,
  items,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  items: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={cx(
          "inline-flex w-full items-center justify-between gap-2",
          "rounded-xl px-3 py-2.5 outline-none border",
          "text-[14px] sm:text-[15px]",
          "bg-white/5 text-white border-white/10",
          "focus:border-white/20 focus:bg-white/10",
          className
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon className="text-white/60">
          <ChevronDown className="h-4 w-4" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={8}
          className={cx(
            "z-[1000] overflow-hidden rounded-2xl border shadow-xl",
            "border-white/10 bg-[rgba(255,255,255,0.06)] backdrop-blur-xl text-white",
            "min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          <SelectPrimitive.Viewport className="p-2">
            {items.map((it) => (
              <SelectPrimitive.Item
                key={it.value}
                value={it.value}
                className={cx(
                  "relative flex cursor-pointer select-none items-center rounded-xl px-4 py-3",
                  "text-[14px] sm:text-[15px] outline-none",
                  "text-white/85 hover:bg-white/10",
                  "data-[highlighted]:bg-white/10 data-[highlighted]:text-white",
                  "data-[state=checked]:bg-white/10"
                )}
              >
                <SelectPrimitive.ItemText>{it.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3 inline-flex items-center">
                  <Check className="h-5 w-5 text-emerald-300" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function RoleSelect({
  isStaff,
  onChange,
  className,
}: {
  isStaff: boolean;
  onChange: (isStaff: boolean) => void;
  className?: string;
}) {
  return (
    <ComboSelect
      value={isStaff ? "admin" : "user"}
      onValueChange={(v) => onChange(v === "admin")}
      className={className}
      items={[
        { value: "user", label: "User" },
        { value: "admin", label: "Admin" },
      ]}
    />
  );
}

function Button({
  variant = "default",
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "ghost" | "default" | "warning";
  loading?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition border whitespace-nowrap";
  const styles =
    variant === "primary"
      ? "bg-sky-400/90 hover:bg-sky-400 text-black border-transparent"
      : variant === "danger"
      ? "bg-red-500/80 hover:bg-red-500 text-white border-transparent"
      : variant === "warning"
      ? "bg-amber-400/90 hover:bg-amber-400 text-black border-transparent"
      : variant === "ghost"
      ? "bg-transparent hover:bg-white/5 text-white/80 border-white/10"
      : "bg-white/10 hover:bg-white/15 text-white border-white/10";

  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cx(base, styles, (props.disabled || loading) && "opacity-60 cursor-not-allowed", props.className)}
    />
  );
}

// ========================
// Main
// ========================
export default function UsersClient({ initial }: { initial: AdminUser[] }) {
  const [rows, setRows] = useState<AdminUser[]>(initial);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<BusyId>(null);

  // create form
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsStaff, setNewIsStaff] = useState(false);

  // change password modal
  const [pwOpen, setPwOpen] = useState(false);
  const [pwUser, setPwUser] = useState<AdminUser | null>(null);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.username.toLowerCase().includes(s) || (r.email || "").toLowerCase().includes(s));
  }, [rows, q]);

  async function onCreate() {
    setErr(null);
    const username = newUsername.trim();
    const email = newEmail.trim();
    const password = newPassword;

    if (!username) return setErr("Username không được rỗng");
    if (!password || password.length < 6) return setErr("Password tối thiểu 6 ký tự");

    try {
      setBusyId("create");
      const created = await createUser({ username, email, password, is_staff: newIsStaff });
      setRows((prev) => [created, ...prev]);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewIsStaff(false);
    } catch (e: any) {
      setErr(e?.message || "Create failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onSave(id: number, username: string, email: string, isStaff: boolean) {
    setErr(null);
    const u = username.trim();
    const e = email.trim();

    if (!u) return setErr("Username không được rỗng");

    try {
      setBusyId(id);
      const updated = await patchUser(id, { username: u, email: e, is_staff: isStaff });
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (e2: any) {
      setErr(e2?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: number) {
    setErr(null);
    const ok = confirm("Xóa user này?");
    if (!ok) return;

    try {
      setBusyId(id);
      await deleteUser(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setErr(e?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  function openPw(u: AdminUser) {
    setErr(null);
    setPwUser(u);
    setPw1("");
    setPw2("");
    setPwOpen(true);
  }

  async function submitPw() {
    if (!pwUser) return;
    setErr(null);

    if (!pw1 || pw1.length < 6) return setErr("Password tối thiểu 6 ký tự");
    if (pw1 !== pw2) return setErr("Nhập lại password không khớp");

    try {
      setBusyId(pwUser.id);
      await setPassword(pwUser.id, pw1);
      setPwOpen(false);
      setPwUser(null);
    } catch (e: any) {
      setErr(e?.message || "Set password failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-2 sm:px-4">
      {/* ===== Top: Search + Create (2 cards) ===== */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Search card */}
        <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white/90">Tìm kiếm</div>
            <div className="text-[11px] text-white/45">{filtered.length}/{rows.length}</div>
          </div>

          <div className="mt-3 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm username hoặc email..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Create card */}
        <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-white/90">Tạo tài khoản</div>
            <div className="text-[11px] text-white/45">Password tối thiểu 6 ký tự</div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-12">
            <div className="xl:col-span-3">
              <FieldLabel>Username</FieldLabel>
              <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Tên username" />
            </div>

            <div className="xl:col-span-3">
              <FieldLabel>Email</FieldLabel>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email (không bắt buộc)"
              />
            </div>

            <div className="xl:col-span-2">
              <FieldLabel>Role</FieldLabel>
              <RoleSelect isStaff={newIsStaff} onChange={setNewIsStaff} />
            </div>

            <div className="xl:col-span-2">
              <FieldLabel>Password</FieldLabel>
              <Input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder=">= 6 ký tự"
                type="password"
              />
            </div>

            <div className="xl:col-span-2 flex items-end">
              <Button
                variant="primary"
                onClick={onCreate}
                loading={busyId === "create"}
                className="w-full"
              >
                <UserPlus className="h-4 w-4" />
                {busyId === "create" ? "Đang tạo..." : "Tạo user"}
              </Button>
            </div>
          </div>

          {err && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {err}
            </div>
          )}
        </div>
      </div>

      {/* ===== Desktop table ===== */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-white/5">
            <tr className="text-left">
              <th className="px-4 py-3 w-[90px] text-white/70 font-semibold">ID</th>
              <th className="px-4 py-3 text-white/70 font-semibold">Username</th>
              <th className="px-4 py-3 text-white/70 font-semibold">Email</th>
              <th className="px-4 py-3 w-[170px] text-white/70 font-semibold">Role</th>
              <th className="px-4 py-3 w-[380px] text-white/70 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <TableRow
                key={u.id}
                u={u}
                busy={busyId === u.id}
                onSave={onSave}
                onDelete={onDelete}
                onOpenPassword={openPw}
              />
            ))}

            {!filtered.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-white/60">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== Mobile cards ===== */}
      <div className="md:hidden space-y-2">
        {!filtered.length && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center text-white/60">
            Không có dữ liệu
          </div>
        )}

        {filtered.map((u) => (
          <MobileCard
            key={u.id}
            u={u}
            busy={busyId === u.id}
            onSave={onSave}
            onDelete={onDelete}
            onOpenPassword={openPw}
          />
        ))}
      </div>

      {/* ===== Password modal ===== */}
      {pwOpen && pwUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-950 p-4 sm:p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-white/90">Đổi mật khẩu</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                  <span className="font-medium text-white/85">{pwUser.username}</span>
                  <span className="text-white/30">•</span>
                  <span>ID {pwUser.id}</span>
                  <RoleBadge isStaff={!!pwUser.is_staff} />
                </div>
              </div>

              <button
                onClick={() => {
                  setPwOpen(false);
                  setPwUser(null);
                }}
                className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <FieldLabel>Password mới</FieldLabel>
                <Input value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder=">= 6 ký tự" type="password" />
              </div>

              <div>
                <FieldLabel>Nhập lại password</FieldLabel>
                <Input value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Nhập lại" type="password" />
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setPwOpen(false);
                  setPwUser(null);
                }}
              >
                Hủy
              </Button>
              <Button variant="warning" onClick={submitPw} loading={busyId === pwUser.id}>
                <KeyRound className="h-4 w-4" />
                {busyId === pwUser.id ? "Đang lưu..." : "Cập nhật"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// Desktop row
// ========================
function TableRow({
  u,
  busy,
  onSave,
  onDelete,
  onOpenPassword,
}: {
  u: AdminUser;
  busy: boolean;
  onSave: (id: number, username: string, email: string, isStaff: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onOpenPassword: (u: AdminUser) => void;
}) {
  const [username, setUsername] = useState(u.username);
  const [email, setEmail] = useState(u.email || "");
  const [isStaff, setIsStaff] = useState(!!u.is_staff);

  const dirty = username !== u.username || (email || "") !== (u.email || "") || isStaff !== !!u.is_staff;

  return (
    <tr className="border-t border-white/10 align-middle">
      <td className="px-4 py-3 text-white/70">{u.id}</td>

      <td className="px-4 py-3">
        <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      </td>

      <td className="px-4 py-3">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </td>

      <td className="px-4 py-3">
        <RoleSelect isStaff={isStaff} onChange={setIsStaff} />
        <div className="mt-2">
          <RoleBadge isStaff={isStaff} />
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            onClick={() => onSave(u.id, username, email, isStaff)}
            disabled={!dirty}
            loading={busy}
            title="Lưu"
          >
            <Save className="h-4 w-4" />
            {busy ? "Đang lưu..." : "Lưu"}
          </Button>

          <Button variant="warning" onClick={() => onOpenPassword(u)} disabled={busy} title="Đổi mật khẩu">
            <KeyRound className="h-4 w-4" />
            Set password
          </Button>

          <Button variant="danger" onClick={() => onDelete(u.id)} disabled={busy} title="Xóa">
            <Trash2 className="h-4 w-4" />
            Xóa
          </Button>
        </div>

        {dirty && (
          <div className="mt-2 text-[11px] text-amber-200/80">
            * Có thay đổi chưa lưu
          </div>
        )}
      </td>
    </tr>
  );
}

// ========================
// Mobile card
// ========================
function MobileCard({
  u,
  busy,
  onSave,
  onDelete,
  onOpenPassword,
}: {
  u: AdminUser;
  busy: boolean;
  onSave: (id: number, username: string, email: string, isStaff: boolean) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onOpenPassword: (u: AdminUser) => void;
}) {
  const [username, setUsername] = useState(u.username);
  const [email, setEmail] = useState(u.email || "");
  const [isStaff, setIsStaff] = useState(!!u.is_staff);

  const dirty = username !== u.username || (email || "") !== (u.email || "") || isStaff !== !!u.is_staff;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90 truncate">{u.username}</div>
          <div className="mt-0.5 text-xs text-white/55">ID: {u.id}</div>
        </div>
        <RoleBadge isStaff={isStaff} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <div>
          <FieldLabel>Username</FieldLabel>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <FieldLabel>Role</FieldLabel>
          <RoleSelect isStaff={isStaff} onChange={setIsStaff} />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Button
          variant="primary"
          onClick={() => onSave(u.id, username, email, isStaff)}
          disabled={!dirty}
          loading={busy}
          className="w-full"
        >
          <Save className="h-4 w-4" />
          {busy ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="warning" onClick={() => onOpenPassword(u)} disabled={busy} className="w-full">
            <KeyRound className="h-4 w-4" />
            Password
          </Button>

          <Button variant="danger" onClick={() => onDelete(u.id)} disabled={busy} className="w-full">
            <Trash2 className="h-4 w-4" />
            Xóa
          </Button>
        </div>

        {dirty && <div className="text-[11px] text-amber-200/80">* Có thay đổi chưa lưu</div>}
      </div>
    </div>
  );
}
