"use client";

import React, { useState } from 'react';
import { useAdminDashboardStats } from '@/features/admin-dashboard/hooks/use-admin-dashboard';
import { AdminDashboardGranularity } from '@/features/admin-dashboard/types/admin-dashboard.types';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Send, 
  Calendar, 
  RefreshCw, 
  ArrowRight,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

// Helper to format currency
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
};

// Helper to format short date
const formatShortDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
};

export default function AdminDashboardPage() {
  // Filters State
  const [granularity, setGranularity] = useState<AdminDashboardGranularity>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Custom range defaults to last 30 days
  const defaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };
  const defaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState<string>(defaultStartDate());
  const [endDate, setEndDate] = useState<string>(defaultEndDate());

  // Chart view tab ('sales' or 'orgs')
  const [chartTab, setChartTab] = useState<'sales' | 'orgs'>('sales');

  // Query Stats
  const { data, isLoading, refetch, isFetching } = useAdminDashboardStats({
    granularity,
    month: granularity === 'month' ? selectedMonth : undefined,
    year: granularity === 'month' || granularity === 'year' ? selectedYear : undefined,
    startDate: granularity === 'range' ? startDate : undefined,
    endDate: granularity === 'range' ? endDate : undefined,
  });

  const handleRefresh = () => {
    refetch();
  };

  // Get active filters descriptive text
  const getFilterText = () => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    if (granularity === 'today') return 'Hoy';
    if (granularity === 'month') return `${months[selectedMonth - 1]} de ${selectedYear}`;
    if (granularity === 'year') return `Año ${selectedYear}`;
    return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
  };

  // SVG Chart Helper Coordinates Builder
  const buildSvgPath = (points: { x: number; y: number }[], height: number) => {
    if (points.length === 0) return { line: '', area: '' };
    
    // Line Path
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Area Path (Close the shape by dropping to bottom-right and bottom-left)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    
    return { line: linePath, area: areaPath };
  };

  // Compile SVGs coordinates for the active trends
  const renderTrendChart = () => {
    if (!data?.trends || data.trends.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border text-xs">
          No hay datos suficientes para graficar en este periodo
        </div>
      );
    }

    const trends = data.trends;
    const width = 600;
    const height = 220;
    const padding = 15;

    // Filter values based on tab
    const values = trends.map(t => chartTab === 'sales' ? t.salesVolume : t.organizations);
    const maxVal = Math.max(...values, 1);

    // Map data to coordinates
    const points = trends.map((item, index) => {
      const x = padding + (index / Math.max(trends.length - 1, 1)) * (width - padding * 2);
      const val = chartTab === 'sales' ? item.salesVolume : item.organizations;
      const y = height - padding - (val / maxVal) * (height - padding * 2);
      return { x, y, label: item.label, value: val };
    });

    const paths = buildSvgPath(points, height - padding);

    return (
      <div className="space-y-4">
        {/* SVG Container */}
        <div className="relative w-full aspect-[21/8] min-h-[220px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand-500, #571777)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-brand-500, #571777)" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding + ratio * (height - padding * 2);
              return (
                <line
                  key={ratio}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="currentColor"
                  className="text-border"
                  strokeWidth="0.5"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area Path */}
            <path d={paths.area} fill="url(#chartGradient)" />

            {/* Line Path */}
            <path
              d={paths.line}
              fill="none"
              stroke="var(--color-brand-500, #571777)"
              strokeWidth="2.5"
              className="text-brand-500"
            />

            {/* Highlighted Points / Tooltips */}
            {points.map((p, i) => (
              <g key={i} className="group/dot cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  className="fill-brand-500 stroke-background"
                  strokeWidth="1.5"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="10"
                  className="fill-brand-500/10 opacity-0 hover:opacity-100 transition-opacity"
                />
                {/* Visual tooltip on point hover */}
                <foreignObject
                  x={p.x - 50}
                  y={p.y - 45}
                  width="100"
                  height="40"
                  className="overflow-visible pointer-events-none opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200"
                >
                  <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white text-[9px] font-bold py-1 px-1.5 rounded shadow-lg text-center border border-zinc-200 dark:border-zinc-800">
                    <div className="truncate">{p.label}</div>
                    <div className="text-brand-400 font-mono">
                      {chartTab === 'sales' ? formatCurrency(p.value) : `${p.value} orgs`}
                    </div>
                  </div>
                </foreignObject>
              </g>
            ))}

            {/* X Axis Labels */}
            {points.filter((_, idx) => {
              // Limit labels count to prevent cluttering
              const interval = Math.ceil(points.length / 8);
              return idx % interval === 0 || idx === points.length - 1;
            }).map((p, i) => (
              <text
                key={i}
                x={p.x}
                y={height - 2}
                textAnchor="middle"
                className="fill-muted-foreground text-[8px] font-medium"
              >
                {p.label}
              </text>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
          <span>Eje X: Tiempo ({getFilterText()})</span>
          <span className="font-semibold text-foreground">
            Máximo: {chartTab === 'sales' ? formatCurrency(maxVal) : `${maxVal} Org(s)`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500 border border-brand-500/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Administración Global</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Métricas consolidadas, crecimiento de tenants e indicadores clave de EasyPoint.
          </p>
        </div>

        {/* Date Filter & Actions Controls */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Granularity Tabs */}
          <div className="w-full sm:w-auto flex rounded-lg border border-border bg-card p-1 shadow-sm">
            {(['today', 'month', 'year', 'range'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-all uppercase tracking-wider ${
                  granularity === g
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {g === 'today' ? 'Hoy' : g === 'month' ? 'Mes' : g === 'year' ? 'Año' : 'Rango'}
              </button>
            ))}
          </div>

          {/* Granularity Context Options */}
          {granularity === 'month' && (
            <div className="w-full sm:w-auto flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="flex-1 sm:flex-initial h-9 rounded-lg border border-input bg-card px-3 py-1 text-xs text-foreground font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
              >
                {[
                  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ].map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
              
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="flex-1 sm:flex-initial h-9 rounded-lg border border-input bg-card px-3 py-1 text-xs text-foreground font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
              >
                {[2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {granularity === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full sm:w-auto h-9 rounded-lg border border-input bg-card px-3 py-1 text-xs text-foreground font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {granularity === 'range' && (
            <div className="w-full sm:w-auto flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 sm:flex-initial h-9 rounded-lg border border-input bg-card px-2 py-1 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 min-w-0"
              />
              <span className="text-muted-foreground text-xs font-semibold shrink-0">a</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 sm:flex-initial h-9 rounded-lg border border-input bg-card px-2 py-1 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 min-w-0"
              />
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={isLoading || isFetching}
            className="w-full sm:w-auto flex items-center justify-center p-2 bg-card border border-border hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all shadow-sm disabled:opacity-50 shrink-0"
            title="Recargar Métricas"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-brand-500' : ''}`} />
          </button>
        </div>
      </header>

      {/* Loading Overlay */}
      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="h-10 w-10 text-brand-500 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Cargando métricas administrativas...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Dashboard Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Organizations Created */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 bg-brand-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Registros del Periodo</span>
                  <span className="text-3xl font-extrabold block text-foreground">
                    {data?.kpis.period.organizationsCreated}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Total histórico:</span>
                <span className="font-bold text-foreground">{data?.kpis.total.organizations} orgs</span>
              </div>
            </div>

            {/* Users Registered */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 bg-blue-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Usuarios Registrados</span>
                  <span className="text-3xl font-extrabold block text-foreground">
                    {data?.kpis.period.usersRegistered}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Total histórico:</span>
                <span className="font-bold text-foreground">{data?.kpis.total.users} usuarios</span>
              </div>
            </div>

            {/* Sales Volume */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 bg-emerald-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Facturación Global</span>
                  <span className="text-2xl font-extrabold block text-emerald-600 dark:text-emerald-500 truncate max-w-[180px]" title={formatCurrency(data?.kpis.period.salesVolume || 0)}>
                    {formatCurrency(data?.kpis.period.salesVolume || 0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{data?.kpis.period.salesCount} ventas en periodo</span>
                <span className="font-semibold text-foreground">Total: {formatCurrency(data?.kpis.total.salesVolume || 0)}</span>
              </div>
            </div>

            {/* Invitations Sent */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 h-16 w-16 bg-purple-500/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Invitaciones Enviadas</span>
                  <span className="text-3xl font-extrabold block text-foreground">
                    {data?.kpis.period.invitationsSent}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <Send className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Pendientes por activar:</span>
                <span className="font-bold text-foreground">{data?.kpis.total.pendingInvitations}</span>
              </div>
            </div>

          </section>

          {/* Charts Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Line Trend Card */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Tendencias del Periodo</h2>
                  <p className="text-xs text-muted-foreground">Ventas y registros a través del periodo seleccionado.</p>
                </div>
                {/* View Switcher */}
                <div className="flex rounded-lg border border-border bg-muted p-0.5 text-xs font-semibold self-stretch sm:self-auto">
                  <button
                    onClick={() => setChartTab('sales')}
                    className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all ${
                      chartTab === 'sales' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Ventas
                  </button>
                  <button
                    onClick={() => setChartTab('orgs')}
                    className={`flex-1 sm:flex-none px-3 py-1 rounded-md transition-all ${
                      chartTab === 'orgs' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Registros
                  </button>
                </div>
              </div>

              {renderTrendChart()}
            </div>

            {/* Distribution Sidepanel */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between gap-6">
              
              {/* Plan Distribution */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-border/40 pb-2">
                  <Layers className="h-3.5 w-3.5 text-brand-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Planes de Suscripción</h2>
                </div>

                <div className="space-y-3">
                  {/* Visual Stacked Progress Bar */}
                  {(() => {
                    const total = data?.planDistribution.reduce((acc, p) => acc + p.count, 0) || 1;
                    const freeCount = data?.planDistribution.find(p => p.plan === 'FREE')?.count || 0;
                    const basicCount = data?.planDistribution.find(p => p.plan === 'BASIC')?.count || 0;
                    const premiumCount = data?.planDistribution.find(p => p.plan === 'PREMIUM')?.count || 0;

                    const freePct = (freeCount / total) * 100;
                    const basicPct = (basicCount / total) * 100;
                    const premiumPct = (premiumCount / total) * 100;

                    return (
                      <div className="space-y-3">
                        {/* Stacked bar */}
                        <div className="h-2.5 w-full rounded-full bg-muted flex overflow-hidden border border-border">
                          {freePct > 0 && (
                            <div 
                              className="h-full bg-zinc-400 dark:bg-zinc-600 hover:opacity-90 transition-opacity" 
                              style={{ width: `${freePct}%` }}
                              title={`Free: ${freeCount} (${freePct.toFixed(0)}%)`}
                            />
                          )}
                          {basicPct > 0 && (
                            <div 
                              className="h-full bg-brand-500 hover:opacity-90 transition-opacity" 
                              style={{ width: `${basicPct}%` }}
                              title={`Basic: ${basicCount} (${basicPct.toFixed(0)}%)`}
                            />
                          )}
                          {premiumPct > 0 && (
                            <div 
                              className="h-full bg-emerald-500 hover:opacity-90 transition-opacity" 
                              style={{ width: `${premiumPct}%` }}
                              title={`Premium: ${premiumCount} (${premiumPct.toFixed(0)}%)`}
                            />
                          )}
                        </div>

                        {/* Details list */}
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                              <span className="font-medium">Gratis (FREE)</span>
                            </div>
                            <span className="font-bold text-muted-foreground">{freeCount} orgs</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-brand-500" />
                              <span className="font-medium">Básico (BASIC)</span>
                            </div>
                            <span className="font-bold text-brand-500">{basicCount} orgs</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="font-medium flex items-center gap-1">
                                Premium (PREMIUM)
                              </span>
                            </div>
                            <span className="font-bold text-emerald-500">{premiumCount} orgs</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Modules distribution */}
              <div className="space-y-3 flex-1 flex flex-col min-h-0 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 border-b border-border/40 pb-2">
                  <Building2 className="h-3.5 w-3.5 text-brand-500" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">Popularidad de Módulos</h2>
                </div>

                <div className="space-y-2 overflow-y-auto no-scrollbar flex-1 min-h-0 pr-1">
                  {data?.moduleDistribution.slice(0, 8).map((m) => {
                    const totalOrgs = data.kpis.total.organizations || 1;
                    const percent = Math.min((m.count / totalOrgs) * 100, 100);

                    return (
                      <div key={m.key} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-foreground truncate max-w-[150px]">{m.name}</span>
                          <span className="text-muted-foreground font-mono text-[9px]">{m.count} orgs</span>
                        </div>
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-500/80 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </section>

          {/* Bottom Grid: Recent Activity Tables */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Recent Organizations */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold tracking-tight text-foreground">Organizaciones Recientes</h3>
                  <p className="text-[11px] text-muted-foreground">Últimos tenants que se han registrado en el SaaS.</p>
                </div>
                <Link
                  href="/admin/organizations"
                  className="flex items-center gap-1 text-[11px] font-bold text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Ver todas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto border border-border rounded-xl bg-white dark:bg-zinc-950">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                      <th className="px-4 py-3">Organización</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentOrganizations.map((org) => (
                      <tr key={org.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors text-foreground">
                        <td className="px-4 py-3 font-semibold">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[150px]">{org.name}</span>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[150px] font-normal">
                              {org.email || 'Sin correo'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            org.plan === 'PREMIUM'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : org.plan === 'BASIC'
                              ? 'bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400'
                              : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {org.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatShortDate(org.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${
                            org.status === 'ACTIVE' 
                              ? 'text-emerald-500' 
                              : org.status === 'SUSPENDED' 
                              ? 'text-red-500' 
                              : 'text-zinc-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              org.status === 'ACTIVE' 
                                ? 'bg-emerald-500' 
                                : org.status === 'SUSPENDED' 
                                ? 'bg-red-500' 
                                : 'bg-zinc-400'
                            }`} />
                            {org.status === 'ACTIVE' ? 'Activo' : org.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Users */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold tracking-tight text-foreground">Usuarios Recientes</h3>
                  <p className="text-[11px] text-muted-foreground">Últimos usuarios que se han registrado en el sistema.</p>
                </div>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-1 text-[11px] font-bold text-brand-500 hover:text-brand-600 transition-colors"
                >
                  Ver todos
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto border border-border rounded-xl bg-white dark:bg-zinc-950">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground font-bold text-[10px] uppercase tracking-wider">
                      <th className="px-4 py-3">Nombre / Correo</th>
                      <th className="px-4 py-3">Rol Global</th>
                      <th className="px-4 py-3">Registro</th>
                      <th className="px-4 py-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.recentUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors text-foreground">
                        <td className="px-4 py-3 font-semibold">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[150px]">
                              {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Usuario sin nombre'}
                            </span>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[150px] font-normal">
                              {user.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            user.globalRole === 'ADMIN'
                              ? 'bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400'
                              : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {user.globalRole === 'ADMIN' && <ShieldCheck className="h-3 w-3 text-brand-500" />}
                            {user.globalRole}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatShortDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                            user.isActive 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </section>
        </div>
      )}
    </div>
  );
}
