import { MessageCircle, Phone, Video, Image, Users, Bell, Code, Database, Layout } from 'lucide-react';

const About = () => {
  const features = [
    { icon: MessageCircle, name: 'Real-time messaging' },
    { icon: Phone, name: 'Voice calling' },
    { icon: Video, name: 'Video calling' },
    { icon: Image, name: 'Story sharing' },
    { icon: Users, name: 'Professional networking' },
    { icon: Bell, name: 'Real-time notifications' },
  ];

  const techStack = [
    { icon: Code, name: 'React' },
    { icon: Code, name: 'Node.js' },
    { icon: Database, name: 'MongoDB' },
    { icon: Layout, name: 'Tailwind CSS' },
    { icon: Users, name: 'Clerk Authentication' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Branding Section */}
        <div className="text-center">
          <img src="/LOGOO.png" alt="Chirp Logo" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Chirp</h1>
          <p className="text-lg text-blue-600 dark:text-blue-400 mt-2">Share ideas, grow your network</p>
        </div>

        {/* About Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">About</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Chirp is a modern social media platform that allows you to connect with professionals, 
            join conversations, and showcase your work. Built with love by passionate developers.
          </p>
        </div>

        {/* Developer Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Developer</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              FK
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Fahad Khan</h3>
              <p className="text-blue-600 dark:text-blue-400">@cybe4sent1nel</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Full Stack Developer</p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Features</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-700 dark:text-gray-200 text-sm">{feature.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Technology Stack</h2>
          <div className="flex flex-wrap gap-3">
            {techStack.map((tech, index) => (
              <div key={index} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                <tech.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
          <p>Version 1.0.0</p>
          <p className="mt-1">© {new Date().getFullYear()} Chirp. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default About;
