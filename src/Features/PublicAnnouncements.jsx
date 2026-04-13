import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';

function AnnouncementCard({ item, compact = false }) {
  return (
    <article className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-black/5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gs-accent font-bold">
            {item.createdByRole}
          </p>
          <h3 className="font-serif text-xl text-gs-dark mt-2">{item.title}</h3>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {new Date(item.date).toLocaleDateString()}
        </span>
      </div>
      <p className={`text-gray-600 ${compact ? 'line-clamp-3' : ''}`}>{item.message}</p>
      {item.createdBy && (
        <p className="text-xs text-gray-400 mt-4">
          Posted by {item.createdBy.fullName}
        </p>
      )}
    </article>
  );
}

export function PublicAnnouncementsPreview() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    apiRequest('/announcements')
      .then((data) => {
        setAnnouncements(data.announcements.slice(0, 2));
      })
      .catch(() => {
        setAnnouncements([]);
      });
  }, []);

  return (
    <section id="announcements" className="py-20 bg-gs-cream">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12 border-b border-gray-300 pb-4">
          <div>
            <h3 className="text-gs-accent font-bold uppercase tracking-wider mb-1">Stay Updated</h3>
            <h2 className="font-serif text-4xl text-gs-dark">Latest Announcements</h2>
          </div>
          <Link to="/announcements" className="text-gs-accent font-bold hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {announcements.length > 0 ? (
            announcements.map((item) => <AnnouncementCard key={item.id} item={item} compact />)
          ) : (
            <div className="col-span-full bg-white rounded-2xl p-10 text-center text-gray-500">
              Public announcements will appear here after admin posts them.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function AnnouncementsPageContent() {
  const [announcements, setAnnouncements] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    apiRequest('/announcements')
      .then((data) => setAnnouncements(data.announcements))
      .catch(() => setAnnouncements([]));
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return announcements;
    }

    if (filter === 'public') {
      return announcements.filter((item) => item.visibleToGuests);
    }

    return announcements.filter(
      (item) => item.createdByRole === filter || item.targetRoles.includes(filter)
    );
  }, [announcements, filter]);

  return (
    <section className="py-20 bg-gs-cream">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-300 pb-4 gap-4">
          <div>
            <h3 className="text-gs-accent font-bold uppercase tracking-wider mb-1">Stay Updated</h3>
            <h2 className="font-serif text-4xl text-gs-dark">Live School Announcements</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'public', 'admin', 'teacher'].map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-full border text-sm ${
                  filter === value
                    ? 'bg-gs-dark text-white border-gs-dark'
                    : 'bg-white text-gs-dark border-gs-dark/20'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.length > 0 ? (
            filtered.map((item) => <AnnouncementCard key={item.id} item={item} />)
          ) : (
            <div className="col-span-full bg-white rounded-2xl p-10 text-center text-gray-500">
              No announcements match this filter yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
