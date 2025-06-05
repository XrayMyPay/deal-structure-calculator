import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import DealTypeSelector from "@/components/deal-type-selector";
import InputForm from "@/components/input-form";
import ResultsPanel from "@/components/results-panel";
import ComparisonTable from "@/components/comparison-table";
import { DealType, DealInputs, ComparisonData } from "@/types/deal-types";
import { calculateDealStructure } from "@/lib/financial-calculations";
import { exportToPDF } from "@/lib/pdf-export";

export default function Calculator() {
  const { toast } = useToast();
  const [selectedDealType, setSelectedDealType] = useState<DealType>('all-cash');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  
  const [inputs, setInputs] = useState<DealInputs>({
    purchasePrice: 500000,
    termLength: 5,
    interestRate: 5.5,
    taxRate: 25.0,
    equityRetained: 0.0
  });

  const [comparisons, setComparisons] = useState<ComparisonData[]>([]);

  const [pdfOptions, setPdfOptions] = useState({
    includeAssumptions: true,
    includeCashFlow: true,
    includeCharts: true,
    includeBranding: false,
    reportTitle: 'Business Acquisition Analysis Report'
  });

  const dealTypeColors: Record<DealType, string> = {
    'all-cash': '#3B82F6',
    'earn-out': '#10B981',
    'seller-financing': '#F59E0B',
    'sba-loan': '#8B5CF6',
    'custom': '#EF4444'
  };

  const dealTypeLabels: Record<DealType, string> = {
    'all-cash': 'All-Cash Offer',
    'earn-out': 'Earn-Out Structure',
    'seller-financing': 'Seller Financing',
    'sba-loan': 'SBA 7(a) Loan',
    'custom': 'Custom Structure'
  };

  const handleDealTypeChange = useCallback((dealType: DealType) => {
    setSelectedDealType(dealType);
    
    // Reset custom fields when switching away from custom
    if (dealType !== 'custom') {
      setInputs(prev => ({
        ...prev,
        downPayment: undefined,
        balloonPayment: undefined
      }));
    }
  }, []);

  const handleInputsChange = useCallback((newInputs: DealInputs) => {
    setInputs(newInputs);
  }, []);

  const calculateDeals = useCallback(async () => {
    setIsCalculating(true);
    
    try {
      // Calculate all deal types for comparison
      const dealTypes: DealType[] = ['all-cash', 'earn-out', 'seller-financing', 'sba-loan', 'custom'];
      const newComparisons: ComparisonData[] = [];

      for (const dealType of dealTypes) {
        try {
          const results = calculateDealStructure(dealType, inputs);
          newComparisons.push({
            dealType,
            label: dealTypeLabels[dealType],
            results,
            color: dealTypeColors[dealType]
          });
        } catch (error) {
          console.error(`Error calculating ${dealType}:`, error);
          toast({
            title: "Calculation Error",
            description: `Failed to calculate ${dealTypeLabels[dealType]}. Please check your inputs.`,
            variant: "destructive",
          });
        }
      }

      setComparisons(newComparisons);
      
      toast({
        title: "Calculations Complete",
        description: "All deal structures have been calculated successfully.",
      });
    } catch (error) {
      console.error('Calculation error:', error);
      toast({
        title: "Calculation Failed",
        description: "An error occurred while calculating deal structures. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  }, [inputs, toast]);

  const handleExportPDF = useCallback(async () => {
    try {
      await exportToPDF(comparisons, selectedDealType, inputs, pdfOptions);
      setShowPDFModal(false);
      toast({
        title: "PDF Exported",
        description: "Your deal analysis report has been downloaded.",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive",
      });
    }
  }, [comparisons, selectedDealType, inputs, pdfOptions, toast]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Deal Structure Calculator</h1>
                <p className="text-sm text-slate-500 hidden sm:block">Small Business Acquisitions</p>
              </div>
            </div>
            <Dialog open={showPDFModal} onOpenChange={setShowPDFModal}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="inline-flex items-center"
                  disabled={comparisons.length === 0}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Export PDF
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Export PDF Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="assumptions"
                        checked={pdfOptions.includeAssumptions}
                        onCheckedChange={(checked) => 
                          setPdfOptions(prev => ({ ...prev, includeAssumptions: !!checked }))
                        }
                      />
                      <Label htmlFor="assumptions">Include input assumptions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="cashflow"
                        checked={pdfOptions.includeCashFlow}
                        onCheckedChange={(checked) => 
                          setPdfOptions(prev => ({ ...prev, includeCashFlow: !!checked }))
                        }
                      />
                      <Label htmlFor="cashflow">Include cash flow tables</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="charts"
                        checked={pdfOptions.includeCharts}
                        onCheckedChange={(checked) => 
                          setPdfOptions(prev => ({ ...prev, includeCharts: !!checked }))
                        }
                      />
                      <Label htmlFor="charts">Include comparison charts</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="branding"
                        checked={pdfOptions.includeBranding}
                        onCheckedChange={(checked) => 
                          setPdfOptions(prev => ({ ...prev, includeBranding: !!checked }))
                        }
                      />
                      <Label htmlFor="branding">Include custom branding</Label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="report-title">Report Title</Label>
                    <Input 
                      id="report-title"
                      value={pdfOptions.reportTitle}
                      onChange={(e) => 
                        setPdfOptions(prev => ({ ...prev, reportTitle: e.target.value }))
                      }
                      placeholder="Business Acquisition Analysis Report"
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setShowPDFModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleExportPDF}
                    >
                      Generate PDF
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Deal Type Selector */}
        <div className="mb-8">
          <DealTypeSelector 
            selectedDealType={selectedDealType}
            onDealTypeChange={handleDealTypeChange}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            <InputForm 
              dealType={selectedDealType}
              inputs={inputs}
              onInputsChange={handleInputsChange}
              onCalculate={calculateDeals}
              isCalculating={isCalculating}
            />
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            <ResultsPanel 
              comparisons={comparisons}
              selectedDealType={selectedDealType}
              onExportPDF={() => setShowPDFModal(true)}
            />
          </div>
        </div>

        {/* Comparison Section */}
        {comparisons.length > 0 && (
          <div className="mt-8">
            <ComparisonTable comparisons={comparisons} />
          </div>
        )}

        {/* Loading Overlay */}
        {isCalculating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-sm mx-4">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Calculating...</h3>
                    <p className="text-sm text-slate-600">Processing deal structures</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
