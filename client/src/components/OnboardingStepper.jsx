import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronRight, ChevronLeft, CheckCircle2, Loader } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const OnboardingStepper = ({ onComplete, user, token }) => {
    const { getToken } = useAuth();
    const [authToken, setAuthToken] = useState(token);

    useEffect(() => {
        const getAuthToken = async () => {
            const clerkToken = await getToken();
            setAuthToken(clerkToken || token);
        };
        getAuthToken();
    }, [token, getToken]);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        age: '',
        gender: '',
        contentCategories: [],
        appPurpose: [],
        contentTypes: [],
        activeTimePreference: [],
        expectedEngagementLevel: 'regular',
        notificationPreferences: {
            email: true,
            push: true,
            sms: false
        }
    });

    const contentCategoryOptions = ['Tech', 'Entertainment', 'Sports', 'News', 'Gaming', 'Music', 'Fashion', 'Food'];
    const appPurposeOptions = ['Entertainment', 'Learning', 'Networking', 'News', 'Shopping', 'Gaming'];
    const contentTypeOptions = ['Videos', 'Images', 'Articles', 'Polls', 'Reels', 'Live'];
    const activeTimeOptions = ['Morning (6AM-12PM)', 'Afternoon (12PM-6PM)', 'Evening (6PM-12AM)', 'Night (12AM-6AM)'];
    const engagementLevels = ['Casual', 'Regular', 'Frequent', 'Very Frequent'];

    const handleToggleArray = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep(step + 1);
        }
    };

    const handlePrev = () => {
        setStep(step - 1);
    };

    const validateStep = () => {
        switch (step) {
            case 2:
                if (!formData.age || !formData.gender) {
                    toast.error('Please select both age and gender');
                    return false;
                }
                return true;
            case 3:
                if (formData.contentCategories.length === 0) {
                    toast.error('Please select at least one content category');
                    return false;
                }
                return true;
            case 4:
                if (formData.appPurpose.length === 0) {
                    toast.error('Please select at least one purpose');
                    return false;
                }
                return true;
            case 5:
                if (formData.contentTypes.length === 0) {
                    toast.error('Please select at least one content type');
                    return false;
                }
                return true;
            case 6:
                if (formData.activeTimePreference.length === 0) {
                    toast.error('Please select at least one active time');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        try {
            setLoading(true);
            console.log('[ONBOARDING] Submitting with token:', authToken ? 'Present' : 'Missing');
            const response = await api.post('/api/onboarding/save', formData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (response.data.success) {
                toast.success('Onboarding complete! Your personalized feed is ready.');
                onComplete(formData);
                setStep(8);
            } else {
                toast.error(response.data.message || 'Failed to save onboarding data');
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            toast.error('Error saving onboarding data');
        } finally {
            setLoading(false);
        }
    };

    // Progress bar
    const progress = (step / 8) * 100;

    const BackdropContainer = styled.div`
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        padding: 1rem;
        --c: 7px;
        background-color: #fff;
        background-image: radial-gradient(
                circle at 50% 50%,
                #0000 1.5px,
                #fff 0 var(--c),
                #0000 var(--c)
            ),
            radial-gradient(
                circle at 50% 50%,
                #0000 1.5px,
                #fff 0 var(--c),
                #0000 var(--c)
            ),
            radial-gradient(circle at 50% 50%, #f00, #f000 60%),
            radial-gradient(circle at 50% 50%, #ff0, #ff00 60%),
            radial-gradient(circle at 50% 50%, #0f0, #0f00 60%),
            radial-gradient(ellipse at 50% 50%, #00f, #00f0 60%);
        background-size:
            12px 20.7846097px,
            12px 20.7846097px,
            200% 200%,
            200% 200%,
            200% 200%,
            200% 20.7846097px;
        --p: 0px 0px, 6px 10.39230485px;
        background-position:
            var(--p),
            0% 0%,
            0% 0%,
            0% 0%;
        animation:
            wee 40s linear infinite,
            filt 6s linear infinite;

        @keyframes filt {
            0% {
                filter: hue-rotate(0deg);
            }
            to {
                filter: hue-rotate(360deg);
            }
        }

        @keyframes wee {
            0% {
                background-position:
                    var(--p),
                    800% 400%,
                    1000% -400%,
                    -1200% -600%,
                    400% 41.5692194px;
            }
            to {
                background-position:
                    var(--p),
                    0% 0%,
                    0% 0%,
                    0% 0%,
                    0% 0%;
            }
        }
    `;

    return (
        <BackdropContainer>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white">
                    <h1 className="text-3xl font-bold mb-2">Welcome to Chirp!</h1>
                    <p className="text-indigo-100">Let's personalize your experience</p>
                    <div className="mt-4 bg-indigo-400 rounded-full h-2">
                        <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-indigo-100 mt-2">Step {step} of 8</p>
                </div>

                {/* Content */}
                <div className="p-8 min-h-96">
                    {/* Step 1: Welcome */}
                    {step === 1 && (
                        <div className="text-center">
                            <div className="mb-6">
                                <CheckCircle2 className="w-16 h-16 text-indigo-600 mx-auto" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Chirp!</h2>
                            <p className="text-gray-600 mb-4 leading-relaxed">
                                We'd love to know more about you to create a personalized experience. This quick setup will take just 2 minutes.
                            </p>
                            <p className="text-sm text-gray-500 mb-8">
                                We'll use this information to show you content you'll love and connect you with people who share your interests.
                            </p>
                            <button
                                onClick={handleNext}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                            >
                                Get Started →
                            </button>
                        </div>
                    )}

                    {/* Step 2: Age & Gender */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell us about yourself</h2>

                            <div className="mb-6">
                                <label className="block text-gray-700 font-semibold mb-3">Age Group</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['13-17', '18-25', '26-35', '36-50', '50+'].map(age => (
                                        <button
                                            key={age}
                                            onClick={() => setFormData({ ...formData, age })}
                                            className={`p-3 rounded-lg font-medium transition-all ${formData.age === age
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {age}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-3">Gender</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Male', 'Female', 'Other'].map(gender => (
                                        <button
                                            key={gender}
                                            onClick={() => setFormData({ ...formData, gender })}
                                            className={`p-3 rounded-lg font-medium transition-all ${formData.gender === gender
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {gender}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Content Categories */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">What interests you?</h2>
                            <p className="text-gray-600 mb-6">Select your favorite content categories</p>
                            <div className="grid grid-cols-2 gap-3">
                                {contentCategoryOptions.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => handleToggleArray('contentCategories', category)}
                                        className={`p-4 rounded-lg font-medium transition-all text-left ${formData.contentCategories.includes(category)
                                                ? 'bg-indigo-600 text-white border-2 border-indigo-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: App Purpose */}
                    {step === 4 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Why are you here?</h2>
                            <p className="text-gray-600 mb-6">Select what you want to do on Chirp</p>
                            <div className="grid grid-cols-2 gap-3">
                                {appPurposeOptions.map(purpose => (
                                    <button
                                        key={purpose}
                                        onClick={() => handleToggleArray('appPurpose', purpose)}
                                        className={`p-4 rounded-lg font-medium transition-all text-left ${formData.appPurpose.includes(purpose)
                                                ? 'bg-purple-600 text-white border-2 border-purple-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                                            }`}
                                    >
                                        {purpose}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Content Types */}
                    {step === 5 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Content preferences</h2>
                            <p className="text-gray-600 mb-6">What type of content do you prefer?</p>
                            <div className="grid grid-cols-2 gap-3">
                                {contentTypeOptions.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => handleToggleArray('contentTypes', type)}
                                        className={`p-4 rounded-lg font-medium transition-all text-left ${formData.contentTypes.includes(type)
                                                ? 'bg-green-600 text-white border-2 border-green-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Active Time */}
                    {step === 6 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">When are you most active?</h2>
                            <p className="text-gray-600 mb-6">Help us understand your schedule</p>
                            <div className="grid grid-cols-1 gap-3">
                                {activeTimeOptions.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => handleToggleArray('activeTimePreference', time)}
                                        className={`p-4 rounded-lg font-medium transition-all text-left ${formData.activeTimePreference.includes(time)
                                                ? 'bg-amber-600 text-white border-2 border-amber-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                                            }`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 7: Engagement Level & Notifications */}
                    {step === 7 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Final touches</h2>

                            <div className="mb-8">
                                <label className="block text-gray-700 font-semibold mb-3">How active do you want to be?</label>
                                <div className="space-y-2">
                                    {engagementLevels.map(level => (
                                        <button
                                            key={level}
                                            onClick={() => setFormData({ ...formData, expectedEngagementLevel: level.toLowerCase() })}
                                            className={`w-full p-3 rounded-lg font-medium transition-all text-left ${formData.expectedEngagementLevel === level.toLowerCase()
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-semibold mb-3">Notifications</label>
                                <div className="space-y-2">
                                    {[
                                        { key: 'email', label: 'Email notifications' },
                                        { key: 'push', label: 'Push notifications' },
                                        { key: 'sms', label: 'SMS notifications' }
                                    ].map(option => (
                                        <label key={option.key} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                                            <input
                                                type="checkbox"
                                                checked={formData.notificationPreferences[option.key]}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    notificationPreferences: {
                                                        ...formData.notificationPreferences,
                                                        [option.key]: e.target.checked
                                                    }
                                                })}
                                                className="w-4 h-4 text-indigo-600 rounded"
                                            />
                                            <span className="ml-3 text-gray-700 font-medium">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 8: Complete */}
                    {step === 8 && (
                        <div className="text-center py-12">
                            <div className="mb-6">
                                <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">All set!</h2>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Your personalized feed is ready. We've matched your preferences with the best content and creators for you.
                            </p>
                            <button
                                onClick={onComplete}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                            >
                                Start Exploring →
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer with Navigation */}
                {step < 8 && (
                    <div className="bg-gray-50 px-8 py-6 flex items-center justify-between border-t">
                        <button
                            onClick={handlePrev}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${step === 1
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            <ChevronLeft size={20} />
                            Back
                        </button>

                        <button
                            onClick={step === 7 ? handleSubmit : handleNext}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader size={20} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    {step === 7 ? 'Complete' : 'Next'}
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </BackdropContainer>
    );
};

export default OnboardingStepper;
