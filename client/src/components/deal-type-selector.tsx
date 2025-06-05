import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DealType } from "@/types/deal-types";

interface DealTypeSelectorProps {
  selectedDealType: DealType;
  onDealTypeChange: (dealType: DealType) => void;
}

const dealTypes = [
  {
    id: 'all-cash' as DealType,
    title: 'All-Cash Offer',
    description: 'Immediate full payment',
    icon: '💰'
  },
  {
    id: 'earn-out' as DealType,
    title: 'Earn-Out Structure',
    description: 'Performance-based payments',
    icon: '📈'
  },
  {
    id: 'seller-financing' as DealType,
    title: 'Seller Financing',
    description: 'Owner-financed terms',
    icon: '🤝'
  },
  {
    id: 'sba-loan' as DealType,
    title: 'SBA 7(a) Loan',
    description: '10% down + financing',
    icon: '🏛️'
  },
  {
    id: 'custom' as DealType,
    title: 'Custom Structure',
    description: 'Fully customizable',
    icon: '⚙️'
  }
];

export default function DealTypeSelector({ selectedDealType, onDealTypeChange }: DealTypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Select Deal Structure Type</CardTitle>
        <p className="text-sm text-slate-600">Choose the acquisition structure to analyze and compare financial outcomes.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {dealTypes.map((dealType) => (
            <button
              key={dealType.id}
              onClick={() => onDealTypeChange(dealType.id)}
              className={`p-4 border-2 rounded-lg text-center transition-colors duration-200 ${
                selectedDealType === dealType.id
                  ? 'border-primary-200 bg-primary-50'
                  : 'border-slate-200 bg-white hover:border-primary-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                selectedDealType === dealType.id ? 'bg-primary-600' : 'bg-slate-400'
              }`}>
                <span className="text-white text-sm font-semibold">{dealType.icon}</span>
              </div>
              <h3 className="font-medium text-slate-900 text-sm">{dealType.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{dealType.description}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
