import { CheckCircle2, Copy, FileCheck } from 'lucide-react'

interface VotedStateProps {
  receipt: {
    vote_id: string
    vote_hash: string
  }
}

export function VotedState({ receipt }: VotedStateProps) {
  const copy = (text: string) => navigator.clipboard.writeText(text)

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8 dark:bg-green-900/30">
        <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>

      <h1 className="text-3xl font-black mb-4 tracking-tight">Vote Cast Successfully</h1>
      <p className="text-muted-foreground mb-12">
        Thank you for participating in the democratic process. Your vote has been securely recorded and anonymised.
      </p>

      <div className="rounded-2xl border border-border bg-card p-8 text-left space-y-6 shadow-sm">
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <FileCheck className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Official Receipt</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Vote ID</span>
              <button 
                onClick={() => copy(receipt.vote_id)}
                className="text-[10px] flex items-center gap-1 font-bold text-primary hover:underline"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <div className="font-mono text-xs p-3 rounded-lg bg-accent/50 break-all border border-border/50">
              {receipt.vote_id}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Tamper-Proof Hash</span>
              <button 
                onClick={() => copy(receipt.vote_hash)}
                className="text-[10px] flex items-center gap-1 font-bold text-primary hover:underline"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <div className="font-mono text-xs p-3 rounded-lg bg-accent/50 break-all border border-border/50">
              {receipt.vote_hash}
            </div>
          </div>
        </div>

        <div className="pt-4 text-xs text-muted-foreground italic leading-relaxed">
          * Store this receipt safely. It can be used to audit the election and verify that your vote was counted correctly without revealing your personal identity or choices.
        </div>
      </div>
    </div>
  )
}
