import { useState } from "react";
import {  Pencil, X, Plus, Trash2, Eye, EyeOff, Briefcase, GraduationCap, Award, Globe, MapPin } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import {updateUser} from '../features/user/userSlice.js'
import api from '../api/axios'

const ExtendedProfileModal = ({ setShowEdit }) => {
  const dispatch = useDispatch();
  const {getToken} = useAuth();
  const user = useSelector((state) => state.user.value);
  
  const [activeTab, setActiveTab] = useState('basic');
  const [editForm, setEditForm] = useState({
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    full_name: user.full_name || '',
    job_title: user.job_title || '',
    company: user.company || '',
    country: user.country || '',
    city: user.city || '',
    website: user.website || '',
    linkedin: user.linkedin || '',
    github: user.github || '',
    twitter: user.twitter || '',
    profile_picture: null,
    cover_photo: null,
    education: user.education || [],
    experience: user.experience || [],
    certificates: user.certificates || [],
    skills: user.skills || [],
  });

  const [privacy, setPrivacy] = useState(user.privacy_settings || {});

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const userData = new FormData();
      const {full_name, username, bio, location, profile_picture, cover_photo, 
             job_title, company, country, city, website, linkedin, github, twitter,
             education, experience, certificates, skills} = editForm;

      userData.append('username', username);
      userData.append('bio', bio);
      userData.append('location', location);
      userData.append('full_name', full_name);
      userData.append('job_title', job_title);
      userData.append('company', company);
      userData.append('country', country);
      userData.append('city', city);
      userData.append('website', website);
      userData.append('linkedin', linkedin);
      userData.append('github', github);
      userData.append('twitter', twitter);
      userData.append('education', JSON.stringify(education));
      userData.append('experience', JSON.stringify(experience));
      userData.append('certificates', JSON.stringify(certificates));
      userData.append('skills', JSON.stringify(skills));
      userData.append('privacy_settings', JSON.stringify(privacy));
      
      profile_picture && userData.append('profile', profile_picture);
      cover_photo && userData.append('cover', cover_photo);

      const token = await getToken();
      dispatch(updateUser({userData, token}));

      setShowEdit(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addEducation = () => {
    setEditForm({
      ...editForm,
      education: [...editForm.education, {degree: '', field: '', school: '', startYear: '', endYear: '', current: false}]
    });
  };

  const updateEducation = (index, field, value) => {
    const newEducation = [...editForm.education];
    newEducation[index][field] = value;
    setEditForm({...editForm, education: newEducation});
  };

  const deleteEducation = (index) => {
    const newEducation = editForm.education.filter((_, i) => i !== index);
    setEditForm({...editForm, education: newEducation});
  };

  const addExperience = () => {
    setEditForm({
      ...editForm,
      experience: [...editForm.experience, {title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: ''}]
    });
  };

  const updateExperience = (index, field, value) => {
    const newExperience = [...editForm.experience];
    newExperience[index][field] = value;
    setEditForm({...editForm, experience: newExperience});
  };

  const deleteExperience = (index) => {
    const newExperience = editForm.experience.filter((_, i) => i !== index);
    setEditForm({...editForm, experience: newExperience});
  };

  const addCertificate = () => {
    setEditForm({
      ...editForm,
      certificates: [...editForm.certificates, {name: '', issuer: '', issueDate: '', credentialId: '', credentialUrl: ''}]
    });
  };

  const updateCertificate = (index, field, value) => {
    const newCertificates = [...editForm.certificates];
    newCertificates[index][field] = value;
    setEditForm({...editForm, certificates: newCertificates});
  };

  const deleteCertificate = (index) => {
    const newCertificates = editForm.certificates.filter((_, i) => i !== index);
    setEditForm({...editForm, certificates: newCertificates});
  };

  const addSkill = (skill) => {
    if (skill && !editForm.skills.includes(skill)) {
      setEditForm({...editForm, skills: [...editForm.skills, skill]});
    }
  };

  const removeSkill = (skill) => {
    setEditForm({...editForm, skills: editForm.skills.filter(s => s !== skill)});
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Pencil },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'privacy', label: 'Privacy', icon: EyeOff },
  ];

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-black/50 flex items-start justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
          <h1 className="text-2xl font-bold text-white">
            Edit Profile
          </h1>
          <button
            onClick={() => setShowEdit(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Profile & Cover Photos */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="profile_picture" className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    id="profile_picture"
                    onChange={(e) => setEditForm({...editForm, profile_picture: e.target.files[0]})}
                  />
                  <label htmlFor="profile_picture" className="cursor-pointer">
                    <div className="group/profile relative">
                      <img
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                        src={
                          editForm.profile_picture
                            ? URL.createObjectURL(editForm.profile_picture)
                            : user.profile_picture || `https://ui-avatars.com/api/?name=${user.full_name}&background=random`
                        }
                        alt="Profile"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover/profile:opacity-100 transition">
                        <Pencil className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </label>
                </div>

                <div>
                  <label htmlFor="cover_photo" className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Photo
                  </label>
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    id="cover_photo"
                    onChange={(e) => setEditForm({...editForm, cover_photo: e.target.files[0]})}
                  />
                  <label htmlFor="cover_photo" className="cursor-pointer">
                    <div className="group/cover relative">
                      <img
                        src={
                          editForm.cover_photo
                            ? URL.createObjectURL(editForm.cover_photo)
                            : user.cover_photo
                        }
                        alt="Cover"
                        className="w-full h-32 rounded-lg bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover/cover:opacity-100 transition">
                        <Pencil className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={editForm.username}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={editForm.country}
                    onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={editForm.city}
                    onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={editForm.location}
                    onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  value={editForm.website}
                  onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm({...editForm, linkedin: e.target.value})}
                    placeholder="linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={editForm.github}
                    onChange={(e) => setEditForm({...editForm, github: e.target.value})}
                    placeholder="github.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={editForm.twitter}
                    onChange={(e) => setEditForm({...editForm, twitter: e.target.value})}
                    placeholder="twitter.com/username"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Professional Tab */}
          {activeTab === 'professional' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={editForm.job_title}
                    onChange={(e) => setEditForm({...editForm, job_title: e.target.value})}
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={editForm.company}
                    onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                    placeholder="Company Name"
                  />
                </div>
              </div>

              {/* Experience Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Experience
                  </button>
                </div>

                <div className="space-y-4">
                  {editForm.experience.map((exp, index) => (
                    <div key={index} className="p-4 border-2 border-gray-200 rounded-lg relative">
                      <button
                        type="button"
                        onClick={() => deleteExperience(index)}
                        className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Job Title"
                          value={exp.title}
                          onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Company"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Location"
                          value={exp.location}
                          onChange={(e) => updateExperience(index, 'location', e.target.value)}
                        />
                        <input
                          type="month"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Start Date"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        />
                        <input
                          type="month"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="End Date"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          disabled={exp.current}
                        />
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`exp-current-${index}`}
                            checked={exp.current}
                            onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor={`exp-current-${index}`} className="text-sm text-gray-700">
                            Current Position
                          </label>
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded-lg mt-4"
                        placeholder="Description"
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-indigo-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Type a skill and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(e.target.value.trim());
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                <button
                  type="button"
                  onClick={addEducation}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Education
                </button>
              </div>

              <div className="space-y-4">
                {editForm.education.map((edu, index) => (
                  <div key={index} className="p-4 border-2 border-gray-200 rounded-lg relative">
                    <button
                      type="button"
                      onClick={() => deleteEducation(index)}
                      className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Degree"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Field of Study"
                        value={edu.field}
                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg md:col-span-2"
                        placeholder="School"
                        value={edu.school}
                        onChange={(e) => updateEducation(index, 'school', e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Start Year"
                        value={edu.startYear}
                        onChange={(e) => updateEducation(index, 'startYear', e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="End Year"
                        value={edu.endYear}
                        onChange={(e) => updateEducation(index, 'endYear', e.target.value)}
                        disabled={edu.current}
                      />
                      <div className="flex items-center md:col-span-2">
                        <input
                          type="checkbox"
                          id={`edu-current-${index}`}
                          checked={edu.current}
                          onChange={(e) => updateEducation(index, 'current', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor={`edu-current-${index}`} className="text-sm text-gray-700">
                          Currently Studying
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Certificates</h3>
                <button
                  type="button"
                  onClick={addCertificate}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Certificate
                </button>
              </div>

              <div className="space-y-4">
                {editForm.certificates.map((cert, index) => (
                  <div key={index} className="p-4 border-2 border-gray-200 rounded-lg relative">
                    <button
                      type="button"
                      onClick={() => deleteCertificate(index)}
                      className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg md:col-span-2"
                        placeholder="Certificate Name"
                        value={cert.name}
                        onChange={(e) => updateCertificate(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Issuer"
                        value={cert.issuer}
                        onChange={(e) => updateCertificate(index, 'issuer', e.target.value)}
                      />
                      <input
                        type="month"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Issue Date"
                        value={cert.issueDate}
                        onChange={(e) => updateCertificate(index, 'issueDate', e.target.value)}
                      />
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Credential ID"
                        value={cert.credentialId}
                        onChange={(e) => updateCertificate(index, 'credentialId', e.target.value)}
                      />
                      <input
                        type="url"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        placeholder="Credential URL"
                        value={cert.credentialUrl}
                        onChange={(e) => updateCertificate(index, 'credentialUrl', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
              <p className="text-sm text-gray-600 mb-6">Control what others can see on your profile</p>

              <div className="space-y-4">
                {[
                  { key: 'showEmail', label: 'Show Email' },
                  { key: 'showLocation', label: 'Show Location' },
                  { key: 'showJobTitle', label: 'Show Job Title' },
                  { key: 'showCompany', label: 'Show Company' },
                  { key: 'showEducation', label: 'Show Education' },
                  { key: 'showExperience', label: 'Show Experience' },
                  { key: 'showCertificates', label: 'Show Certificates' },
                  { key: 'showSkills', label: 'Show Skills' },
                  { key: 'showWebsite', label: 'Show Website' },
                  { key: 'showSocialLinks', label: 'Show Social Links' },
                ].map(({key, label}) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {privacy[key] ? <Eye className="w-5 h-5 text-indigo-600" /> : <EyeOff className="w-5 h-5 text-gray-400" />}
                      <span className="font-medium text-gray-900">{label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy[key] !== false}
                        onChange={(e) => setPrivacy({...privacy, [key]: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={() => setShowEdit(false)}
              type="button"
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 transition shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendedProfileModal;
