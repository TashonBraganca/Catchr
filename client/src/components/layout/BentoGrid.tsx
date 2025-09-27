import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { BentoCard } from '@/components/ui';
import { cn } from '@/lib/utils';

// Grid Layout Configurations
type GridLayout = 
  | 'dashboard' 
  | 'thoughts' 
  | 'analytics' 
  | 'masonry' 
  | 'uniform'
  | 'featured';

interface BentoGridProps extends Omit<HTMLMotionProps<'div'>, 'layout'> {
  layout?: GridLayout;
  children?: React.ReactNode;
  className?: string;
  animate?: boolean;
}

const gridLayouts = {
  dashboard: `
    grid-cols-1 md:grid-cols-6 lg:grid-cols-8 
    auto-rows-[120px] gap-4
  `,
  thoughts: `
    grid-cols-1 md:grid-cols-4 lg:grid-cols-6 
    auto-rows-[100px] gap-3
  `,
  analytics: `
    grid-cols-1 md:grid-cols-4 lg:grid-cols-8 
    auto-rows-[80px] gap-4
  `,
  masonry: `
    grid-cols-1 md:grid-cols-3 lg:grid-cols-4 
    gap-4
  `,
  uniform: `
    grid-cols-1 md:grid-cols-2 lg:grid-cols-3 
    gap-6
  `,
  featured: `
    grid-cols-1 md:grid-cols-4 lg:grid-cols-6 
    auto-rows-[140px] gap-4
  `
};

export const BentoGrid: React.FC<BentoGridProps> = ({ 
  layout = 'dashboard',
  children,
  className,
  animate = true,
  ...props 
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  return (
    <motion.div
      className={cn(
        'grid w-full',
        gridLayouts[layout],
        className
      )}
      variants={animate ? containerVariants : undefined}
      initial={animate ? "hidden" : undefined}
      animate={animate ? "visible" : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Pre-configured bento items with specific layouts
interface BentoItemProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  span?: number;
  rowSpan?: number;
  children?: React.ReactNode;
  className?: string;
  variant?: 'glass' | 'gradient' | 'minimal';
  interactive?: boolean;
}

const sizeClasses = {
  sm: 'md:col-span-1 md:row-span-1',
  md: 'md:col-span-2 md:row-span-1', 
  lg: 'md:col-span-2 md:row-span-2',
  xl: 'md:col-span-3 md:row-span-2',
  full: 'md:col-span-full md:row-span-1'
};

export const BentoItem: React.FC<BentoItemProps> = ({
  size = 'md',
  span,
  rowSpan,
  children,
  className,
  variant = 'glass',
  interactive = true
}) => {
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const spanClass = span ? `md:col-span-${span}` : '';
  const rowSpanClass = rowSpan ? `md:row-span-${rowSpan}` : '';

  return (
    <motion.div
      className={cn(
        sizeClasses[size],
        spanClass,
        rowSpanClass,
        className
      )}
      variants={itemVariants}
    >
      <BentoCard 
        variant={variant}
        interactive={interactive}
        className="h-full w-full"
      >
        {children}
      </BentoCard>
    </motion.div>
  );
};

// Specialized Dashboard Layout Components
export const DashboardGrid: React.FC<{ children?: React.ReactNode }> = ({ 
  children 
}) => (
  <BentoGrid layout="dashboard" className="p-6">
    {children}
  </BentoGrid>
);

export const ThoughtsGrid: React.FC<{ children?: React.ReactNode }> = ({ 
  children 
}) => (
  <BentoGrid layout="thoughts" className="p-4">
    {children}
  </BentoGrid>
);

// Quick Action Card for common dashboard items
interface QuickActionCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  size?: BentoItemProps['size'];
  gradient?: boolean;
  count?: number;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
  size = 'md',
  gradient = false,
  count
}) => (
  <BentoItem 
    size={size} 
    variant={gradient ? 'gradient' : 'glass'}
    className="cursor-pointer"
  >
    <motion.div
      onClick={onClick}
      className="h-full p-4 flex flex-col justify-between"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start justify-between">
        <motion.div
          className="text-orange-400 group-hover:text-orange-300 transition-colors"
          whileHover={{ rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          {icon}
        </motion.div>
        {count !== undefined && (
          <motion.div
            className="px-2 py-1 bg-white/10 rounded-full text-xs font-medium text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {count}
          </motion.div>
        )}
      </div>
      
      <div>
        <h3 className="font-semibold text-white group-hover:text-orange-300 transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-white/70 mt-1 group-hover:text-white/90 transition-colors">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  </BentoItem>
);

// Stat Card for displaying metrics
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  size?: BentoItemProps['size'];
  chart?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  size = 'md',
  chart
}) => (
  <BentoItem size={size}>
    <div className="h-full p-4 flex flex-col">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-white/70 mb-2">
          {title}
        </h3>
        <motion.div
          className="text-2xl font-bold text-white mb-2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {value}
        </motion.div>
        
        {change && (
          <motion.div
            className={cn(
              "flex items-center text-xs font-medium",
              change.positive ? "text-green-400" : "text-red-400"
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="mr-1">
              {change.positive ? '↑' : '↓'} {Math.abs(change.value)}%
            </span>
            <span className="text-white/60">{change.label}</span>
          </motion.div>
        )}
      </div>
      
      {chart && (
        <div className="mt-4 h-16 opacity-60">
          {chart}
        </div>
      )}
    </div>
  </BentoItem>
);

// Thought Preview Card
interface ThoughtCardProps {
  thought: {
    id: string;
    content: string;
    category?: string;
    createdAt: Date;
    tags?: string[];
  };
  size?: BentoItemProps['size'];
  onClick?: (id: string) => void;
}

export const ThoughtCard: React.FC<ThoughtCardProps> = ({
  thought,
  size = 'md',
  onClick
}) => (
  <BentoItem size={size} className="cursor-pointer">
    <motion.div
      className="h-full p-4 flex flex-col justify-between"
      onClick={() => onClick?.(thought.id)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div>
        <p className="text-white text-sm line-clamp-3 mb-3">
          {thought.content}
        </p>
        
        {thought.tags && thought.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {thought.tags.slice(0, 2).map((tag, index) => (
              <span
                key={tag}
                className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {thought.tags.length > 2 && (
              <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                +{thought.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{thought.category || 'Uncategorized'}</span>
        <span>{thought.createdAt.toLocaleDateString()}</span>
      </div>
    </motion.div>
  </BentoItem>
);

export default BentoGrid;