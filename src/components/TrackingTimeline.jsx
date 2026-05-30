import { CheckCircle } from "lucide-react";

const steps = [
  { id: 1, label: "Request Sent" },
  { id: 2, label: "Donor Accepted" },
  { id: 3, label: "Donor On The Way" },
  { id: 4, label: "Donation Completed" },
];

export default function TrackingTimeline({ currentStep }) {
  return (
    <div className="relative flex flex-col gap-0">
      {steps.map((step, index) => {
        const completed = step.id < currentStep;
        const active = step.id === currentStep;
        const lineColor = completed ? "bg-green-500" : active ? "bg-red-500" : "bg-gray-300";

        return (
          <div key={step.id} className="relative flex items-start gap-3 pb-6">
            <div className="relative flex flex-col items-center">
              {completed ? (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle size={18} className="text-white" />
                </div>
              ) : active ? (
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-3 h-3 bg-white rounded-full" />
                </div>
              ) : (
                <div className="w-8 h-8 border-2 border-gray-300 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                </div>
              )}
              {index < steps.length - 1 && (
                <div className={"absolute left-3.5 top-8 w-0.5 h-full " + lineColor} />
              )}
            </div>
            <div>
              <div className={completed || active ? "text-sm font-semibold text-gray-900" : "text-sm font-semibold text-gray-500"}>
                {step.label}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {completed ? "Completed" : active ? "In progress" : "Pending"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
