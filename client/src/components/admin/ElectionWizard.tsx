import React, { useState } from "react";
import { 
  ChevronLeft, ChevronRight, CheckCircle, 
  Award, Users, CalendarRange, Settings,
  HelpCircle, X
} from "lucide-react";

// Define the steps of the wizard
const WIZARD_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to the Election Wizard',
    description: 'This guide will help you set up and manage your first election.',
    icon: HelpCircle
  },
  {
    id: 'positions',
    title: 'Create Positions',
    description: 'Start by creating the positions students can run for.',
    icon: Award
  },
  {
    id: 'candidates',
    title: 'Add Candidates',
    description: 'Add candidates who are running for each position.',
    icon: Users
  },
  {
    id: 'election',
    title: 'Schedule Election',
    description: 'Set up your election dates and configure settings.',
    icon: CalendarRange
  },
  {
    id: 'settings',
    title: 'Configure Settings',
    description: 'Fine-tune your election settings and options.',
    icon: Settings
  }
];

interface ElectionWizardProps {
  onClose: () => void;
  onGoToTab: (tabId: string) => void;
}

export default function ElectionWizard({ onClose, onGoToTab }: ElectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Handle next step
  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      
      // Move to next step
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle step completion
  const handleCompleteStep = () => {
    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  };

  // Go to specific tab
  const handleGoToTab = (tabId: string) => {
    onGoToTab(tabId);
    handleCompleteStep();
    onClose();
  };

  // Get current step data
  const currentStepData = WIZARD_STEPS[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Election Wizard</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between mb-8 relative">
            {WIZARD_STEPS.map((step, index) => (
              <div 
                key={step.id}
                className="flex flex-col items-center relative z-10"
              >
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
                    ${index === currentStep 
                      ? 'bg-indigo-600 text-white' 
                      : completedSteps.includes(index) 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'}`}
                >
                  {completedSteps.includes(index) ? (
                    <CheckCircle size={20} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-500">{step.title.split(' ')[0]}</span>
              </div>
            ))}
            
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0"></div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-3 rounded-full mr-4">
              <currentStepData.icon size={24} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-gray-800">{currentStepData.title}</h3>
              <p className="text-gray-600">{currentStepData.description}</p>
            </div>
          </div>

          {/* Step-specific content */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            {currentStepData.id === 'welcome' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Welcome to the Election Wizard! This guide will walk you through the process of setting up and running your first election.
                </p>
                <p className="text-gray-600">
                  Here's what you'll need to do:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Create positions that students can run for</li>
                  <li>Add candidates to these positions</li>
                  <li>Schedule your election dates</li>
                  <li>Configure election settings</li>
                </ul>
                <p className="text-gray-600">
                  Click "Next" to begin creating your first election!
                </p>
              </div>
            )}

            {currentStepData.id === 'positions' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Start by defining the positions in your election. These could include:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Student Body President</li>
                  <li>Vice President</li>
                  <li>Secretary</li>
                  <li>Treasurer</li>
                  <li>Department Representatives</li>
                </ul>
                <p className="text-gray-600">
                  For each position, you'll need to provide a title, description, and eligibility criteria.
                </p>
                <div className="mt-4">
                  <button 
                    onClick={() => handleGoToTab('positions')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <Award size={16} className="mr-2" />
                    Go to Positions Tab
                  </button>
                </div>
              </div>
            )}

            {currentStepData.id === 'candidates' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Once you've created positions, you can add candidates who are running for each position.
                </p>
                <p className="text-gray-600">
                  For each candidate, you'll need to provide:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Full name</li>
                  <li>Position they're running for</li>
                  <li>Department and year</li>
                  <li>A profile photo (optional)</li>
                  <li>Campaign manifesto or statement</li>
                </ul>
                <div className="mt-4">
                  <button 
                    onClick={() => handleGoToTab('candidates')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <Users size={16} className="mr-2" />
                    Go to Candidates Tab
                  </button>
                </div>
              </div>
            )}

            {currentStepData.id === 'election' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Now it's time to schedule your election. You'll need to set:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Election name</li>
                  <li>Start date and time</li>
                  <li>End date and time</li>
                  <li>Which positions to include</li>
                </ul>
                <p className="text-gray-600">
                  Make sure to give students enough time to vote, but not so long that interest wanes.
                </p>
                <div className="mt-4">
                  <button 
                    onClick={() => handleGoToTab('elections')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <CalendarRange size={16} className="mr-2" />
                    Go to Elections Tab
                  </button>
                </div>
              </div>
            )}

            {currentStepData.id === 'settings' && (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Finally, configure your election settings:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Decide if students can vote for multiple positions</li>
                  <li>Set whether students can change their votes</li>
                  <li>Configure when and how results are published</li>
                  <li>Set up email notifications (if applicable)</li>
                </ul>
                <p className="text-gray-600">
                  These settings can be adjusted at any time from the Elections tab.
                </p>
                <div className="mt-4">
                  <button 
                    onClick={() => handleGoToTab('elections')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    <Settings size={16} className="mr-2" />
                    Go to Election Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button 
            onClick={handlePrevious}
            className={`flex items-center px-4 py-2 rounded-md text-sm 
              ${currentStep > 0 
                ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={16} className="mr-2" />
            Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {WIZARD_STEPS.length}
          </div>

          <button 
            onClick={handleNext}
            className={`flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700
              ${currentStep === WIZARD_STEPS.length - 1 
                ? 'bg-green-600 hover:bg-green-700' 
                : ''}`}
          >
            {currentStep === WIZARD_STEPS.length - 1 ? 'Finish' : 'Next'}
            {currentStep < WIZARD_STEPS.length - 1 && <ChevronRight size={16} className="ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );
}