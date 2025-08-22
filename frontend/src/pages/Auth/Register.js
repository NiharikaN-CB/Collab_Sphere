import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User, Building, GraduationCap, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await registerUser(data);
      if (!result.success) {
        setError('root', {
          type: 'manual',
          message: result.error
        });
      }
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const academicLevels = [
    'Undergraduate',
    'Graduate', 
    'PhD',
    'PostDoc',
    'Faculty'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Target className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Collab Sphere</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join thousands of students collaborating on amazing projects
          </p>
        </div>

        {/* Registration Form */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      type="text"
                      className={`input pl-10 ${errors.firstName ? 'input-error' : ''}`}
                      placeholder="First name"
                      {...register('firstName', {
                        required: 'First name is required',
                        minLength: {
                          value: 2,
                          message: 'First name must be at least 2 characters'
                        }
                      })}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-danger-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    className={`input ${errors.lastName ? 'input-error' : ''}`}
                    placeholder="Last name"
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters'
                      }
                    })}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-danger-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter your email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirm your password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Institution Field */}
              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-2">
                  Institution
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="institution"
                    type="text"
                    className={`input pl-10 ${errors.institution ? 'input-error' : ''}`}
                    placeholder="Your university or college"
                    {...register('institution', {
                      required: 'Institution is required',
                      minLength: {
                        value: 2,
                        message: 'Institution must be at least 2 characters'
                      }
                    })}
                  />
                </div>
                {errors.institution && (
                  <p className="mt-1 text-sm text-danger-600">{errors.institution.message}</p>
                )}
              </div>

              {/* Field of Study */}
              <div>
                <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700 mb-2">
                  Field of Study
                </label>
                <input
                  id="fieldOfStudy"
                  type="text"
                  className={`input ${errors.fieldOfStudy ? 'input-error' : ''}`}
                  placeholder="e.g., Computer Science, Biology, Engineering"
                  {...register('fieldOfStudy', {
                    required: 'Field of study is required',
                    minLength: {
                      value: 2,
                      message: 'Field of study must be at least 2 characters'
                    }
                  })}
                />
                {errors.fieldOfStudy && (
                  <p className="mt-1 text-sm text-danger-600">{errors.fieldOfStudy.message}</p>
                )}
              </div>

              {/* Academic Level */}
              <div>
                <label htmlFor="academicLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Level
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="academicLevel"
                    className={`input pl-10 ${errors.academicLevel ? 'input-error' : ''}`}
                    {...register('academicLevel', {
                      required: 'Academic level is required'
                    })}
                  >
                    <option value="">Select academic level</option>
                    {academicLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                {errors.academicLevel && (
                  <p className="mt-1 text-sm text-danger-600">{errors.academicLevel.message}</p>
                )}
              </div>

              {/* Root Error */}
              {errors.root && (
                <div className="rounded-lg bg-danger-50 border border-danger-200 p-3">
                  <p className="text-sm text-danger-600">{errors.root.message}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center items-center"
              >
                {isLoading ? (
                  <>
                    <div className="spinner-sm mr-2" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-white rounded-lg shadow-soft">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              <Target className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Smart Matching</h4>
              <p className="text-xs text-gray-600">Find perfect project partners</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-white rounded-lg shadow-soft">
            <div className="p-2 bg-success-100 rounded-lg mr-3">
              <Building className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Cross-Institution</h4>
              <p className="text-xs text-gray-600">Collaborate with students worldwide</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-white rounded-lg shadow-soft">
            <div className="p-2 bg-warning-100 rounded-lg mr-3">
              <GraduationCap className="h-5 w-5 text-warning-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">Academic Focus</h4>
              <p className="text-xs text-gray-600">Built specifically for students</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
