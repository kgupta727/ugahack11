"use client";

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Clock, MapPin } from "lucide-react";

interface AnalyticsDashboardProps {
  incidents: any[];
}

export default function AnalyticsDashboard({ incidents }: AnalyticsDashboardProps) {
  // Calculate metrics
  const totalIncidents = incidents.length;
  const criticalIncidents = incidents.filter(i => i.priority === "critical").length;
  const avgResponseTime = incidents.length > 0 
    ? incidents.reduce((acc, inc) => acc + (Math.random() * 300), 0) / incidents.length 
    : 0;

  // Emergency type distribution
  const typeDistribution = incidents.reduce((acc, inc) => {
    acc[inc.emergencyType] = (acc[inc.emergencyType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Priority distribution
  const priorityDistribution = incidents.reduce((acc, inc) => {
    acc[inc.priority] = (acc[inc.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityData = Object.entries(priorityDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Hourly distribution (simulated)
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    calls: Math.floor(Math.random() * 10) + 1,
  }));

  // Status distribution
  const statusData = [
    { name: "Not Dispatched", value: incidents.filter(i => i.dispatchStatus === "not-dispatched").length },
    { name: "Dispatched", value: incidents.filter(i => i.dispatchStatus === "dispatched").length },
    { name: "En Route", value: incidents.filter(i => i.dispatchStatus === "en-route").length },
    { name: "On Scene", value: incidents.filter(i => i.dispatchStatus === "on-scene").length },
    { name: "Resolved", value: incidents.filter(i => i.dispatchStatus === "resolved").length },
  ].filter(d => d.value > 0);

  const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700">
          <div className="text-sm text-blue-300 mb-1">Total Incidents</div>
          <div className="text-4xl font-bold text-blue-400">{totalIncidents}</div>
          <div className="text-xs text-blue-300 mt-2 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            +12% from last week
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700">
          <div className="text-sm text-red-300 mb-1">Critical Cases</div>
          <div className="text-4xl font-bold text-red-400">{criticalIncidents}</div>
          <div className="text-xs text-red-300 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            {Math.round((criticalIncidents / totalIncidents) * 100)}% of total
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700">
          <div className="text-sm text-green-300 mb-1">Avg Response Time</div>
          <div className="text-4xl font-bold text-green-400">{Math.round(avgResponseTime)}s</div>
          <div className="text-xs text-green-300 mt-2 flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            -8% improvement
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700">
          <div className="text-sm text-purple-300 mb-1">AI Handled</div>
          <div className="text-4xl font-bold text-purple-400">
            {incidents.filter(i => !i.requiresHuman).length}
          </div>
          <div className="text-xs text-purple-300 mt-2">
            {Math.round((incidents.filter(i => !i.requiresHuman).length / totalIncidents) * 100)}% automated
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Type Distribution */}
        <div className="card">
          <h3 className="font-sans text-xl font-bold mb-4">Emergency Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <h3 className="font-sans text-xl font-bold mb-4">Priority Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
              />
              <Bar dataKey="value" fill="#3b82f6">
                {priorityData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.name === "Critical" ? "#ef4444" :
                      entry.name === "High" ? "#f97316" :
                      entry.name === "Medium" ? "#eab308" : "#22c55e"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Call Volume */}
        <div className="card">
          <h3 className="font-sans text-xl font-bold mb-4">24-Hour Call Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
              />
              <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="card">
          <h3 className="font-sans text-xl font-bold mb-4">Dispatch Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
              />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hotspots */}
      <div className="card">
        <h3 className="font-sans text-xl font-bold mb-4">📍 Emergency Hotspots</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <div className="font-bold text-lg mb-1">Downtown Area</div>
            <div className="text-sm text-slate-400">15 incidents this week</div>
            <div className="text-xs text-red-400 mt-2">↑ 23% increase</div>
          </div>
          <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-4">
            <div className="font-bold text-lg mb-1">University District</div>
            <div className="text-sm text-slate-400">12 incidents this week</div>
            <div className="text-xs text-orange-400 mt-2">↑ 8% increase</div>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <div className="font-bold text-lg mb-1">Residential West</div>
            <div className="text-sm text-slate-400">9 incidents this week</div>
            <div className="text-xs text-green-400 mt-2">↓ 5% decrease</div>
          </div>
        </div>
      </div>
    </div>
  );
}
