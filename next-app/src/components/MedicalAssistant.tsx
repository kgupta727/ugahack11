"use client";

import { useState } from "react";
import { Heart, Phone, Activity, AlertCircle, Play, Pause } from "lucide-react";

interface MedicalAssistantProps {
  emergencyType: string;
  onInstructionSpoken?: (instruction: string) => void;
}

export default function MedicalAssistant({ emergencyType, onInstructionSpoken }: MedicalAssistantProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const getInstructions = () => {
    switch (emergencyType.toLowerCase()) {
      case "medical":
      case "cardiac":
        return {
          title: "CPR Instructions",
          icon: <Heart className="w-6 h-6" />,
          steps: [
            "Call 911 if you haven't already. Stay on the line.",
            "Check if the person is breathing. Look, listen, and feel for breaths.",
            "If not breathing: Lay the person on their back on a firm surface.",
            "Place the heel of one hand on the center of their chest, between the nipples.",
            "Place your other hand on top and interlock your fingers.",
            "Push hard and fast - at least 2 inches deep.",
            "Perform 30 chest compressions at a rate of 100-120 per minute.",
            "Give 2 rescue breaths: Tilt head back, lift chin, pinch nose, seal your mouth over theirs.",
            "Continue cycles of 30 compressions and 2 breaths until help arrives.",
          ],
        };
      case "choking":
        return {
          title: "Choking - Heimlich Maneuver",
          icon: <AlertCircle className="w-6 h-6" />,
          steps: [
            "Ask 'Are you choking?' If they can't speak or cough, act immediately.",
            "Stand behind the person and wrap your arms around their waist.",
            "Make a fist with one hand and place it above their belly button.",
            "Grab your fist with your other hand.",
            "Give quick, upward thrusts into their abdomen.",
            "Repeat until the object is dislodged or person becomes unconscious.",
            "If unconscious, lower to ground and begin CPR.",
          ],
        };
      case "bleeding":
        return {
          title: "Severe Bleeding Control",
          icon: <Activity className="w-6 h-6" />,
          steps: [
            "Call 911 immediately if bleeding is severe.",
            "Have the injured person lie down and elevate the bleeding area above the heart if possible.",
            "Remove any obvious debris from the wound. Don't remove large objects.",
            "Apply firm, direct pressure to the wound with a clean cloth or bandage.",
            "Maintain pressure continuously for at least 10-15 minutes.",
            "If blood soaks through, add more cloth on top and continue pressure.",
            "Once bleeding stops, secure the bandage with tape or cloth strips.",
            "If bleeding doesn't stop, apply pressure to the artery above the wound.",
            "Monitor for shock: pale skin, rapid breathing, weakness.",
          ],
        };
      case "burn":
        return {
          title: "Burn Treatment",
          icon: <AlertCircle className="w-6 h-6" />,
          steps: [
            "Remove the person from the source of the burn.",
            "For minor burns: Cool the burn with cool (not cold) running water for 10-20 minutes.",
            "Remove jewelry, belts, and tight clothing before swelling starts.",
            "DO NOT apply ice, butter, or ointments to severe burns.",
            "Cover the burn with a sterile, non-stick bandage or clean cloth.",
            "For severe burns (large area, charred skin): Call 911 immediately.",
            "Do not break blisters.",
            "Monitor for shock and keep the person warm.",
          ],
        };
      default:
        return {
          title: "General Emergency Instructions",
          icon: <Phone className="w-6 h-6" />,
          steps: [
            "Stay calm and assess the situation.",
            "Ensure the area is safe before approaching.",
            "Call 911 if not already done.",
            "Do not move the person unless they are in immediate danger.",
            "Monitor breathing and consciousness.",
            "Keep the person warm and comfortable.",
            "Reassure them that help is on the way.",
            "Do not give them anything to eat or drink.",
          ],
        };
    }
  };

  const instructions = getInstructions();

  const startGuidance = () => {
    setIsActive(true);
    setCurrentStep(0);
    if (onInstructionSpoken) {
      onInstructionSpoken(instructions.steps[0]);
    }
  };

  const nextStep = () => {
    if (currentStep < instructions.steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      if (onInstructionSpoken) {
        onInstructionSpoken(instructions.steps[next]);
      }
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      if (onInstructionSpoken) {
        onInstructionSpoken(instructions.steps[prev]);
      }
    }
  };

  const stopGuidance = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  return (
    <div className="card border-2 border-red-500/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-red-600 rounded-lg">
          {instructions.icon}
        </div>
        <div>
          <h3 className="font-sans text-xl font-bold">{instructions.title}</h3>
          <p className="text-sm text-slate-400">AI-Powered Medical Guidance</p>
        </div>
      </div>

      {!isActive ? (
        <div>
          <p className="text-sm text-slate-300 mb-4">
            Provide step-by-step medical instructions to the caller while help is on the way.
          </p>
          <button onClick={startGuidance} className="btn-primary flex items-center gap-2 w-full justify-center">
            <Play className="w-5 h-5" />
            Start Medical Guidance
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
            <div className="text-xs text-red-400 mb-2 font-semibold">
              Step {currentStep + 1} of {instructions.steps.length}
            </div>
            <div className="text-lg font-semibold leading-relaxed">
              {instructions.steps[currentStep]}
            </div>
          </div>

          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {instructions.steps.map((step, index) => (
              <div
                key={index}
                className={`text-sm p-3 rounded ${
                  index === currentStep
                    ? "bg-red-900/50 border border-red-600"
                    : index < currentStep
                    ? "bg-green-900/30 border border-green-700 text-green-300"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <span className="font-bold mr-2">{index + 1}.</span>
                {step}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={previousStep}
              disabled={currentStep === 0}
              className="btn-ghost flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button onClick={stopGuidance} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200">
              <Pause className="w-5 h-5" />
            </button>
            <button
              onClick={nextStep}
              disabled={currentStep === instructions.steps.length - 1}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
