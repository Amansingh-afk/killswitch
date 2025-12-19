import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  previousValue: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value: controlledValue, onValueChange, children, className, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || '');
    const [previousValue, setPreviousValue] = React.useState(defaultValue || '');
    const previousValueRef = React.useRef(defaultValue || '');
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;

    // Track previous value for controlled components
    React.useEffect(() => {
      if (isControlled) {
        setPreviousValue(previousValueRef.current);
        previousValueRef.current = controlledValue || '';
      }
    }, [isControlled, controlledValue]);

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        setPreviousValue(value);
        previousValueRef.current = value;
        if (!isControlled) {
          setUncontrolledValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [isControlled, onValueChange, value]
    );

    return (
      <TabsContext.Provider value={{ value, previousValue, onValueChange: handleValueChange }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-lg bg-muted/30 backdrop-blur-sm border border-border/50 p-1 text-foreground shadow-sm',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error('TabsTrigger must be used within Tabs');
    }

    const isActive = context.value === value;
    const [wasActive, setWasActive] = React.useState(isActive);

    React.useEffect(() => {
      if (isActive && !wasActive) {
        setWasActive(true);
      } else if (!isActive) {
        setWasActive(false);
      }
    }, [isActive, wasActive]);

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={() => context.onValueChange(value)}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-4 py-1.5 text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          isActive
            ? 'bg-primary text-primary-foreground border-b-2 border-primary shadow-md shadow-primary/20 font-semibold scale-105 animate-tab-trigger'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50',
          className
        )}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (!context) {
      throw new Error('TabsContent must be used within Tabs');
    }

    const isActive = context.value === value;
    const [animationClass, setAnimationClass] = React.useState('');

    React.useEffect(() => {
      if (isActive) {
        // Determine slide direction based on tab order
        const tabOrder = ['features', 'how-it-works', 'security'];
        const currentIndex = tabOrder.indexOf(value);
        const previousIndex = tabOrder.indexOf(context.previousValue);
        
        if (previousIndex !== -1 && currentIndex !== -1) {
          if (currentIndex > previousIndex) {
            setAnimationClass('animate-slide-in-right');
          } else if (currentIndex < previousIndex) {
            setAnimationClass('animate-slide-in-left');
          } else {
            setAnimationClass('animate-slide-in-up');
          }
        } else {
          setAnimationClass('animate-slide-in-up');
        }
      }
    }, [isActive, value, context.previousValue]);

    if (!isActive) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          animationClass,
          className
        )}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };

