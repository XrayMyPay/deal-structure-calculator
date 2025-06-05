import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CashFlowChart from "./cash-flow-chart";
import { ComparisonData, DealType } from "@/types/deal-types";
import { useState } from "react";

interface ResultsPanelProps {
  comparisons: ComparisonData[];
  selectedDealType: DealType;
  onExportPDF: () => void;
}

export default function ResultsPanel({ comparisons, selectedDealType, onExportPDF }: ResultsPanelProps) {
  const [viewType, setViewType] = useState<'yearly' | 'cumulative'>('yearly');

  const selectedComparison = comparisons.find(c => c.dealType === selectedDealType);

  if (!selectedComparison) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-slate-600">No results available. Please calculate deal structures.</p>
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-slate-600 mb-1">Total Investment</div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(selectedComparison.results.totalInvestment)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-green-600 mb-1">Net Proceeds</div>
            <div className="text-2xl font-bold text-green-700 font-mono">
              {formatCurrency(selectedComparison.results.netProceeds)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-blue-600 mb-1">ROI</div>
            <div className="text-2xl font-bold text-blue-700 font-mono">
              {formatPercentage(selectedComparison.results.roi)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">Financial Summary</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewType === 'yearly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('yearly')}
              >
                Yearly
              </Button>
              <Button
                variant={viewType === 'cumulative' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('cumulative')}
              >
                Cumulative
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 mb-6">
            <CashFlowChart 
              comparisons={[selectedComparison]} 
              viewType={viewType}
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Year-by-Year Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Year</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Principal</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Interest</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Tax Impact</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Net Cash Flow</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {selectedComparison.results.cashFlow.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">Year {row.year}</td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right font-mono">
                      {formatCurrency(row.principal)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right font-mono">
                      {formatCurrency(row.interest)}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-mono ${
                      row.taxImpact < 0 ? 'text-red-600' : 'text-slate-900'
                    }`}>
                      {row.taxImpact < 0 ? '(' + formatCurrency(row.taxImpact) + ')' : formatCurrency(row.taxImpact)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 text-right font-mono font-semibold">
                      {formatCurrency(row.netCashFlow)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">Total</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right font-mono">
                    {formatCurrency(selectedComparison.results.cashFlow.reduce((sum, row) => sum + row.principal, 0))}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right font-mono">
                    {formatCurrency(selectedComparison.results.cashFlow.reduce((sum, row) => sum + row.interest, 0))}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right font-mono">
                    {(() => {
                      const totalTax = selectedComparison.results.cashFlow.reduce((sum, row) => sum + row.taxImpact, 0);
                      return totalTax < 0 ? '(' + formatCurrency(totalTax) + ')' : formatCurrency(totalTax);
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right font-mono">
                    {formatCurrency(selectedComparison.results.netProceeds)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={onExportPDF} size="lg">
          Export PDF Report
        </Button>
      </div>
    </div>
  );
}
