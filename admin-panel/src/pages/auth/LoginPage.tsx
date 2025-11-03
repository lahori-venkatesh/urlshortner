import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
  mfaCode?: string;
}

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, data.mfaCode);
    } catch (error: any) {
      if (error.message === 'MFA_REQUIRED') {
        setRequiresMfa(true);
        toast.success('Please enter your MFA code');
      } else {
        setError('root', {
          message: error.response?.data?.message || 'Login failed. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
          <span className="text-white font-bold text-2xl">P</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Pebly Admin
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Sign in to your admin account
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <div className="mt-1">
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                autoComplete="email"
                className="input-field"
                placeholder="admin@pebly.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input-field pr-10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
            )}
          </div>

          {/* MFA Code */}
          {requiresMfa && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-4 w-4 mr-1" />
                  MFA Code
                </div>
              </label>
              <div className="mt-1">
                <input
                  {...register('mfaCode', {
                    required: requiresMfa ? 'MFA code is required' : false,
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'MFA code must be 6 digits',
                    },
                  })}
                  type="text"
                  maxLength={6}
                  className="input-field text-center text-lg tracking-widest"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
                {errors.mfaCode && (
                  <p className="mt-1 text-sm text-error-600">{errors.mfaCode.message}</p>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Enter the 6-digit code from your authenticator app
              </p>
            </motion.div>
          )}

          {/* Error Message */}
          {errors.root && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-md bg-error-50 dark:bg-error-900/20 p-4"
            >
              <p className="text-sm text-error-800 dark:text-error-200">
                {errors.root.message}
              </p>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            className="w-full"
          >
            {requiresMfa ? 'Verify & Sign In' : 'Sign In'}
          </Button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            <ShieldCheckIcon className="h-4 w-4 mr-1" />
            Secured with enterprise-grade authentication
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default LoginPage;