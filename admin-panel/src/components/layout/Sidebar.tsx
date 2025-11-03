import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  GlobeAltIcon,
  LinkIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useFeature } from '../../context/FeatureFlagContext';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const advancedAnalytics = useFeature('advanced_analytics');

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      permission: 'dashboard:read',
    },
    {
      name: 'Users',
      href: '/users',
      icon: UsersIcon,
      permission: 'users:read',
    },
    {
      name: 'Teams',
      href: '/teams',
      icon: UserGroupIcon,
      permission: 'teams:read',
    },
    {
      name: 'Domains',
      href: '/domains',
      icon: GlobeAltIcon,
      permission: 'domains:read',
    },
    {
      name: 'Links',
      href: '/links',
      icon: LinkIcon,
      permission: 'links:read',
    },
    {
      name: 'Billing',
      href: '/billing',
      icon: CreditCardIcon,
      permission: 'billing:read',
    },
    {
      name: 'Support',
      href: '/support',
      icon: ChatBubbleLeftRightIcon,
      permission: 'support:read',
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      permission: 'analytics:read',
      feature: 'advanced_analytics',
    },
    {
      name: 'System',
      href: '/system',
      icon: ServerIcon,
      permission: 'system:read',
    },
    {
      name: 'Audit Logs',
      href: '/audit',
      icon: ClipboardDocumentListIcon,
      permission: 'audit:read',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: CogIcon,
      permission: 'settings:read',
    },
  ];

  const filteredNavigation = navigation.filter(item => {
    // Check permission
    if (!hasPermission(item.permission.split(':')[0], item.permission.split(':')[1])) {
      return false;
    }
    
    // Check feature flag if specified
    if (item.feature && !useFeature(item.feature)) {
      return false;
    }
    
    return true;
  });

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
            Pebly Admin
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-6 py-6">
        <ul role="list" className="flex flex-1 flex-col gap-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={({ isActive: navIsActive }) => {
                    const active = navIsActive || isActive;
                    return `group flex gap-x-3 rounded-md p-3 text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`;
                  }}
                  onClick={() => setOpen(false)}
                >
                  <item.icon
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* User info */}
        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role?.displayName}
              </p>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;