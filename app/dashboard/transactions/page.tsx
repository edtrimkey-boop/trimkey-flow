import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') {
    return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">{status}</Badge>
  }
  if (status === 'FAILED') {
    return <Badge variant="destructive">{status}</Badge>
  }
  if (status === 'PENDING') {
    return <Badge variant="outline" className="text-amber-400 border-amber-400/40 bg-amber-400/10">{status}</Badge>
  }
  if (status === 'PROCESSING') {
    return <Badge variant="secondary" className="text-blue-400 bg-blue-500/10">{status}</Badge>
  }
  if (status === 'REFUNDED') {
    return <Badge variant="outline" className="text-purple-400 border-purple-400/30 bg-purple-500/10">{status}</Badge>
  }
  if (status === 'PARTIALLY_REFUNDED') {
    return <Badge variant="outline" className="text-orange-400 border-orange-400/30 bg-orange-500/10">{status}</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const db = createAdminClient()
  const page = Number(params.page ?? 1)
  const limit = 25
  const offset = (page - 1) * limit

  let query = db
    .from('payments')
    .select('payment_number, amount, currency_code, status, payment_method, created_at, paid_at, merchants(name), applications(name), merchant_providers(provider)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.status) query = query.eq('status', params.status)

  const { data: payments, count } = await query

  const statuses = ['SUCCESS', 'FAILED', 'PENDING', 'PROCESSING', 'REFUNDED', 'PARTIALLY_REFUNDED']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1">{count ?? 0} total ledger entries</p>
        </div>
      </div>

      {/* Filter Tabs / Pills */}
      <div className="flex gap-2 flex-wrap items-center">
        <Link
          href="/dashboard/transactions"
          className={buttonVariants({ variant: !params.status ? "default" : "outline", size: "sm" })}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/dashboard/transactions?status=${s}`}
            className={buttonVariants({ variant: params.status === s ? "default" : "outline", size: "sm" })}
          >
            {s}
          </Link>
        ))}
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ledger Entries</CardTitle>
          <CardDescription>Comprehensive log of payments, applications, and routing</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground">Payment ID</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Application</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Merchant</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Provider</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Amount</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Method</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                (payments ?? []).map((p: Record<string, unknown>) => (
                  <TableRow key={p.payment_number as string} className="border-border hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-primary font-medium text-xs">
                      {p.payment_number as string}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {(p.applications as { name: string } | null)?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {(p.merchants as { name: string } | null)?.name ?? '—'}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {(p.merchant_providers as { provider: string } | null)?.provider ?? '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-foreground">
                      ₹{(Number(p.amount) / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {(p.payment_method as string) ?? '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={p.status as string} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(p.created_at as string).toLocaleDateString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {(count ?? 0) > limit && (
        <div className="flex gap-2 justify-end pt-2">
          {page > 1 && (
            <Link
              href={`/dashboard/transactions?page=${page - 1}${params.status ? `&status=${params.status}` : ''}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Previous
            </Link>
          )}
          {offset + limit < (count ?? 0) && (
            <Link
              href={`/dashboard/transactions?page=${page + 1}${params.status ? `&status=${params.status}` : ''}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
