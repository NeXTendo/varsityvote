import { CheckCircle2, ChevronLeft, SendHorizontal } from 'lucide-react'

interface VoteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selections: Record<string, string> // position -> candidate name
  submitting: boolean
}

export function VoteConfirmModal({ isOpen, onClose, onConfirm, selections, submitting }: VoteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Review your ballot</h2>
            <p className="text-sm text-muted-foreground">Confirm your choices before submitting.</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {Object.entries(selections).map(([pos, name]) => (
            <div key={pos} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
              <span className="text-xs font-bold text-muted-foreground uppercase">{pos}</span>
              <span className="font-bold text-sm tracking-tight">{name}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-900/10 p-4 mb-8 text-xs text-orange-800 dark:text-orange-300 leading-relaxed">
          <strong>Important:</strong> Your vote is anonymous and final. Once submitted, you cannot change your choices or vote again in this election.
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold hover:bg-accent transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Go back
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {submitting ? 'Submitting...' : 'Cast Vote'}
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
