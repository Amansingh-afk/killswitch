'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Tooltip } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/app-layout';
import api, { API_ENDPOINTS } from '@/lib/api';
import { formatCurrency, formatPercentage, formatDateTime } from '@kill-switch/shared';
import { AlertTriangle, FileText, Loader2, RefreshCw, Search, ArrowUpDown, Shield, Clock, DollarSign, TrendingDown, Copy, CheckCircle2, Check } from 'lucide-react';

interface KillEvent {
  id: string;
  triggerMtm: number | null;
  triggerLossPercent: number | null;
  executionTime: string;
}

interface PaginationInfo {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [killEvents, setKillEvents] = useState<KillEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEvents = async (page: number = currentPage, limit: number = pageSize) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get(API_ENDPOINTS.RISK.EVENTS, {
        params: {
          page,
          limit,
        },
      });

      if (response.data.success) {
        setKillEvents(response.data.events || []);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError(err.response?.data?.error || 'Failed to load audit logs');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleRefresh = () => {
    fetchEvents(currentPage, pageSize);
  };

  const filteredEvents = killEvents.filter((event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.id.toLowerCase().includes(query) ||
      (event.triggerMtm !== null && event.triggerMtm.toString().includes(query)) ||
      (event.triggerLossPercent !== null && event.triggerLossPercent.toString().includes(query)) ||
      formatDateTime(event.executionTime).toLowerCase().includes(query)
    );
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const timeA = new Date(a.executionTime).getTime();
    const timeB = new Date(b.executionTime).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const formatRelativeTime = (date: string): string => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = now.getTime() - eventDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateTime(date);
  };

  const copyEventId = async (eventId: string) => {
    try {
      await navigator.clipboard.writeText(eventId);
      setCopiedId(eventId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
    }
  };

  return (
    <AppLayout>
      <div className="h-full relative min-h-screen">
        {/* Gradient Background with Grid Pattern */}
        <div className="fixed inset-0 -z-10 grid-pattern" />
        <div className="fixed inset-0 -z-10 bg-gradient-radial from-primary/5 via-primary/2 to-transparent" />
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-primary/5" />
        
        <div className="relative p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
              <p className="text-muted-foreground mt-1">History of kill switch activations and events</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Events Table */}
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Kill Switch Events</CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    Complete history of all kill switch triggers and executions
                    {pagination && (
                      <span className="ml-2">({pagination.total} total events)</span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Controls */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Page size:</label>
                  <select
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-2 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              ) : isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                  <p className="mt-4 text-muted-foreground">Loading audit logs...</p>
                </div>
              ) : sortedEvents.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b bg-muted/30">
                          <TableHead className="h-9 py-1.5 px-3 w-[140px]">
                            <button
                              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                              className="flex items-center gap-1.5 hover:text-foreground transition-colors text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Time
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </TableHead>
                          <TableHead className="h-9 py-1.5 px-3 w-[120px]">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              <DollarSign className="h-3.5 w-3.5" />
                              MTM
                            </div>
                          </TableHead>
                          <TableHead className="h-9 py-1.5 px-3 w-[100px]">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              <TrendingDown className="h-3.5 w-3.5" />
                              Loss %
                            </div>
                          </TableHead>
                          <TableHead className="h-9 py-1.5 px-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              <FileText className="h-3.5 w-3.5" />
                              Event ID
                            </div>
                          </TableHead>
                          <TableHead className="h-9 py-1.5 px-3 text-right w-[120px]">
                            <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              <Shield className="h-3.5 w-3.5" />
                              Status
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedEvents.map((event) => (
                          <TableRow key={event.id} className="hover:bg-muted/30 border-b transition-colors">
                            <TableCell className="py-2 px-3">
                              <Tooltip content={formatDateTime(event.executionTime)}>
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  <span className="text-xs font-medium text-foreground whitespace-nowrap">
                                    {formatRelativeTime(event.executionTime)}
                                  </span>
                                </div>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="py-2 px-3">
                              {event.triggerMtm !== null ? (
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="h-3.5 w-3.5 text-destructive/70 flex-shrink-0" />
                                  <span className="text-sm font-semibold text-destructive whitespace-nowrap">
                                    {formatCurrency(event.triggerMtm)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2 px-3">
                              {event.triggerLossPercent !== null ? (
                                <div className="flex items-center gap-1.5">
                                  <TrendingDown className="h-3.5 w-3.5 text-destructive/70 flex-shrink-0" />
                                  <span className="text-sm font-semibold text-destructive whitespace-nowrap">
                                    {formatPercentage(event.triggerLossPercent)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2 px-3">
                              <div className="flex items-center gap-2 group">
                                <Tooltip content={`Event ID: ${event.id}`}>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    <code className="text-sm font-mono font-semibold text-foreground truncate max-w-[280px]">
                                      {event.id}
                                    </code>
                                  </div>
                                </Tooltip>
                                <button
                                  onClick={() => copyEventId(event.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded flex-shrink-0"
                                  title="Copy Event ID"
                                >
                                  {copiedId === event.id ? (
                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Tooltip content="Kill switch successfully triggered and executed">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 text-destructive px-2.5 py-1 text-xs font-semibold border border-destructive/20 whitespace-nowrap">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Triggered
                                  </span>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} events
                      </div>
                      <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No kill switch events</p>
                  <p className="text-xs mt-1">Kill switch has not been triggered yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

