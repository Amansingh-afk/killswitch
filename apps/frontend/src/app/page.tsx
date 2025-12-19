'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, 
  Shield, 
  Activity, 
  Zap, 
  Lock, 
  BarChart3,
  CheckCircle2,
  Clock,
  Target,
  AlertTriangle,
  Sparkles,
  PlayCircle
} from 'lucide-react';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('features');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Gradient Orbs - Layer 1 (furthest back) */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Orb 1 - Top Left */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-gradient-orb-1 bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-pink-500/20 dark:from-blue-400/40 dark:via-purple-400/30 dark:to-pink-400/30" />
        
        {/* Orb 2 - Top Right */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl animate-gradient-orb-2 bg-gradient-to-br from-purple-500/25 via-blue-500/20 to-cyan-500/20 dark:from-purple-400/35 dark:via-blue-400/30 dark:to-cyan-400/30" />
        
        {/* Orb 3 - Bottom Left */}
        <div className="absolute -bottom-40 -left-40 w-[450px] h-[450px] rounded-full blur-3xl animate-gradient-orb-3 bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-indigo-500/15 dark:from-cyan-400/30 dark:via-blue-400/25 dark:to-indigo-400/25" />
        
        {/* Orb 4 - Bottom Right */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl animate-gradient-orb-4 bg-gradient-to-br from-pink-500/30 via-purple-500/20 to-indigo-500/20 dark:from-pink-400/40 dark:via-purple-400/30 dark:to-indigo-400/30" />
        
        {/* Orb 5 - Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl animate-gradient-orb-center bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 dark:from-primary/30 dark:via-primary/20 dark:to-primary/10" />
      </div>

      {/* Animated Grid Background - Layer 2 */}
      <div className="absolute inset-0 z-[1]">
        <div className="absolute inset-0 grid-pattern-animated opacity-40 dark:opacity-30" />
      </div>

      {/* Gradient Mesh Overlay - Layer 3 */}
      <div className="absolute inset-0 z-[2]">
        <div className="absolute inset-0 bg-gradient-mesh animate-gradient-shift opacity-50 dark:opacity-30" />
      </div>

      {/* Subtle Background Overlay - Layer 4 (light overlay to blend) */}
      <div className="absolute inset-0 z-[3]">
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-background/30 to-background/50 dark:from-background/70 dark:via-background/50 dark:to-background/70" />
      </div>

      {/* Shimmer Effect - Layer 5 */}
      <div className="absolute inset-0 z-[4] pointer-events-none">
        <div className="absolute inset-0 bg-shimmer animate-shimmer" />
      </div>

      {/* Content - Layer 6 (on top) */}
      <div className="container mx-auto px-6 py-12 md:py-20 relative z-[5]">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 animate-fade-in-up">
                <Shield className="h-4 w-4" />
                Enterprise-Grade Risk Management
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none">
                <span className="block animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  Protect Your Trading
                </span>
                <span 
                  className="block text-primary animate-fade-in-up mt-2"
                  style={{ animationDelay: '0.2s' }}
                >
                  With Intelligent Automation
                </span>
              </h1>
              <p 
                className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed animate-fade-in-up"
                style={{ animationDelay: '0.3s' }}
              >
                Real-time position monitoring with automatic kill switches. Set your risk threshold, 
                and let our system protect your capital 24/7. Trade with confidence, knowing your 
                losses are always under control.
              </p>
            </div>

            {/* Stats */}
            <div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8 animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">2s</div>
                <div className="text-sm text-muted-foreground mt-1">Monitoring Interval</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground mt-1">Continuous Protection</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">&lt;500ms</div>
                <div className="text-sm text-muted-foreground mt-1">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground mt-1">Automated</div>
              </div>
            </div>

            {/* CTA Button */}
            <div 
              className="flex items-center justify-center pt-4 animate-fade-in-up"
              style={{ animationDelay: '0.5s' }}
            >
              <Link href="/signup" className="group">
                <Button 
                  size="lg" 
                  className="text-base px-10 py-7 h-auto rounded-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    Get Started
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Tabs Section */}
          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
              <p className="text-muted-foreground">Comprehensive risk management in one platform</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-background/80 backdrop-blur-md border-2 border-border/50 shadow-lg p-0">
                  <TabsTrigger value="features" className="relative">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Features
                  </TabsTrigger>
                  <TabsTrigger value="how-it-works" className="relative">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    How It Works
                  </TabsTrigger>
                  <TabsTrigger value="security" className="relative">
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="features" className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Activity className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Real-Time Monitoring</CardTitle>
                      <CardDescription>
                        Continuous position tracking with updates every 2 seconds
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Live MTM calculations
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Position tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Loss percentage monitoring
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Kill Switch Protection</CardTitle>
                      <CardDescription>
                        Automatic position closure when risk threshold is exceeded
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Customizable thresholds
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Instant execution
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Complete position closure
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Risk Analytics</CardTitle>
                      <CardDescription>
                        Comprehensive risk metrics and position insights
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Mark-to-market values
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Invested amount tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Historical audit logs
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Lightning Fast</CardTitle>
                      <CardDescription>
                        Sub-500ms response time for critical operations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          High-performance engine
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Optimized API calls
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Minimal latency
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Customizable Thresholds</CardTitle>
                      <CardDescription>
                        Set your own risk tolerance levels
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Default 2% loss threshold
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Adjustable per user
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Real-time updates
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Daily Reset</CardTitle>
                      <CardDescription>
                        Automatic daily state reset for fresh starts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Automatic daily reset
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          State persistence
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          Historical tracking
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="how-it-works" className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="border-2">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-primary">1</span>
                      </div>
                      <CardTitle>Connect Your Account</CardTitle>
                      <CardDescription>
                        Securely link your Dhan trading account with encrypted credentials
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Your API credentials are encrypted and stored securely. We never store your password.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-primary">2</span>
                      </div>
                      <CardTitle>Set Risk Threshold</CardTitle>
                      <CardDescription>
                        Configure your loss percentage limit (default: 2%)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Customize your risk tolerance. The system monitors your positions 24/7.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-primary">3</span>
                      </div>
                      <CardTitle>Automatic Protection</CardTitle>
                      <CardDescription>
                        System automatically closes positions when threshold is breached
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        When your loss percentage exceeds the threshold, all positions are closed instantly.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-2">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>End-to-End Encryption</CardTitle>
                      <CardDescription>
                        All sensitive data is encrypted at rest and in transit
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Your API tokens and credentials are encrypted using industry-standard algorithms. 
                        We use secure key management practices.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Secure Infrastructure</CardTitle>
                      <CardDescription>
                        Built with security best practices and compliance standards
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Our infrastructure follows security best practices with regular audits, 
                        secure authentication, and data protection measures.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

