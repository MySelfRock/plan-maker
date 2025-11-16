'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Calendar, Plus, TrendingUp, Target, Clock } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.profile.get();
      return response.data;
    },
  });

  // Fetch user plans
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const response = await apiClient.plans.getAll();
      return response.data;
    },
  });

  // Generate plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Profile not found');
      const response = await apiClient.plans.generate({
        profileId: profile.id,
        planType: 'weekly',
        startDate: new Date(),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Complete Your Profile</h2>
          <p className="text-gray-600 mb-6">
            To get started, please complete your profile and preferences.
          </p>
          <Button onClick={() => router.push('/onboarding')}>
            Complete Profile
          </Button>
        </div>
      </MainLayout>
    );
  }

  const activePlan = plans.find((plan: any) => plan.status === 'active');

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
          <p className="text-gray-600 mt-1">Here's your progress overview</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Plans</p>
                  <p className="text-3xl font-bold text-primary mt-2">{plans.filter((p: any) => p.status === 'active').length}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
                  <p className="text-3xl font-bold text-secondary mt-2">0</p>
                </div>
                <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Streak</p>
                  <p className="text-3xl font-bold text-accent mt-2">0 days</p>
                </div>
                <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current plan or CTA */}
        {activePlan ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Current Plan</CardTitle>
              <CardDescription>{activePlan.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium capitalize">{activePlan.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium">{activePlan.weeks} weeks</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Started</p>
                  <p className="font-medium">{new Date(activePlan.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="font-medium">Day 1</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push(`/plans/${activePlan.id}`)}>
                View Plan Details
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="border-2 border-dashed">
            <CardContent className="text-center py-12">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ready to Start?</h3>
              <p className="text-gray-600 mb-6">
                Generate your personalized plan based on your goals and preferences
              </p>
              <Button
                onClick={() => generatePlanMutation.mutate()}
                isLoading={generatePlanMutation.isPending}
              >
                Generate My Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent plans */}
        {plans.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">All Plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan: any) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <CardDescription>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            plan.status === 'active' ? 'bg-green-100 text-green-800' :
                            plan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {plan.status}
                          </span>
                        </CardDescription>
                      </div>
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {plan.weeks} weeks
                      </div>
                      <div>
                        Started {new Date(plan.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/plans/${plan.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
