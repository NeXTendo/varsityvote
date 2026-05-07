import { formatDateTime } from '@/lib/utils'
import type { AuditLog } from '@/lib/audit'

export function AuditTable({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Action</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Details</th>
            <th className="px-4 py-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-accent/50 transition-colors">
              <td className="px-4 py-3 font-medium">
                <span className="inline-flex rounded bg-primary/10 px-2 py-0.5 text-[10px] uppercase font-bold text-primary">
                  {log.action.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                {JSON.stringify(log.metadata)}
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatDateTime(log.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
