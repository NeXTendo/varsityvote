'use client'

import { useState, useTransition, useCallback, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search, Filter, ChevronLeft, ChevronRight, MoreHorizontal,
  UserCheck, UserX, ShieldCheck, Trash2, KeyRound, Vote,
  Link2, RefreshCw, CheckSquare, Square, Users, Info,
  Edit3, X, Check, AlertTriangle
} from 'lucide-react'
import {
  changeUserRole, setUserActive, forcePasswordReset,
  deleteUserAccount, registerUserForElection,
  sendMagicLink, resetToDefaultPassword, updateUserInfo
} from '@/lib/adminUsers'

const ROLES = ['voter', 'candidate', 'election_admin', 'super_admin'] as const
const ROLE_COLORS: Record<string, string> = {
  super_admin:    'bg-red-500/10 text-red-600 border-red-500/20',
  election_admin: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  candidate:      'bg-primary/10 text-primary border-primary/20',
  voter:          'bg-green-500/10 text-green-600 border-green-500/20',
}

type User = {
  id: string; full_name: string; email: string; student_id: string | null
  role: string; is_active: boolean; created_at: string
  institutions?: { name: string } | null
  require_password_change?: boolean
}

interface Props {
  users: User[]
  elections: { id: string; title: string; status: string }[]
  currentPage: number
  totalPages: number
  totalCount: number
  filters: { role?: string; status?: string; q?: string }
  callerRole: string
}

type ActionState = { type: string; userId: string; data?: any } | null

export function UsersTable({ users, elections, currentPage, totalPages, totalCount, filters, callerRole }: Props) {
  const router     = useRouter()
  const pathname   = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [action, setAction]     = useState<ActionState>(null)
  const [feedback, setFeedback] = useState<{ id: string; type: 'ok' | 'err'; msg: string } | null>(null)
  const [editingUser, setEditingUser]   = useState<User | null>(null)
  const [editForm, setEditForm]         = useState({ full_name: '', student_id: '' })
  const [searchInput, setSearchInput]   = useState(filters.q ?? '')
  const [electionMenuFor, setElectionMenuFor] = useState<string | null>(null) // userId

  // ── URL Filter helpers ────────────────────────────────────────────────────
  const updateFilter = useCallback((key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params}`)
  }, [pathname, router, searchParams])

  const goPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(p))
    router.push(`${pathname}?${params}`)
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleAll   = () => setSelected(s => s.size === users.length ? new Set() : new Set(users.map(u => u.id)))
  const toggleUser  = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allSelected = selected.size === users.length && users.length > 0

  // ── Server action runner ──────────────────────────────────────────────────
  async function run(fn: () => Promise<any>, successMsg: string, userId: string) {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) {
        setFeedback({ id: userId, type: 'err', msg: res.error })
      } else {
        setFeedback({ id: userId, type: 'ok', msg: successMsg })
        setTimeout(() => setFeedback(null), 3000)
      }
      setAction(null)
    })
  }

  // ── Quick role change ─────────────────────────────────────────────────────
  const handleRoleChange = (user: User, role: string) =>
    run(() => changeUserRole(user.id, role as any), `Role updated to ${role}`, user.id)

  // ── Activate toggle ───────────────────────────────────────────────────────
  const handleToggleActive = (user: User) =>
    run(() => setUserActive(user.id, !user.is_active), user.is_active ? 'User deactivated' : 'User activated', user.id)

  // ── Force password reset ──────────────────────────────────────────────────
  const handleForceReset = (user: User) =>
    run(() => forcePasswordReset(user.id), 'Password reset flagged', user.id)

  // ── Reset to default ──────────────────────────────────────────────────────
  const handleDefaultPassword = (user: User) =>
    run(() => resetToDefaultPassword(user.id, user.email), 'Password reset to default', user.id)

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (user: User) => {
    if (action?.type === 'confirm-delete' && action.userId === user.id) {
      run(() => deleteUserAccount(user.id), 'Account deleted', user.id)
    } else {
      setAction({ type: 'confirm-delete', userId: user.id })
    }
  }

  // ── Magic link ────────────────────────────────────────────────────────────
  const handleMagicLink = (user: User) =>
    run(async () => {
      const res = await sendMagicLink(user.email)
      if (res.link) {
        await navigator.clipboard.writeText(res.link).catch(() => {})
      }
      return res
    }, 'Magic link copied to clipboard', user.id)

  // ── Election registration ─────────────────────────────────────────────────
  const handleRegisterElection = (user: User, electionId: string) =>
    run(() => registerUserForElection(user.id, electionId), 'Registered for election', user.id)

  // ── Edit info ─────────────────────────────────────────────────────────────
  const startEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({ full_name: user.full_name, student_id: user.student_id ?? '' })
  }
  const handleEditSave = () => {
    if (!editingUser) return
    run(() => updateUserInfo(editingUser.id, { full_name: editForm.full_name, student_id: editForm.student_id || undefined }), 'Info updated', editingUser.id)
    setEditingUser(null)
  }

  return (
    <Card className="border-border/40 shadow-2xl shadow-black/5 overflow-hidden">
      {/* ── Toolbar ── */}
      <CardHeader className="bg-muted/20 border-b border-border/40 p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          {/* Search */}
          <form
            onSubmit={e => { e.preventDefault(); updateFilter('q', searchInput || undefined) }}
            className="flex items-center gap-2 flex-1 max-w-sm"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search name, email, student ID..."
                className="pl-9 h-10 rounded-xl bg-background border-border/40 text-sm focus:ring-primary/20"
              />
            </div>
            <Button type="submit" variant="outline" size="sm" className="h-10 rounded-xl border-border/40">
              <Search className="w-4 h-4" />
            </Button>
          </form>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
              <Filter className="w-3 h-3" /> Filter:
            </div>
            {/* Role filter */}
            <select
              value={filters.role ?? ''}
              onChange={e => updateFilter('role', e.target.value || undefined)}
              className="h-9 text-[10px] font-black uppercase tracking-wider rounded-xl bg-background border border-border/40 px-3 cursor-pointer"
            >
              <option value="">ALL ROLES</option>
              {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>)}
            </select>

            {/* Status filter */}
            <select
              value={filters.status ?? ''}
              onChange={e => updateFilter('status', e.target.value || undefined)}
              className="h-9 text-[10px] font-black uppercase tracking-wider rounded-xl bg-background border border-border/40 px-3 cursor-pointer"
            >
              <option value="">ALL STATUS</option>
              <option value="active">ACTIVE</option>
              <option value="inactive">INACTIVE</option>
            </select>

            {(filters.role || filters.status || filters.q) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive"
                onClick={() => router.push(pathname)}
              >
                <X className="w-3 h-3 mr-1" /> CLEAR
              </Button>
            )}
          </div>

          <div className="md:ml-auto flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
              {totalCount.toLocaleString()} users
            </span>
          </div>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{selected.size} selected</span>
            <div className="h-3 w-px bg-primary/20" />
            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => {
                const ids = Array.from(selected)
                run(() => import('@/lib/adminUsers').then(m => m.bulkSetActive(ids, false)), `${ids.length} users deactivated`, ids[0])
                setSelected(new Set())
              }}
            >
              <UserX className="w-3 h-3 mr-1" /> DEACTIVATE ALL
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => setSelected(new Set())}
            >
              <X className="w-3 h-3 mr-1" /> CLEAR
            </Button>
          </div>
        )}
      </CardHeader>

      {/* ── Feedback Banner ── */}
      {feedback && (
        <div className={cn(
          "flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest border-b transition-all",
          feedback.type === 'ok' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
        )}>
          {feedback.type === 'ok' ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
          {feedback.msg}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
          <Card className="w-full max-w-md border-border/40 shadow-2xl" onClick={e => e.stopPropagation()}>
            <CardHeader className="bg-muted/30 border-b border-border/40 px-6 py-5">
              <p className="text-sm font-black uppercase tracking-widest">Edit User Info</p>
              <p className="text-[10px] font-medium text-muted-foreground opacity-60">{editingUser.email}</p>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-50">Full Name</label>
                <Input value={editForm.full_name} onChange={e => setEditForm(f => ({...f, full_name: e.target.value}))}
                  className="rounded-xl h-11 bg-muted/20 border-none font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-50">Student ID</label>
                <Input value={editForm.student_id} onChange={e => setEditForm(f => ({...f, student_id: e.target.value}))}
                  className="rounded-xl h-11 bg-muted/20 border-none font-bold" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1 rounded-xl h-11 font-black uppercase tracking-widest border-border/40">CANCEL</Button>
                <Button onClick={handleEditSave} disabled={isPending} className="flex-1 rounded-xl h-11 font-black uppercase tracking-widest shadow-xl shadow-primary/20">SAVE</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Table ── */}
      {/* NOTE: overflow-visible is needed so the election dropdown escapes the table */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/10">
              <th className="w-10 px-4 py-3 text-left">
                <button onClick={toggleAll} className="text-muted-foreground/40 hover:text-primary transition-colors">
                  {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Member</th>
              <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hidden md:table-cell">Student ID</th>
              <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Role</th>
              <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hidden lg:table-cell">Status</th>
              <th className="px-4 py-3 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-40">
                    <Users className="w-10 h-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No users found</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map(user => {
                const isConfirmingDelete = action?.type === 'confirm-delete' && action.userId === user.id
                const isSelected = selected.has(user.id)

                return (
                  <tr
                    key={user.id}
                    className={cn(
                      "group transition-colors hover:bg-muted/30",
                      isSelected && "bg-primary/5",
                      !user.is_active && "opacity-50"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <button onClick={() => toggleUser(user.id)} className="text-muted-foreground/40 hover:text-primary transition-colors">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Member */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 transition-colors",
                          isSelected ? "bg-primary text-white" : "bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-white"
                        )}>
                          {user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black tracking-tight text-sm truncate">{user.full_name}</p>
                          <p className="text-[10px] text-muted-foreground/60 font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Student ID */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground/60 bg-muted/40 px-2 py-1 rounded-lg">
                        {user.student_id ?? '—'}
                      </span>
                    </td>

                    {/* Role — inline selector */}
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user, e.target.value)}
                        disabled={isPending}
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest rounded-lg border px-2 py-1 cursor-pointer appearance-none bg-transparent",
                          ROLE_COLORS[user.role] ?? 'bg-muted/20 border-border/40'
                        )}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r} className="bg-background text-foreground text-xs font-semibold normal-case tracking-normal">
                            {r.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", user.is_active ? "bg-green-500" : "bg-muted")} />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", user.is_active ? "text-green-600" : "text-muted-foreground/50")}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {user.require_password_change && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-md">
                            RESET REQ.
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <ActionBtn title="Edit Info" onClick={() => startEdit(user)} icon={<Edit3 className="w-3.5 h-3.5" />} />

                        {/* Activate/Deactivate */}
                        <ActionBtn
                          title={user.is_active ? 'Deactivate User' : 'Activate User'}
                          onClick={() => handleToggleActive(user)}
                          icon={user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          color={user.is_active ? 'hover:text-orange-500 hover:bg-orange-500/10' : 'hover:text-green-600 hover:bg-green-500/10'}
                        />

                        {/* Force Password Reset */}
                        <ActionBtn title="Flag: Must Change Password" onClick={() => handleForceReset(user)} icon={<KeyRound className="w-3.5 h-3.5" />} />

                        {/* Reset to Default Password */}
                        <ActionBtn title="Reset to Default Password" onClick={() => handleDefaultPassword(user)} icon={<RefreshCw className="w-3.5 h-3.5" />} />

                        {/* Magic Link */}
                        <ActionBtn title="Copy Magic Link" onClick={() => handleMagicLink(user)} icon={<Link2 className="w-3.5 h-3.5" />} />

                        {/* Register for Election — portal-based dropdown */}
                        {elections.length > 0 && (
                          <ElectionMenuButton
                            user={user}
                            elections={elections}
                            electionMenuFor={electionMenuFor}
                            setElectionMenuFor={setElectionMenuFor}
                            onRegister={handleRegisterElection}
                          />
                        )}

                        {/* Delete */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(user)}
                              className="h-7 px-2 rounded-lg text-[9px] font-black uppercase bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                              CONFIRM
                            </button>
                            <ActionBtn title="Cancel" onClick={() => setAction(null)} icon={<X className="w-3.5 h-3.5" />} />
                          </div>
                        ) : (
                          <ActionBtn
                            title="Delete Account"
                            onClick={() => handleDelete(user)}
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            color="hover:text-red-500 hover:bg-red-500/10"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => goPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-9 w-9 rounded-xl border-border/40 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = currentPage <= 3 ? i + 1 : currentPage - 2 + i
              if (p < 1 || p > totalPages) return null
              return (
                <Button
                  key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm"
                  onClick={() => goPage(p)}
                  className="h-9 w-9 rounded-xl border-border/40 p-0 font-black text-xs"
                >
                  {p}
                </Button>
              )
            })}
            <Button
              variant="outline" size="sm"
              onClick={() => goPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-9 w-9 rounded-xl border-border/40 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function ActionBtn({
  title, onClick, icon, color = 'hover:text-primary hover:bg-primary/10'
}: { title: string; onClick: () => void; icon: React.ReactNode; color?: string }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/40 transition-all duration-200",
        color
      )}
    >
      {icon}
    </button>
  )
}

// ── Portal-based election dropdown ──────────────────────────────────────────────
function ElectionDropdownPortal({
  elections,
  onSelect,
  onClose,
  anchorRef,
}: {
  elections: { id: string; title: string }[]
  onSelect: (id: string) => void
  onClose: () => void
  anchorRef: React.RefObject<HTMLButtonElement>
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    // Position above the button, aligned to its right edge
    setPos({
      top: rect.top + window.scrollY - 8,   // 8px gap above button
      left: rect.right + window.scrollX,
    })
  }, [anchorRef])

  if (!pos) return null

  return createPortal(
    <>
      {/* Click-outside backdrop */}
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        className="fixed z-[9999] bg-background border border-border/40 shadow-2xl rounded-xl overflow-hidden min-w-[220px]"
        style={{
          // Place to the left of anchor so it doesn't overflow right
          left: pos.left - 220,
          top: pos.top - 4,
          transform: 'translateY(-100%)',
        }}
      >
        <div className="px-3 py-2 border-b border-border/40 flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Register for Election</p>
          <button onClick={onClose} className="text-muted-foreground/40 hover:text-foreground p-0.5">
            <X className="w-3 h-3" />
          </button>
        </div>
        {elections.map(el => (
          <button
            key={el.id}
            onClick={() => { onSelect(el.id); onClose() }}
            className="w-full text-left px-3 py-2.5 text-[10px] font-bold hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-2"
          >
            <Vote className="w-3 h-3 opacity-40" />
            {el.title}
          </button>
        ))}
      </div>
    </>,
    document.body
  )
}

// ── ElectionMenuButton: one per row, owns its ref + open state ───────────────
function ElectionMenuButton({
  user,
  elections,
  electionMenuFor,
  setElectionMenuFor,
  onRegister,
}: {
  user: { id: string }
  elections: { id: string; title: string }[]
  electionMenuFor: string | null
  setElectionMenuFor: (id: string | null) => void
  onRegister: (user: any, electionId: string) => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const isOpen = electionMenuFor === user.id

  return (
    <>
      <button
        ref={btnRef}
        title="Register for Election"
        onClick={() => setElectionMenuFor(isOpen ? null : user.id)}
        className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
          isOpen
            ? 'text-primary bg-primary/10'
            : 'text-muted-foreground/40 hover:text-primary hover:bg-primary/10'
        )}
      >
        <Vote className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <ElectionDropdownPortal
          elections={elections}
          anchorRef={btnRef}
          onSelect={(elId) => onRegister(user, elId)}
          onClose={() => setElectionMenuFor(null)}
        />
      )}
    </>
  )
}
