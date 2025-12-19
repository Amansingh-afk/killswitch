'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import api, { API_ENDPOINTS } from '@/lib/api';
import { Key, Shield, CheckCircle2, AlertCircle, Loader2, Info, Edit } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

const settingsSchema = z.object({
  dhanClientId: z.string().optional(),
  riskThreshold: z.number().min(0).max(100).optional(),
});

const tokenSchema = z.object({
  dhanToken: z.string().min(1, 'Access token is required'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;
type TokenFormData = z.infer<typeof tokenSchema>;

interface UserProfile {
  userId: string;
  email: string;
  dhanClientId: string | null;
  riskThreshold: number;
  killSwitchEnabled: boolean;
}

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsUpdate?: () => void;
}

export function SettingsModal({ open, onOpenChange, onSettingsUpdate }: SettingsModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  const {
    register: registerToken,
    handleSubmit: handleTokenSubmit,
    formState: { errors: tokenErrors },
    reset: resetTokenForm,
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenSchema),
  });

  useEffect(() => {
    if (open) {
      fetchProfile();
    } else {
      reset();
      setError(null);
      setSuccess(null);
      setIsTokenModalOpen(false);
      resetTokenForm();
      setTokenError(null);
      setTokenSuccess(null);
    }
  }, [open, reset, resetTokenForm]);

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const response = await api.get(API_ENDPOINTS.USER.PROFILE);
      if (response.data.success) {
        const user = response.data.user;
        setUserProfile(user);
        if (user.dhanClientId) {
          setValue('dhanClientId', user.dhanClientId);
        }
        if (user.riskThreshold !== undefined) {
          setValue('riskThreshold', user.riskThreshold);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError(err.response?.data?.error || 'Failed to load profile');
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put(API_ENDPOINTS.USER.SETTINGS, data);
      
      if (response.data.success) {
        setSuccess('Settings updated successfully!');
        if (response.data.user) {
          setUserProfile(response.data.user);
        }
        if (onSettingsUpdate) {
          onSettingsUpdate();
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError(err.response?.data?.error || 'Failed to update settings');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onTokenSubmit = async (data: TokenFormData) => {
    setIsTokenLoading(true);
    setTokenError(null);
    setTokenSuccess(null);

    try {
      const response = await api.put(API_ENDPOINTS.USER.SETTINGS, data);
      
      if (response.data.success) {
        setTokenSuccess('Access token updated successfully!');
        if (response.data.user) {
          setUserProfile(response.data.user);
        }
        if (onSettingsUpdate) {
          onSettingsUpdate();
        }
        setTimeout(() => {
          setIsTokenModalOpen(false);
          resetTokenForm();
          setTokenSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setTokenError(err.response?.data?.error || 'Failed to update access token');
      }
    } finally {
      setIsTokenLoading(false);
    }
  };

  const handleOpenTokenModal = () => {
    setIsTokenModalOpen(true);
    setTokenError(null);
    setTokenSuccess(null);
    resetTokenForm();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription>Manage your Dhan API credentials and risk settings</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="flex items-start gap-3 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p>{success}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="dhanToken" className="text-sm font-medium">
                      Dhan Access Token
                    </Label>
                    <Tooltip content="Your Dhan API access token. Get this from your Dhan developer dashboard.">
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dhanToken"
                      type="password"
                      value="••••••••••••••••"
                      disabled
                      className="h-10 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={handleOpenTokenModal}
                      className="h-10"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click Edit to update your access token
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="dhanClientId" className="text-sm font-medium">
                      Dhan Client ID
                    </Label>
                    <Tooltip content="Your unique Dhan client identifier. This is used to authenticate API requests.">
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </Tooltip>
                  </div>
                  <Input
                    id="dhanClientId"
                    type="text"
                    placeholder="Enter your Dhan Client ID"
                    className="h-10"
                    {...register('dhanClientId')}
                  />
                  {userProfile?.dhanClientId && (
                    <p className="text-xs text-muted-foreground">
                      Current: <span className="font-mono font-medium">{userProfile.dhanClientId}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Risk Management Section */}
              <div className="pt-6 border-t">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Risk Management</h3>
                    <p className="text-xs text-muted-foreground">Configure your risk thresholds</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="riskThreshold" className="text-sm font-medium">
                      Risk Threshold (%)
                    </Label>
                    <Tooltip content="Maximum loss percentage before kill switch activates. Default: 2.0%. Range: 0-100%.">
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </Tooltip>
                  </div>
                  <Input
                    id="riskThreshold"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    placeholder="2.0"
                    className="h-10"
                    {...register('riskThreshold', { valueAsNumber: true })}
                  />
                  {errors.riskThreshold && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.riskThreshold.message}
                    </p>
                  )}
                  <div className="space-y-1">
                    {userProfile?.riskThreshold !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Current threshold: <span className="font-medium">{userProfile.riskThreshold}%</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Kill switch triggers automatically when loss exceeds this threshold
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Close
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Token Edit Modal */}
      <Dialog open={isTokenModalOpen} onOpenChange={setIsTokenModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Access Token</DialogTitle>
            <DialogDescription>
              Update your Dhan API access token. Get this from your Dhan developer dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTokenSubmit(onTokenSubmit)} className="space-y-4">
            {tokenError && (
              <div className="flex items-start gap-3 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p>{tokenError}</p>
              </div>
            )}

            {tokenSuccess && (
              <div className="flex items-start gap-3 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p>{tokenSuccess}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="modal-dhanToken" className="text-sm font-medium">
                Dhan Access Token
              </Label>
              <Input
                id="modal-dhanToken"
                type="password"
                placeholder="Enter your Dhan API token"
                className="h-10"
                {...registerToken('dhanToken')}
              />
              {tokenErrors.dhanToken && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {tokenErrors.dhanToken.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsTokenModalOpen(false);
                  resetTokenForm();
                  setTokenError(null);
                  setTokenSuccess(null);
                }}
                disabled={isTokenLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isTokenLoading}>
                {isTokenLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Token'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

