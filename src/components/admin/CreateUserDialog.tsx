'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createUser } from '@/lib/users'
import { useToast } from '@/components/ui/use-toast'
import { Plus, UserPlus, Loader2 } from 'lucide-react'

interface CreateUserDialogProps {
  institutions: { id: string; name: string }[]
}

export function CreateUserDialog({ institutions }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const fullName = formData.get('fullName') as string
    const role = formData.get('role') as any
    const institutionId = formData.get('institutionId') as string
    try {
      const result = await createUser({
        email,
        fullName,
        role,
        institutionId: institutionId === 'none' ? null : institutionId,
      })

      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'User account created successfully.',
        })
        setOpen(false)
        router.refresh()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl font-black px-6 shadow-lg shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform">
          <Plus className="w-4 h-4 mr-2" /> CREATE ACCOUNT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-border/40 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">New Authority</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Register a new institutional or system-level account. An invite will be sent to the email provided.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest opacity-60">Full Identity</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="e.g. Dr. John Smith"
                required
                className="rounded-xl border-border/40 bg-muted/30 focus:bg-background transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-60">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@institution.edu"
                required
                className="rounded-xl border-border/40 bg-muted/30 focus:bg-background transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest opacity-60">Designated Role</Label>
                <Select name="role" defaultValue="election_admin" required>
                  <SelectTrigger className="rounded-xl border-border/40 bg-muted/30">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 shadow-xl">
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="election_admin">Election Admin</SelectItem>
                    <SelectItem value="candidate">Candidate</SelectItem>
                    <SelectItem value="voter">Voter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="institutionId" className="text-[10px] font-black uppercase tracking-widest opacity-60">Affiliation</Label>
                <Select name="institutionId" defaultValue="none">
                  <SelectTrigger className="rounded-xl border-border/40 bg-muted/30">
                    <SelectValue placeholder="None (System)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 shadow-xl">
                    <SelectItem value="none">None (System)</SelectItem>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl font-black uppercase tracking-widest px-8 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                'INITIALIZE ACCOUNT'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
