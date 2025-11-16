'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CreateProfileSchema } from '@planmaker/shared';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { CheckCircle } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Choose Your Goal', description: 'What do you want to achieve?' },
  { id: 2, title: 'Tell Us About You', description: 'Help us personalize your plan' },
  { id: 3, title: 'Availability', description: 'How much time can you dedicate?' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    niche: '',
    level: '',
    goals: [] as string[],
    equipment: [] as string[],
    constraints: [] as string[],
    daysPerWeek: 3,
    minutesPerDay: 30,
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.profile.create(data);
      return response.data;
    },
    onSuccess: () => {
      router.push('/dashboard');
    },
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit profile
      createProfileMutation.mutate({
        niche: formData.niche,
        level: formData.level,
        goals: formData.goals,
        equipment: formData.equipment,
        constraints: formData.constraints,
        availability: {
          daysPerWeek: formData.daysPerWeek,
          minutesPerDay: formData.minutesPerDay,
        },
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="max-w-3xl mx-auto py-12">
        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition ${
                      currentStep >= step.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? <CheckCircle className="h-6 w-6" /> : step.id}
                  </div>
                  <p className="text-xs mt-2 text-center hidden sm:block">{step.title}</p>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 transition ${
                      currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step 1: Choose niche and level */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="label">What are you interested in?</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {['fitness', 'music', 'study', 'skills'].map((niche) => (
                      <button
                        key={niche}
                        onClick={() => setFormData({ ...formData, niche })}
                        className={`p-4 border-2 rounded-lg transition capitalize ${
                          formData.niche === niche
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {niche}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">What's your level?</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {['beginner', 'intermediate', 'advanced', 'expert'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setFormData({ ...formData, level })}
                        className={`p-4 border-2 rounded-lg transition capitalize ${
                          formData.level === level
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Goals and equipment */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="label">What are your main goals? (select multiple)</label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {formData.niche === 'fitness' && ['Lose weight', 'Build muscle', 'Increase endurance', 'Improve flexibility'].map((goal) => (
                      <label key={goal} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.goals.includes(goal)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, goals: [...formData.goals, goal] });
                            } else {
                              setFormData({ ...formData, goals: formData.goals.filter(g => g !== goal) });
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span>{goal}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">What equipment do you have?</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {formData.niche === 'fitness' && ['Dumbbells', 'Barbell', 'Resistance bands', 'Pull-up bar', 'Yoga mat', 'None'].map((equipment) => (
                      <label key={equipment} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.equipment.includes(equipment)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, equipment: [...formData.equipment, equipment] });
                            } else {
                              setFormData({ ...formData, equipment: formData.equipment.filter(eq => eq !== equipment) });
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{equipment}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Availability */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="label">How many days per week?</label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={formData.daysPerWeek}
                    onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>1 day</span>
                    <span className="font-bold text-primary">{formData.daysPerWeek} days</span>
                    <span>7 days</span>
                  </div>
                </div>

                <div>
                  <label className="label">How many minutes per day?</label>
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="15"
                    value={formData.minutesPerDay}
                    onChange={(e) => setFormData({ ...formData, minutesPerDay: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>15 min</span>
                    <span className="font-bold text-primary">{formData.minutesPerDay} minutes</span>
                    <span>120 min</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && (!formData.niche || !formData.level)) ||
                  (currentStep === 2 && formData.goals.length === 0)
                }
                isLoading={createProfileMutation.isPending}
              >
                {currentStep === 3 ? 'Complete Setup' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
