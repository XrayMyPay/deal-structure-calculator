import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DealInputs, DealType } from "@/types/deal-types";
import { useState, useEffect } from "react";

interface InputFormProps {
  dealType: DealType;
  inputs: DealInputs;
  onInputsChange: (inputs: DealInputs) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

export default function InputForm({ dealType, inputs, onInputsChange, onCalculate, isCalculating }: InputFormProps) {
  const [formData, setFormData] = useState<DealInputs>(inputs);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormData(inputs);
  }, [inputs]);

  const getDealTypeDescription = (type: DealType): string => {
    const descriptions = {
      'all-cash': 'Configure the financial terms for your all-cash acquisition structure.',
      'earn-out': 'Set up performance-based payments with earn-out milestones.',
      'seller-financing': 'Structure owner-financed terms with custom payment schedules.',
      'sba-loan': 'Configure SBA 7(a) loan terms with enforced 10% down payment.',
      'custom': 'Create a fully customizable deal structure with flexible terms.'
    };
    return descriptions[type];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.purchasePrice || formData.purchasePrice <= 0) {
      newErrors.purchasePrice = 'Purchase price must be greater than 0';
    }

    if (!formData.termLength || formData.termLength < 1 || formData.termLength > 30) {
      newErrors.termLength = 'Term length must be between 1 and 30 years';
    }

    if (formData.interestRate < 0 || formData.interestRate > 50) {
      newErrors.interestRate = 'Interest rate must be between 0 and 50%';
    }

    if (!formData.taxRate || formData.taxRate < 0 || formData.taxRate > 60) {
      newErrors.taxRate = 'Tax rate must be between 0 and 60%';
    }

    if (formData.equityRetained < 0 || formData.equityRetained > 100) {
      newErrors.equityRetained = 'Equity retained must be between 0 and 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof DealInputs, value: string) => {
    const numericValue = parseFloat(value) || 0;
    const updatedInputs = { ...formData, [field]: numericValue };
    setFormData(updatedInputs);
    onInputsChange(updatedInputs);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleCalculate = () => {
    if (validateForm()) {
      onCalculate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Deal Parameters</CardTitle>
        <p className="text-sm text-slate-600">{getDealTypeDescription(dealType)}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">
              Purchase Price ($) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
              <Input
                id="purchasePrice"
                type="number"
                placeholder="500,000"
                value={formData.purchasePrice || ''}
                onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                className={`pl-8 font-mono ${errors.purchasePrice ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.purchasePrice && (
              <p className="text-xs text-red-500">{errors.purchasePrice}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="termLength">
              Term Length (Years) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="termLength"
              type="number"
              placeholder="5"
              min="1"
              max="30"
              value={formData.termLength || ''}
              onChange={(e) => handleInputChange('termLength', e.target.value)}
              className={`font-mono ${errors.termLength ? 'border-red-500' : ''}`}
            />
            {errors.termLength && (
              <p className="text-xs text-red-500">{errors.termLength}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (%)</Label>
            <div className="relative">
              <Input
                id="interestRate"
                type="number"
                placeholder="5.5"
                step="0.1"
                min="0"
                max="50"
                value={formData.interestRate || ''}
                onChange={(e) => handleInputChange('interestRate', e.target.value)}
                className={`pr-8 font-mono ${errors.interestRate ? 'border-red-500' : ''}`}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">%</span>
            </div>
            {errors.interestRate && (
              <p className="text-xs text-red-500">{errors.interestRate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRate">
              Tax Rate (%) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="taxRate"
                type="number"
                placeholder="25.0"
                step="0.1"
                min="0"
                max="60"
                value={formData.taxRate || ''}
                onChange={(e) => handleInputChange('taxRate', e.target.value)}
                className={`pr-8 font-mono ${errors.taxRate ? 'border-red-500' : ''}`}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">%</span>
            </div>
            {errors.taxRate && (
              <p className="text-xs text-red-500">{errors.taxRate}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="equityRetained">Equity Retained (%)</Label>
          <div className="relative">
            <Input
              id="equityRetained"
              type="number"
              placeholder="0.0"
              step="0.1"
              min="0"
              max="100"
              value={formData.equityRetained || ''}
              onChange={(e) => handleInputChange('equityRetained', e.target.value)}
              className={`pr-8 font-mono ${errors.equityRetained ? 'border-red-500' : ''}`}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500">%</span>
          </div>
          {errors.equityRetained && (
            <p className="text-xs text-red-500">{errors.equityRetained}</p>
          )}
        </div>

        {dealType === 'sba-loan' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">ℹ</span>
              </div>
              <p className="text-sm font-medium text-blue-900">SBA 7(a) Loan Requirements</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <p className="font-medium text-slate-700">Down Payment</p>
                <p className="text-slate-900 font-mono">
                  ${Math.round(formData.purchasePrice * 0.1).toLocaleString()} (10%)
                </p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="font-medium text-slate-700">Financed Amount</p>
                <p className="text-slate-900 font-mono">
                  ${Math.round(formData.purchasePrice * 0.9).toLocaleString()} (90%)
                </p>
              </div>
            </div>
          </div>
        )}

        {dealType === 'custom' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">⚙</span>
              </div>
              <p className="text-sm font-medium text-amber-900">Custom Structure Parameters</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="downPayment">Down Payment ($)</Label>
                <Input
                  id="downPayment"
                  type="number"
                  placeholder="100,000"
                  value={formData.downPayment || ''}
                  onChange={(e) => handleInputChange('downPayment', e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balloonPayment">Balloon Payment ($)</Label>
                <Input
                  id="balloonPayment"
                  type="number"
                  placeholder="0"
                  value={formData.balloonPayment || ''}
                  onChange={(e) => handleInputChange('balloonPayment', e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200">
          <Button 
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full"
            size="lg"
          >
            {isCalculating ? 'Calculating...' : 'Calculate & Compare Results'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
