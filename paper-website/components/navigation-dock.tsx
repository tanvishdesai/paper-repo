'use client';

import Link from "next/link";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import {
  Sparkles,
  BarChart3,
  Code,
  Key,
  SunMoon,
  GraduationCap
} from 'lucide-react';

import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';
import { ThemeToggle } from "@/components/theme-toggle";

const NavigationDock = () => {
  const { isSignedIn } = useUser();

  const navigationItems = [
    {
      title: 'Home',
      icon: (
        <GraduationCap className='h-full w-full text-neutral-600 dark:text-neutral-300' />
      ),
      href: '/',
    },
    {
      title: 'Explore Graph',
      icon: (
        <Sparkles className='h-full w-full text-neutral-600 dark:text-neutral-300' />
      ),
      href: '/explore',
    },
    {
      title: 'Analytics',
      icon: (
        <BarChart3 className='h-full w-full text-neutral-600 dark:text-neutral-300' />
      ),
      href: '/stats',
    },
    {
      title: 'API Docs',
      icon: (
        <Code className='h-full w-full text-neutral-600 dark:text-neutral-300' />
      ),
      href: '/api-docs',
    },
    ...(isSignedIn ? [{
      title: 'API Keys',
      icon: (
        <Key className='h-full w-full text-neutral-600 dark:text-neutral-300' />
      ),
      href: '/api-keys',
    }] : []),
    {
      title: 'Theme',
      icon: (
        <SunMoon className='h-full w-full text-neutral-600 dark:text-neutral-300' />
      ),
      href: '#',
      component: <ThemeToggle />,
    },
    ...(isSignedIn ? [{
      title: 'Account',
      icon: (
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-full w-full"
            }
          }}
        />
      ),
      href: '#',
    }] : [{
      title: 'Sign In',
      icon: (
        <div className="h-full w-full rounded-full bg-primary flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">SI</span>
        </div>
      ),
      href: '#',
      component: (
        <SignInButton mode="modal">
          <div className="h-full w-full rounded-full bg-primary flex items-center justify-center cursor-pointer">
            <span className="text-xs font-bold text-primary-foreground">SI</span>
          </div>
        </SignInButton>
      ),
    }]),
  ];

  return (
    <div className='fixed bottom-4 left-1/2 max-w-full -translate-x-1/2 z-50'>
      <Dock className='items-end pb-3'>
        {navigationItems.map((item, idx) => (
          <DockItem
            key={idx}
            className='aspect-square rounded-full bg-gray-200 dark:bg-neutral-800'
          >
            <DockLabel>{item.title}</DockLabel>
            <DockIcon>
              {item.component ? (
                item.component
              ) : item.href !== '#' ? (
                <Link href={item.href} className="block h-full w-full">
                  {item.icon}
                </Link>
              ) : (
                item.icon
              )}
            </DockIcon>
          </DockItem>
        ))}
      </Dock>
    </div>
  );
};

export default NavigationDock;
