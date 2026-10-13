import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
const variants = cva('inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:pointer-events-none disabled:opacity-50', { variants: { variant: { default: 'bg-[#173c32] text-white hover:bg-[#285746]', outline: 'border border-[#d9dfdb] bg-white hover:bg-[#f3f5f2]', ghost: 'hover:bg-[#edf1ec]', destructive: 'bg-red-50 text-red-700 hover:bg-red-100' }, size: { default: 'h-11 px-5', sm: 'h-9 px-3', icon: 'size-10' } }, defaultVariants: { variant: 'default', size: 'default' } });
export function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<'button'> & VariantProps<typeof variants> & { asChild?: boolean }) { const Comp = asChild ? Slot : 'button'; return <Comp className={cn(variants({ variant, size, className }))} {...props}/>; }
