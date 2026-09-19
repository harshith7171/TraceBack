'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import ActionCards from '@/components/ActionCards';
import MemoryGrid from '@/components/MemoryGrid';
import KnowledgeMapWidget from '@/components/KnowledgeMapWidget';
import RecentActivity from '@/components/RecentActivity';
import SearchResultsView from '@/components/SearchResultsView';

import UploadModal from '@/components/modals/UploadModal';
import AddNoteModal from '@/components/modals/AddNoteModal';
import SaveLinkModal from '@/components/modals/SaveLinkModal';
import ScanTextModal from '@/components/modals/ScanTextModal';
import MemoryDetailModal from '@/components/modals/MemoryDetailModal';
import KnowledgeMapModal from '@/components/modals/KnowledgeMapModal';

import { Memory, SearchResultItem, ActivityLog, UserProfile, NotificationItem } from '@/lib/types';
import {
  fetchMemories,
  fetchActivity,
  searchMemories,
  toggleFavorite as apiToggleFavorite,
  deleteMemory as apiDeleteMemory,
  fetchUserProfile,
  fetchNotifications,
} from '@/lib/api';

export default function Home() {
  // Navigation & View States
  const [currentTab, setCurrentTab] = useState('home');
  const [activeFilter, setActiveFilter] = useState('all');

  // User & Notification States
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Data States
  const [memories, setMemories] = useState<Memory[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[] | null>(null);

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isSaveLinkOpen, setIsSaveLinkOpen] = useState(false);
  const [isScanTextOpen, setIsScanTextOpen] = useState(false);
  const [isKnowledgeMapOpen, setIsKnowledgeMapOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  // Load User Profile
  const loadUserProfile = useCallback(async () => {
    try {
      const u = await fetchUserProfile();
      setUser(u);
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  }, []);

  // Load Notifications
  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await fetchNotifications();
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  // Load Memories
  const loadMemories = useCallback(async (filter = activeFilter) => {
    try {
      const isFav = filter === 'favorites';
      const typeParam = filter === 'favorites' ? undefined : filter;
      const data = await fetchMemories(typeParam, isFav);
      setMemories(data);
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  }, [activeFilter]);

  // Load Activities
  const loadActivities = useCallback(async () => {
    try {
      const data = await fetchActivity();
      setActivities(data);
    } catch (err) {
      console.error('Failed to load activity:', err);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
    loadNotifications();
    loadMemories();
    loadActivities();
  }, [loadUserProfile, loadNotifications, loadMemories, loadActivities]);

  // Handle Tab Switch
  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'home') {
      setSearchResults(null);
      setSearchQuery('');
      setActiveFilter('all');
      loadMemories('all');
    } else if (tab === 'search') {
      // Focus on search or keep results
      if (!searchResults) {
        handleSearch('internship deadline');
      }
    } else if (tab === 'library') {
      setSearchResults(null);
      setActiveFilter('all');
      loadMemories('all');
    } else if (tab === 'favorites') {
      setSearchResults(null);
      setActiveFilter('favorites');
      loadMemories('favorites');
    } else if (tab === 'knowledge-map') {
      setIsKnowledgeMapOpen(true);
    }
  };

  // Handle Filter Switch
  const handleSelectFilter = (filterId: string) => {
    setActiveFilter(filterId);
    setSearchResults(null);
    loadMemories(filterId);
  };

  // Perform Natural Language Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      const filterArg = activeFilter !== 'all' ? activeFilter : undefined;
      const res = await searchMemories(query, filterArg);
      setSearchResults(res.results);
      loadActivities(); // Refresh activity log with search
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await apiToggleFavorite(id);
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_favorite: res.is_favorite } : m))
      );
      if (selectedMemory && selectedMemory.id === id) {
        setSelectedMemory({ ...selectedMemory, is_favorite: res.is_favorite });
      }
      if (searchResults) {
        setSearchResults((prev) =>
          prev
            ? prev.map((item) =>
                item.memory.id === id
                  ? { ...item, memory: { ...item.memory, is_favorite: res.is_favorite } }
                  : item
              )
            : null
        );
      }
    } catch (err) {
      console.error('Toggle favorite failed:', err);
    }
  };

  // Delete Memory
  const handleDelete = async (id: string) => {
    try {
      await apiDeleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      if (searchResults) {
        setSearchResults((prev) => (prev ? prev.filter((item) => item.memory.id !== id) : null));
      }
      loadActivities();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // On Memory Created Success
  const handleMemoryCreated = (newMem: Memory) => {
    setMemories((prev) => [newMem, ...prev]);
    loadActivities();
    setSelectedMemory(newMem);
  };

  const favoritesCount = memories.filter((m) => m.is_favorite).length;

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex font-sans text-slate-800">
      {/* 1. Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        favoritesCount={favoritesCount}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          user={user}
          notifications={notifications}
          onNotificationsUpdated={loadNotifications}
        />

        {/* Content Container (Center Dashboard + Right Sidebar) */}
        <main className="flex-1 px-8 pb-10 max-w-7xl w-full mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Center Area (8 cols on XL) */}
            <div className="xl:col-span-8 space-y-6">
              {/* If search results are active, show search view, else normal dashboard */}
              {searchResults !== null ? (
                <SearchResultsView
                  query={searchQuery}
                  results={searchResults}
                  onBack={() => {
                    setSearchResults(null);
                    setSearchQuery('');
                  }}
                  onOpenDetail={(mem) => setSelectedMemory(mem)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ) : (
                <>
                  {/* Hero Banner with Search Bar & Suggested Query Chips */}
                  <HeroBanner
                    onSearch={handleSearch}
                    initialQuery={searchQuery}
                  />

                  {/* 4 Action Cards */}
                  <ActionCards
                    onUploadFile={() => setIsUploadOpen(true)}
                    onAddNote={() => setIsAddNoteOpen(true)}
                    onSaveLink={() => setIsSaveLinkOpen(true)}
                    onScanText={() => setIsScanTextOpen(true)}
                  />

                  {/* Recent Memories Grid + Quick Filters */}
                  <MemoryGrid
                    memories={memories}
                    activeFilter={activeFilter}
                    onSelectFilter={handleSelectFilter}
                    onOpenDetail={(mem) => setSelectedMemory(mem)}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDelete}
                    onViewAll={() => handleSelectTab('library')}
                  />
                </>
              )}
            </div>

            {/* Right Sidebar (4 cols on XL) */}
            <div className="xl:col-span-4 space-y-6">
              {/* Knowledge Map Radial Graph Widget */}
              <KnowledgeMapWidget
                onOpenFullMap={() => setIsKnowledgeMapOpen(true)}
                onSelectNode={(label) => handleSearch(label)}
              />

              {/* Recent Activity Timeline & Bottom Tip */}
              <RecentActivity
                activities={activities}
                onViewAll={() => handleSelectTab('library')}
                onActivityClick={(act) => {
                  if (act.action_type === 'search') {
                    handleSearch(act.target.replace(/"/g, ''));
                  }
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleMemoryCreated}
      />

      <AddNoteModal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
        onSuccess={handleMemoryCreated}
      />

      <SaveLinkModal
        isOpen={isSaveLinkOpen}
        onClose={() => setIsSaveLinkOpen(false)}
        onSuccess={handleMemoryCreated}
      />

      <ScanTextModal
        isOpen={isScanTextOpen}
        onClose={() => setIsScanTextOpen(false)}
        onSuccess={handleMemoryCreated}
      />

      <MemoryDetailModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
        onSelectMemory={(mem) => setSelectedMemory(mem)}
      />

      <KnowledgeMapModal
        isOpen={isKnowledgeMapOpen}
        onClose={() => setIsKnowledgeMapOpen(false)}
        onSelectKeyword={(kw) => handleSearch(kw)}
      />
    </div>
  );
}
