'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, CheckCircle, Circle, Star, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);

  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan', params.id],
    queryFn: async () => {
      const response = await apiClient.plans.getById(params.id as string);
      return response.data;
    },
  });

  const completeSessionMutation = useMutation({
    mutationFn: async ({ sessionId, feedback }: any) => {
      const response = await apiClient.plans.completeSession(
        params.id as string,
        sessionId,
        feedback
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan', params.id] });
      setSelectedSession(null);
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (!plan) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Plan not found</p>
        </div>
      </MainLayout>
    );
  }

  const handleCompleteSession = () => {
    if (!selectedSession) return;

    completeSessionMutation.mutate({
      sessionId: selectedSession.id,
      feedback: {
        rating: feedbackRating,
        difficulty: 5,
        notes: '',
      },
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{plan.name}</h1>
          {plan.rationale && (
            <p className="text-gray-600 mt-2">{plan.rationale}</p>
          )}
        </div>

        {/* Plan info */}
        <Card>
          <CardContent className="py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium text-lg capitalize">{plan.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium text-lg">{plan.weeks} weeks</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  plan.status === 'active' ? 'bg-green-100 text-green-800' :
                  plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {plan.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Started</p>
                <p className="font-medium text-lg">{new Date(plan.startDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly schedule */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Schedule</h2>
          <div className="space-y-6">
            {plan.days?.slice(0, 7).map((day: any, index: number) => (
              <Card key={day.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Day {index + 1} - {day.weekday}
                      </CardTitle>
                      <CardDescription>
                        {new Date(day.date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {day.isRestDay && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Rest Day
                      </span>
                    )}
                  </div>
                </CardHeader>

                {!day.isRestDay && day.sessions?.length > 0 && (
                  <CardContent>
                    <div className="space-y-4">
                      {day.sessions.map((session: any) => (
                        <div
                          key={session.id}
                          className={`p-4 border-2 rounded-lg transition ${
                            session.status === 'completed'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-primary'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {session.status === 'completed' ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-400" />
                                )}
                                <h4 className="font-semibold">{session.title}</h4>
                              </div>
                              {session.description && (
                                <p className="text-sm text-gray-600 mb-2">{session.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>⏱️ {session.totalDuration} min</span>
                                <span className="capitalize">💪 {session.intensity}</span>
                                {session.exercises && (
                                  <span>📋 {JSON.parse(session.exercises).length} exercises</span>
                                )}
                              </div>
                            </div>
                            {session.status !== 'completed' && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedSession(session)}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Complete session modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Complete Session</CardTitle>
              <CardDescription>{selectedSession.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="label">How was your session?</label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFeedbackRating(rating)}
                      className="transition"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          rating <= feedbackRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedSession(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCompleteSession}
                  isLoading={completeSessionMutation.isPending}
                >
                  Mark Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
