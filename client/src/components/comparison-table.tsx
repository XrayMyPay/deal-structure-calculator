import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CashFlowChart from "./cash-flow-chart";
import { ComparisonData } from "@/types/deal-types";
import { useState } from "react";

interface ComparisonTableProps {
  comparisons: ComparisonData[];
}

export default function ComparisonTable({ comparisons }: ComparisonTableProps) {
  const [chartViewType, setChartViewType] = useState<'yearly' | 'cumulative'>('yearly');

  if (comparisons.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-slate-600">No comparison data available. Please calculate deal structures.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value));
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const getRiskLevel = (dealType: string): { label: string; color: string } => {
    const riskLevels: Record<string, { label: string; color: string }> = {
      'all-cash': { label: 'Low', color: 'green' },
      'earn-out': { label: 'Medium', color: 'yellow' },
      'seller-financing': { label: 'Medium', color: 'yellow' },
      'sba-loan': { label: 'Low', color: 'green' },
      'custom': { label: 'Variable', color: 'blue' }
    };
    return riskLevels[dealType] || { label: 'Unknown', color: 'gray' };
  };

  return (
    <div className="space-y-6">
      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">Deal Structure Comparison</CardTitle>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setChartViewType('yearly')}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  chartViewType === 'yearly' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setChartViewType('cumulative')}
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  chartViewType === 'cumulative' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cumulative
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 mb-6">
            <CashFlowChart 
              comparisons={comparisons} 
              viewType={chartViewType}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Deal Structure Comparison</CardTitle>
          <p className="text-sm text-slate-600">Compare outcomes across different acquisition structures.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deal Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Investment</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Net Proceeds</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">ROI</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">IRR</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Risk Level</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {comparisons.map((comparison) => {
                  const riskLevel = getRiskLevel(comparison.dealType);
                  return (
                    <tr key={comparison.dealType} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: comparison.color }}
                          />
                          <span>{comparison.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right font-mono">
                        {formatCurrency(comparison.results.totalInvestment)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right font-mono">
                        {formatCurrency(comparison.results.netProceeds)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-mono font-semibold ${
                        comparison.results.roi >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(comparison.results.roi)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right font-mono">
                        {formatPercentage(comparison.results.irr)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge 
                          variant={riskLevel.color === 'green' ? 'default' : 
                                  riskLevel.color === 'yellow' ? 'secondary' : 'outline'}
                          className={
                            riskLevel.color === 'green' ? 'bg-green-100 text-green-800' :
                            riskLevel.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          {riskLevel.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
