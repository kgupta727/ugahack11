"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Radio, BarChart3, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";

const AnalyticsDashboard = dynamic(() => import("@/components/AnalyticsDashboard"), {
  ssr: false,
});

interface Incident {
  id: string;
  createdAt: string;
  priority: string;
  emergencyType: string;
  dispatchStatus: string;
  requiresHuman: boolean;
}

export default function Analytics() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/incidents`);
      const data = await res.json();
      setIncidents(data.incidents || []);
    } catch (err) {
      console.error("Failed to fetch incidents:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Radio className="w-8 h-8 text-primary" />
            <span className="font-sans text-2xl font-bold">police.ai</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/call-intake" className="btn-ghost">
              Call Intake
            </Link>
            <Link href="/dashboard" className="btn-ghost">
              Dashboard
            </Link>
            <Link href="/analytics" className="btn-primary">
              Analytics
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-lg">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-sans text-3xl font-bold">Analytics & Insights</h1>
              <p className="text-slate-400">Real-time trends, patterns, and performance metrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-8">
        {incidents.length > 0 ? (
          <AnalyticsDashboard incidents={incidents} />
        ) : (
          <div className="text-center py-16">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
            <p className="text-slate-400">Start handling calls to see analytics and trends</p>
          </div>
        )}
      </main>
    </div>
  );
}
