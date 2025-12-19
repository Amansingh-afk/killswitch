'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppLayout } from '@/components/app-layout';
import { StatCard } from '@/components/stat-card';
import { Loader } from '@/components/loader';
import api, { API_ENDPOINTS } from '@/lib/api';
import { formatCurrency, formatPercentage } from '@kill-switch/shared';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, Wallet, AlertTriangle, Target, Shield, RefreshCw, Clock, LineChart, RotateCcw } from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface RiskStatus {
  mtm: number;
  startingBalance: number;
  lossPercent: number;
  riskStatus: 'SAFE' | 'TRIGGER';
  threshold: number;
  killStatus: boolean;
}

interface Position {
  tradingSymbol: string;
  netQty: number;
  unrealizedProfit: number;
  costPrice: number;
}

interface Balance {
  availableBalance: number;
  sodLimit: number;
  utilizedAmount: number;
}

interface DailyRiskState {
  tradingDate: string;
  mtm: number;
  invested: number;
  lossPercent: number;
  killStatus: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [riskStatus, setRiskStatus] = useState<RiskStatus | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [riskHistory, setRiskHistory] = useState<DailyRiskState[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      }
      setError(null);
      
      const results = await Promise.allSettled([
        api.get(API_ENDPOINTS.RISK.STATUS).catch(err => ({ error: err } as any)),
        api.get(API_ENDPOINTS.POSITIONS).catch(err => ({ error: err } as any)),
        api.get(API_ENDPOINTS.BALANCE).catch(err => ({ error: err } as any)),
        api.get(API_ENDPOINTS.RISK.HISTORY, { params: { days: 30 } }).catch(err => ({ error: err } as any)),
      ]);

      const [riskResult, positionsResult, balanceResult, historyResult] = results;

      if (riskResult.status === 'fulfilled' && !(riskResult.value as any).error && (riskResult.value as any).data?.success) {
        setRiskStatus((riskResult.value as any).data.risk);
      } else {
        setRiskStatus({
          mtm: 0,
          startingBalance: 0,
          lossPercent: 0,
          riskStatus: 'SAFE' as const,
          threshold: 2.0,
          killStatus: false,
        });
      }

      if (positionsResult.status === 'fulfilled' && !(positionsResult.value as any).error && (positionsResult.value as any).data?.success) {
        setPositions((positionsResult.value as any).data.positions || []);
      } else {
        setPositions([]);
      }

      if (balanceResult.status === 'fulfilled' && !(balanceResult.value as any).error && (balanceResult.value as any).data?.success) {
        setBalance((balanceResult.value as any).data.balance);
      } else {
        setBalance(null);
      }

      if (historyResult.status === 'fulfilled' && !(historyResult.value as any).error && (historyResult.value as any).data?.success) {
        setRiskHistory((historyResult.value as any).data.history || []);
      } else {
        setRiskHistory([]);
      }

      const allResults = [riskResult, positionsResult, balanceResult];
      const dhanErrors = allResults.filter(r => 
        r.status === 'fulfilled' && 
        (r.value as any).error && 
        ((r.value as any).error.response?.data?.error?.toLowerCase().includes('dhan') ||
         (r.value as any).error.response?.status === 400)
      );

      if (dhanErrors.length > 0) {
        setError('Dhan API token not configured or invalid. Please configure your Dhan token in settings to view live data.');
      }

      setLastUpdated(new Date());
    } catch (err: any) {
      if (err.response?.status === 401) {
        const errorMsg = err.response?.data?.error || '';
        if (!errorMsg.toLowerCase().includes('dhan')) {
          router.push('/login');
          return;
        }
      }
      setError(null);
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(false);
    setIsRefreshing(false);
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset today\'s risk state? This will clear all daily risk metrics.')) {
      return;
    }

    try {
      setIsResetting(true);
      const response = await api.post(API_ENDPOINTS.RISK.RESET);
      
      if (response.data.success) {
        await fetchData(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset risk state');
    } finally {
      setIsResetting(false);
    }
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const utilizationPercent = balance 
    ? (balance.utilizedAmount / balance.sodLimit) * 100 
    : 0;

  const showDhanTokenWarning = error && error.toLowerCase().includes('dhan');

  const riskColor =
    riskStatus?.riskStatus === 'TRIGGER' || riskStatus?.killStatus
      ? 'text-destructive'
      : riskStatus?.lossPercent && riskStatus.lossPercent > riskStatus.threshold * 0.8
      ? 'text-yellow-600'
      : 'text-green-600';

  if (isInitialLoading) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center bg-background">
          <Loader text="Optimizing the risk engine" />
        </div>
      </AppLayout>
    );
  }

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
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Monitor your trading positions and risk metrics</p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Updated {formatTimeAgo(lastUpdated)}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isResetting}
                className="gap-2"
              >
                <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {showDhanTokenWarning && (
            <Card className="border-destructive/50 bg-gradient-to-r from-destructive/5 to-destructive/10 backdrop-blur-sm">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Dhan API Configuration Required</p>
                      <p className="text-xs text-muted-foreground mt-1">{error}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="ml-4" 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openSettings'));
                    }}
                  >
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard
              title="Mark-to-Market"
              value={
                riskStatus ? (
                  <span className={riskStatus.mtm >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
                    {formatCurrency(riskStatus.mtm)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">₹0.00</span>
                )
              }
              icon={riskStatus?.mtm !== undefined && riskStatus.mtm >= 0 ? TrendingUp : TrendingDown}
              variant={riskStatus?.mtm !== undefined && riskStatus.mtm >= 0 ? 'success' : 'danger'}
            />

            <StatCard
              title="Risk Status"
              value={
                <div className="flex items-center gap-2">
                  {riskStatus?.riskStatus === 'TRIGGER' || riskStatus?.killStatus ? (
                    <>
                      <div className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse"></div>
                      <span className="text-destructive">DANGER</span>
                    </>
                  ) : (
                    <>
                      <div className="h-2.5 w-2.5 rounded-full bg-green-600 dark:bg-green-400"></div>
                      <span className="text-green-600 dark:text-green-400">SAFE</span>
                    </>
                  )}
                </div>
              }
              icon={riskStatus?.riskStatus === 'TRIGGER' || riskStatus?.killStatus ? Shield : Activity}
              variant={riskStatus?.riskStatus === 'TRIGGER' || riskStatus?.killStatus ? 'danger' : 'success'}
            />

            <StatCard
              title="Loss Percentage"
              value={
                <span className={riskColor}>
                  {riskStatus ? formatPercentage(riskStatus.lossPercent) : <span className="text-muted-foreground">0.00%</span>}
                </span>
              }
              icon={Target}
              variant={
                riskStatus?.riskStatus === 'TRIGGER' || riskStatus?.killStatus
                  ? 'danger'
                  : riskStatus?.lossPercent && riskStatus.lossPercent > riskStatus.threshold * 0.8
                  ? 'warning'
                  : 'info'
              }
            >
              {riskStatus && riskStatus.threshold > 0 && (
                <div className="space-y-1">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        riskStatus.lossPercent >= riskStatus.threshold
                          ? 'bg-destructive'
                          : riskStatus.lossPercent > riskStatus.threshold * 0.8
                          ? 'bg-chart-3'
                          : 'bg-chart-1'
                      }`}
                      style={{
                        width: `${Math.min((riskStatus.lossPercent / riskStatus.threshold) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Threshold: {formatPercentage(riskStatus.threshold)}</p>
                </div>
              )}
            </StatCard>

            <StatCard
              title="Available Balance"
              value={
                balance ? formatCurrency(balance.availableBalance) : <span className="text-muted-foreground">₹0.00</span>
              }
              icon={Wallet}
              variant="info"
            >
              {balance && balance.sodLimit > 0 && (
                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Utilization</span>
                    <span className="font-medium">{utilizationPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        utilizationPercent > 80
                          ? 'bg-destructive'
                          : utilizationPercent > 60
                          ? 'bg-chart-3'
                          : 'bg-chart-2'
                      }`}
                      style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </StatCard>

            <StatCard
              title="Starting Balance"
              value={
                riskStatus ? formatCurrency(riskStatus.startingBalance) : <span className="text-muted-foreground">₹0.00</span>
              }
              icon={DollarSign}
              variant="primary"
            />
          </div>

          {/* Risk History Charts */}
          {riskHistory.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* MTM Trend Chart */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Daily MTM Trend</CardTitle>
                  </div>
                  <CardDescription>Mark-to-market value over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart
                      data={riskHistory.map(state => ({
                        date: new Date(state.tradingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        mtm: state.mtm,
                        killStatus: state.killStatus,
                      }))}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'MTM']}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      />
                      <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                      <Line
                        type="monotone"
                        dataKey="mtm"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                        activeDot={{ r: 6 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Loss Percentage Trend Chart */}
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Daily Loss Percentage</CardTitle>
                  </div>
                  <CardDescription>Loss percentage trend with risk threshold</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart
                      data={riskHistory.map(state => ({
                        date: new Date(state.tradingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        lossPercent: state.lossPercent,
                        killStatus: state.killStatus,
                      }))}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        className="text-xs"
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-xs"
                        tick={{ fill: 'currentColor', fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem',
                        }}
                        formatter={(value: number) => [formatPercentage(value), 'Loss %']}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      />
                      {riskStatus && (
                        <ReferenceLine 
                          y={riskStatus.threshold} 
                          stroke="hsl(var(--destructive))" 
                          strokeDasharray="3 3"
                          label={{ value: `Threshold: ${formatPercentage(riskStatus.threshold)}`, position: 'topRight' }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="lossPercent"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'hsl(var(--destructive))' }}
                        activeDot={{ r: 6 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Open Positions</CardTitle>
              </div>
              <CardDescription>Current trading positions and P&L</CardDescription>
            </CardHeader>
            <CardContent>
              {positions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Cost Price</TableHead>
                        <TableHead className="text-right">Unrealized P&L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((position, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{position.tradingSymbol}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              position.netQty > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {position.netQty > 0 ? 'LONG' : 'SHORT'} {Math.abs(position.netQty)}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono">{formatCurrency(position.costPrice)}</TableCell>
                          <TableCell className={`text-right font-medium ${
                            position.unrealizedProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'
                          }`}>
                            {position.unrealizedProfit >= 0 ? '+' : ''}{formatCurrency(position.unrealizedProfit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No open positions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

