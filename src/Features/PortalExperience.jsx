import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { apiJson, apiRequest, buildFileUrl, getStoredUser } from '../lib/api';
import { getSocket } from '../lib/socket';
import PushNotificationManager from '../Components/PushNotifications';

function DashboardShell({ user, onLogout, title, subtitle, accentClass = 'bg-gs-dark', children }) {
  const { t } = useTranslation();
  return (
    <div className="bg-white/95 rounded-[28px] shadow-2xl overflow-hidden border border-white/60">
      <div className={`${accentClass} text-white p-6 md:p-8`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=1A3C34&color=fff`}
              className="w-12 md:w-14 rounded-full border-2 border-white/30"
              alt={user.fullName}
            />
            <div>
              <h3 className="font-serif text-2xl md:text-3xl">{title}</h3>
              <p className="text-white/80 text-sm">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs uppercase tracking-[0.25em]">
              {user.role}
            </span>
            <button onClick={onLogout} className="px-4 py-2 rounded-full bg-white text-gs-dark font-bold">
              {t('logout')}
            </button>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-8 bg-gradient-to-br from-white to-[#f8f2eb]">{children}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all ${
        active ? 'bg-gs-accent text-white shadow-lg' : 'bg-white text-gs-dark border border-gs-dark/10'
      }`}
    >
      {children}
    </button>
  );
}

function Panel({ title, subtitle, children, action }) {
  return (
    <section className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-black/5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h4 className="font-serif text-xl md:text-2xl text-gs-dark">{title}</h4>
          {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }) {
  const { t } = useTranslation();
  return <div className="rounded-2xl bg-[#f7f5f1] p-6 md:p-8 text-center text-gray-500 text-sm md:text-base">{text}</div>;
}

function NotificationStack({ notifications, onDismiss }) {
  return (
    <div className="fixed top-24 right-4 z-[90] flex w-[min(92vw,360px)] flex-col gap-3">
      {notifications.map((notification) => (
        <button
          key={notification.id}
          type="button"
          onClick={() => onDismiss(notification.id)}
          className="rounded-2xl border border-gs-dark/10 bg-white/95 p-4 text-left shadow-xl backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${notification.kind === 'comment' ? 'bg-gs-accent' : 'bg-gs-dark'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-400">{notification.tag}</p>
              <p className="mt-1 font-bold text-gs-dark">{notification.title}</p>
              <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function useRealtimeNotifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const audioRef = useRef(null);
  const audioTimeoutRef = useRef(null);

  const dismissNotification = (id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  const playSoftAlert = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        return;
      }

      if (!audioRef.current) {
        audioRef.current = new AudioContextClass();
      }

      const context = audioRef.current;

      if (context.state === 'suspended') {
        context.resume().catch(() => {});
      }

      if (audioTimeoutRef.current) {
        window.clearTimeout(audioTimeoutRef.current);
      }

      const start = context.currentTime;
      const gain = context.createGain();
      gain.gain.value = 0.012;
      gain.connect(context.destination);

      for (let index = 0; index < 5; index += 1) {
        const offset = index * 1.4;
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, start + offset);
        oscillator.connect(gain);
        oscillator.start(start + offset);
        oscillator.stop(start + offset + 0.18);
      }

      audioTimeoutRef.current = window.setTimeout(() => {
        gain.disconnect();
      }, 7000);
    } catch (error) {
      // Ignore audio issues quietly so notifications still appear.
    }
  };

  const pushNotification = ({ kind, title, message, tag }) => {
    const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotifications((current) => [{ id, kind, title, message, tag }, ...current].slice(0, 4));
    playSoftAlert();
    window.setTimeout(() => dismissNotification(id), 7000);
  };

  const notifyAnnouncement = (announcement) => {
    pushNotification({
      kind: 'announcement',
      tag: t('announcementNotificationTag'),
      title: announcement.title,
      message: announcement.message,
    });
  };

  const notifyComment = (comment) => {
    const authorName = comment.author?.fullName || t('newComment');
    pushNotification({
      kind: 'comment',
      tag: t('commentNotificationTag'),
      title: authorName,
      message: comment.text,
    });
  };

  return {
    notifications,
    dismissNotification,
    notifyAnnouncement,
    notifyComment,
  };
}

function AnnouncementList({ announcements }) {
  const { t } = useTranslation();
  if (!announcements.length) {
    return <EmptyState text={t('noAnnouncementsAvailableYet')} />;
  }

  return (
    <div className="space-y-4">
      {announcements.map((item) => (
        <article key={item.id} className="rounded-2xl border border-gs-dark/10 bg-[#fffaf4] p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div className="flex gap-2 flex-wrap mb-2">
                <span className="text-xs uppercase tracking-[0.22em] font-bold text-gs-accent">
                  {item.createdByRole}
                </span>
                {item.visibleToGuests ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-gs-dark text-white">{t('public')}</span>
                ) : null}
                {item.targetRoles.map((role) => (
                  <span key={role} className="text-xs px-2 py-1 rounded-full bg-white border border-gs-dark/10">
                    {role}
                  </span>
                ))}
              </div>
              <h5 className="font-serif text-lg md:text-xl text-gs-dark">{item.title}</h5>
              <p className="text-gray-600 mt-2 text-sm md:text-base">{item.message}</p>
            </div>
            <div className="text-xs md:text-sm text-gray-500 whitespace-nowrap">
              {new Date(item.date).toLocaleDateString()}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function AnnouncementComposer({ allowPublic, onCreated, defaultRoles }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [visibleToGuests, setVisibleToGuests] = useState(false);
  const [targetRoles, setTargetRoles] = useState(defaultRoles);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const roles = ['teacher', 'student', 'parent', 'admin'];

  const toggleRole = (role) => {
    setTargetRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const data = await apiJson('/announcements', 'POST', {
        title,
        message,
        date,
        targetRoles,
        visibleToGuests,
      });

      onCreated(data.announcement);
      setTitle('');
      setMessage('');
      setDate('');
      setVisibleToGuests(false);
      setTargetRoles(defaultRoles);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error ? <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{error}</div> : null}
      <div className="grid md:grid-cols-2 gap-4">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('announcementTitlePlaceholder')} className="rounded-2xl border border-gs-dark/10 px-4 py-3 text-sm md:text-base" required />
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-2xl border border-gs-dark/10 px-4 py-3 text-sm md:text-base" required />
      </div>
      <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t('writeAnnouncementMessage')} className="rounded-2xl border border-gs-dark/10 px-4 py-3 min-h-24 md:min-h-28 text-sm md:text-base" required />
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <button key={role} type="button" onClick={() => toggleRole(role)} disabled={!allowPublic && role === 'admin'} className={`px-3 py-2 rounded-full text-sm ${targetRoles.includes(role) ? 'bg-gs-accent text-white' : 'bg-[#f7f5f1] text-gs-dark border border-gs-dark/10'} ${!allowPublic && role === 'admin' ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {role}
          </button>
        ))}
      </div>
      {allowPublic ? (
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={visibleToGuests} onChange={(event) => setVisibleToGuests(event.target.checked)} />
          {t('showToUnlogged')}
        </label>
      ) : null}
      <button type="submit" disabled={saving} className="px-5 py-3 rounded-2xl bg-gs-dark text-white font-bold">
        {saving ? t('saving') : t('postAnnouncementBtn')}
      </button>
    </form>
  );
}

function UserRoleManager({ users, currentUserId, deletingUserId, onDeleteUser }) {
  const { t } = useTranslation();
  if (!users.length) {
    return <EmptyState text={t('noUsersFound')} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm text-gray-500 border-b border-gs-dark/10">
            <th className="pb-3">{t('user')}</th>
            <th className="pb-3">Username</th>
            <th className="pb-3">{t('email')}</th>
            <th className="pb-3">{t('role')}</th>
            <th className="pb-3 text-right">{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((item) => (
            <tr key={item.id} className="border-b border-gs-dark/5">
              <td className="py-4 font-bold text-gs-dark">{item.fullName}</td>
              <td className="py-4 text-gray-500">{item.username || '-'}</td>
              <td className="py-4 text-gray-500">{item.email}</td>
              <td className="py-4">
                <span className="inline-flex rounded-full border border-gs-dark/10 px-3 md:px-4 py-2 text-sm bg-[#f7f5f1] text-gs-dark">
                  {t(item.role)}
                </span>
              </td>
              <td className="py-4 text-right">
                <button
                  type="button"
                  onClick={() => onDeleteUser(item)}
                  disabled={deletingUserId === item.id || item.id === currentUserId}
                  className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingUserId === item.id ? t('deleting') : t('delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskCard({ task, comments, canComment, onComment, canDelete, onDelete, deletingTaskId }) {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');
  const taskComments = comments.filter((item) => (typeof item.task === 'string' ? item.task === task.id : item.task?.id === task.id));

  return (
    <article className="rounded-3xl bg-[#fffaf4] border border-gs-dark/10 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h5 className="font-serif text-xl md:text-2xl text-gs-dark">{task.title}</h5>
          <p className="text-gray-600 mt-2 text-sm md:text-base">{task.description}</p>
          {task.firstComment ? <div className="mt-4 p-3 md:p-4 rounded-2xl bg-white border border-gs-dark/5"><p className="text-xs uppercase tracking-[0.2em] text-gs-accent font-bold mb-2">{t('firstComment')}</p><p className="text-gray-600 text-sm md:text-base">{task.firstComment}</p></div> : null}
          <div className="text-sm text-gray-500 mt-4">{t('teacherName')}: {task.teacher?.fullName || 'Unknown'}</div>
        </div>
        <div className="flex flex-col gap-3 min-w-40 md:min-w-44">
          {task.fileUrl ? <a href={buildFileUrl(task.fileUrl)} target="_blank" rel="noreferrer" className="px-4 py-3 rounded-2xl bg-gs-dark text-white text-center font-bold text-sm md:text-base">{t('downloadFile')} {task.fileName || t('fileName')}</a> : <div className="px-4 py-3 rounded-2xl bg-white border border-gs-dark/10 text-sm text-gray-500">{t('noFileUploaded')}</div>}
          <div className="text-xs text-gray-500">{new Date(task.createdAt).toLocaleString()}</div>
          {canDelete ? (
            <button
              type="button"
              onClick={() => onDelete(task)}
              disabled={deletingTaskId === task.id}
              className="px-4 py-3 rounded-2xl bg-red-600 text-white text-center font-bold text-sm md:text-base transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deletingTaskId === task.id ? t('deleting') : t('deleteTask')}
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-6">
        <h6 className="font-bold text-gs-dark mb-3">{t('comments')}</h6>
        <div className="space-y-3">
          {taskComments.length ? taskComments.map((comment) => (
            <div key={comment.id} className="rounded-2xl bg-white p-3 md:p-4 border border-gs-dark/5">
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-bold text-gs-dark">{comment.author?.fullName} ({comment.author?.role})</span>
                <span className="text-gray-400 text-xs">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-gray-600 mt-2 text-sm">{comment.text}</p>
            </div>
          )) : <EmptyState text={t('noCommentsForTask')} />}
        </div>
      </div>
      {canComment ? (
        <form onSubmit={(event) => { event.preventDefault(); if (!commentText.trim()) return; onComment(task.id, commentText); setCommentText(''); }} className="mt-6 flex flex-col md:flex-row gap-2 md:gap-3">
          <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder={t('writeComment')} className="flex-1 rounded-2xl border border-gs-dark/10 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base" />
          <button type="submit" className="px-4 md:px-5 py-2 md:py-3 rounded-2xl bg-gs-accent text-white font-bold text-sm md:text-base">{t('sendComment')}</button>
        </form>
      ) : null}
    </article>
  );
}

function ChatPanel({ title, people, activePersonId, setActivePersonId, messages, onSend }) {
  const { t } = useTranslation();
  const [messageText, setMessageText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const activePerson = people.find((item) => item.user.id === activePersonId) || null;

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="lg:rounded-3xl lg:bg-[#f7f5f1] lg:p-4 space-y-3">
        <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-gs-dark text-white rounded-xl mb-2">
          <span className="font-bold">{title}</span>
          <i className={`fa-solid fa-chevron-${showSidebar ? 'up' : 'down'}`}></i>
        </button>
        <div className={`${showSidebar ? 'block' : 'hidden'} lg:block`}>
          {people.length ? people.map((item) => (
            <button key={item.user.id} onClick={() => { setActivePersonId(item.user.id); setShowSidebar(false); }} className={`w-full text-left rounded-2xl p-4 ${activePersonId === item.user.id ? 'bg-gs-dark text-white' : 'bg-white text-gs-dark'}`}>
              <div className="font-bold">{item.user.fullName}</div>
              <div className={`text-xs mt-1 truncate ${activePersonId === item.user.id ? 'text-white/70' : 'text-gray-500'}`}>{item.lastMessage?.content || t('noMessagesYet')}</div>
            </button>
          )) : <EmptyState text={`${t('noMessagesYet')} ${title.toLowerCase()}.`} />}
        </div>
      </div>
      <div className="rounded-3xl bg-white border border-gs-dark/10 p-3 sm:p-5">
        {activePerson ? (
          <>
            <div className="border-b border-gs-dark/10 pb-3 mb-4 flex sm:block items-center justify-between">
              <button onClick={() => setShowSidebar(true)} className="lg:hidden text-gs-dark text-sm">
                <i className="fa-solid fa-arrow-left mr-1"></i>
              </button>
              <div>
                <h5 className="font-serif text-xl sm:text-2xl text-gs-dark">{activePerson.user.fullName}</h5>
                <p className="text-xs sm:text-sm text-gray-500">{activePerson.user.email}</p>
              </div>
            </div>
            <div className="space-y-3 max-h-[300px] sm:max-h-[420px] overflow-y-auto pr-2">
              {messages.length ? messages.map((message) => {
                const ownMessage = message.sender?.id === getStoredUser()?.id;
                return (
                  <div key={message.id} className={`max-w-[85%] sm:max-w-[80%] rounded-2xl sm:rounded-3xl px-3 sm:px-4 py-2 sm:py-3 ${ownMessage ? 'ml-auto bg-gs-dark text-white' : 'bg-[#f7f5f1] text-gs-dark'}`}>
                    <div className="text-xs opacity-70 mb-1 hidden sm:block">{message.sender?.fullName}</div>
                    <div className="text-sm sm:text-base">{message.content}</div>
                  </div>
                );
              }) : <EmptyState text={t('noMessagesInConversation')} />}
            </div>
            <form onSubmit={async (event) => { event.preventDefault(); if (!messageText.trim()) return; const text = messageText; setMessageText(''); await onSend(activePerson.user.id, text); }} className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder={t('writeMessage')} className="flex-1 rounded-2xl border border-gs-dark/10 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base" />
              <button type="submit" className="px-4 sm:px-5 py-2 sm:py-3 rounded-2xl bg-gs-accent text-white font-bold text-sm sm:text-base">{t('send')}</button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm sm:text-base">{t('choosePersonConversation')}</p>
            <button onClick={() => setShowSidebar(true)} className="lg:hidden mt-2 text-gs-accent text-sm">{t('viewContacts')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function upsertConversation(current, message, fallbackUser = null) {
  const otherUser =
    fallbackUser ||
    (message.sender?.id === getStoredUser()?.id ? message.recipient : message.sender);

  if (!otherUser?.id) {
    return current;
  }

  const existing = current.find((conversation) => conversation.user.id === otherUser.id);

  if (!existing) {
    return [
      {
        user: otherUser,
        lastMessage: message,
        messages: [message],
      },
      ...current,
    ];
  }

  return current.map((conversation) => {
    if (conversation.user.id !== otherUser.id) {
      return conversation;
    }

    return {
      ...conversation,
      lastMessage: message,
      messages: [...conversation.messages.filter((item) => item.id !== message.id), message],
    };
  });
}

function RoleAnnouncements({ announcements, canPost, allowPublic, onCreated, defaultRoles }) {
  const { t } = useTranslation();
  return (
    <div className="grid xl:grid-cols-[1fr_360px] gap-4 xl:gap-6">
      <Panel title={t('announcements')} subtitle={t('parentAnnouncementsSubtitle')}>
        <AnnouncementList announcements={announcements} />
      </Panel>
      {canPost ? (
        <Panel title={t('postAnnouncement')} subtitle={t('chooseAudience')}>
          <AnnouncementComposer allowPublic={allowPublic} onCreated={onCreated} defaultRoles={defaultRoles} />
        </Panel>
      ) : null}
    </div>
  );
}

function ApplicationManager({ applications, selectedApplicationId, setSelectedApplicationId, onRefresh }) {
  const [emailForm, setEmailForm] = useState({
    subject: '',
    text: '',
    adminNotes: '',
    requestAdditionalForm: false,
    markStatus: '',
    kind: 'custom',
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedApplication =
    applications.find((item) => item.id === selectedApplicationId) || applications[0] || null;

  useEffect(() => {
    if (!selectedApplicationId && applications[0]?.id) {
      setSelectedApplicationId(applications[0].id);
    }
  }, [applications, selectedApplicationId, setSelectedApplicationId]);

  useEffect(() => {
    setEmailForm({
      subject: selectedApplication?.status === 'additional-info-received' ? 'Final application update' : 'Application update',
      text: '',
      adminNotes: selectedApplication?.adminNotes || '',
      requestAdditionalForm: false,
      markStatus: '',
      kind: 'custom',
    });
  }, [selectedApplication?.id]);

  const sendEmail = async (preset) => {
    if (!selectedApplication) {
      return;
    }

    setSending(true);
    setError('');

    try {
      await apiJson(`/applications/${selectedApplication.id}/email`, 'POST', preset || emailForm);
      await onRefresh();
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  };

  if (!applications.length) {
    return <EmptyState text="No student applications yet." />;
  }

  return (
    <div className="grid xl:grid-cols-[320px_1fr] gap-6">
      <div className="space-y-3">
        {applications.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedApplicationId(item.id)}
            className={`w-full rounded-2xl border p-4 text-left ${selectedApplication?.id === item.id ? 'border-gs-accent bg-[#fff4eb]' : 'border-gs-dark/10 bg-white'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-gs-dark">{item.fullName}</p>
                <p className="text-sm text-gray-500 mt-1">{item.studentEmail}</p>
              </div>
              <span className="rounded-full bg-gs-dark px-3 py-1 text-xs text-white">{item.status}</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">{item.tradeOrSection} | {item.level}</p>
            <div className="mt-3 text-gs-accent text-sm font-bold">View</div>
          </button>
        ))}
      </div>

      {selectedApplication ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-gs-dark/10 bg-[#fffaf4] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h5 className="font-serif text-2xl text-gs-dark">{selectedApplication.fullName}</h5>
                <p className="mt-1 text-sm text-gray-500">{selectedApplication.studentEmail}</p>
              </div>
              <span className="rounded-full bg-gs-dark px-4 py-2 text-sm text-white">{selectedApplication.status}</span>
            </div>
            <div className="mt-5 grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div><span className="font-bold text-gs-dark">SDMS:</span> {selectedApplication.sdmsCode}</div>
              <div><span className="font-bold text-gs-dark">Phone:</span> {selectedApplication.phone}</div>
              <div><span className="font-bold text-gs-dark">Trade:</span> {selectedApplication.tradeOrSection}</div>
              <div><span className="font-bold text-gs-dark">Model:</span> {selectedApplication.model}</div>
              <div><span className="font-bold text-gs-dark">Gender:</span> {selectedApplication.gender}</div>
              <div><span className="font-bold text-gs-dark">Level:</span> {selectedApplication.level}</div>
              <div><span className="font-bold text-gs-dark">Last level mark:</span> {selectedApplication.lastLevelMark}</div>
              <div><span className="font-bold text-gs-dark">Date of birth:</span> {new Date(selectedApplication.dateOfBirth).toLocaleDateString()}</div>
            </div>
            <div className="mt-5">
              <p className="font-bold text-gs-dark">Reason to apply</p>
              <p className="mt-2 text-sm text-gray-600">{selectedApplication.reasonToApply || 'No reason added.'}</p>
            </div>
            {selectedApplication.schoolFeesDetails || selectedApplication.additionalInformation || selectedApplication.schoolFeesApprovalFileUrl ? (
              <div className="mt-5 rounded-2xl bg-white p-4 border border-gs-dark/10">
                <p className="font-bold text-gs-dark">Additional form</p>
                <p className="mt-2 text-sm text-gray-600">{selectedApplication.schoolFeesDetails || 'No school fees details yet.'}</p>
                <p className="mt-2 text-sm text-gray-600">{selectedApplication.additionalInformation || 'No extra notes submitted yet.'}</p>
                {selectedApplication.schoolFeesApprovalFileUrl ? (
                  <a href={buildFileUrl(selectedApplication.schoolFeesApprovalFileUrl)} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-gs-dark px-4 py-2 text-sm font-bold text-white">
                    Open fees approval file
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-gs-dark/10 bg-white p-5">
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => sendEmail({
                subject: 'Additional information required',
                text: 'Please complete the additional form so we can continue reviewing your application.',
                requestAdditionalForm: true,
                kind: 'additional-request',
                markStatus: 'additional-info-requested',
                adminNotes: emailForm.adminNotes,
              })} disabled={sending} className="rounded-2xl bg-gs-dark px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                Send additional form link
              </button>
              <button type="button" onClick={() => sendEmail({
                subject: 'Final admission approval',
                text: 'You are officially accepted. Please come to school with your parent or guardian and bring all required documents.',
                requestAdditionalForm: false,
                kind: 'final-approval',
                markStatus: 'accepted',
                adminNotes: emailForm.adminNotes,
              })} disabled={sending} className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                Send final approval
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
              <input value={emailForm.subject} onChange={(event) => setEmailForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Email subject" className="rounded-2xl border border-gs-dark/10 px-4 py-3" />
              <textarea value={emailForm.text} onChange={(event) => setEmailForm((current) => ({ ...current, text: event.target.value }))} placeholder="Write the admin reply here" className="min-h-28 rounded-2xl border border-gs-dark/10 px-4 py-3" />
              <textarea value={emailForm.adminNotes} onChange={(event) => setEmailForm((current) => ({ ...current, adminNotes: event.target.value }))} placeholder="Admin notes" className="min-h-24 rounded-2xl border border-gs-dark/10 px-4 py-3" />
              <select value={emailForm.markStatus} onChange={(event) => setEmailForm((current) => ({ ...current, markStatus: event.target.value }))} className="rounded-2xl border border-gs-dark/10 px-4 py-3">
                <option value="">Keep current status</option>
                <option value="submitted">Submitted</option>
                <option value="additional-info-requested">Additional info requested</option>
                <option value="additional-info-received">Additional info received</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={emailForm.requestAdditionalForm} onChange={(event) => setEmailForm((current) => ({ ...current, requestAdditionalForm: event.target.checked }))} />
                Include additional form link
              </label>
              <button type="button" onClick={() => sendEmail()} disabled={sending} className="rounded-2xl bg-gs-accent px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {sending ? 'Sending...' : 'Send custom email'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdminDashboard({ user, onLogout }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teacherComments, setTeacherComments] = useState([]);
  const [teacherConversations, setTeacherConversations] = useState([]);
  const [parentConversations, setParentConversations] = useState([]);
  const [activeTeacherId, setActiveTeacherId] = useState('');
  const [activeParentId, setActiveParentId] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');
  const [deletingTaskId, setDeletingTaskId] = useState('');
  const { notifications, dismissNotification, notifyAnnouncement, notifyComment } = useRealtimeNotifications();

  const loadAdminData = async () => {
    const [announcementData, userData, applicationData, taskData, commentData, teacherChatData, parentChatData] = await Promise.all([
      apiRequest('/announcements'),
      apiRequest('/users'),
      apiRequest('/applications'),
      apiRequest('/tasks'),
      apiRequest('/tasks/comments/feed'),
      apiRequest('/chat/admin/teacher'),
      apiRequest('/chat/admin/parent'),
    ]);

    setAnnouncements(announcementData.announcements);
    setUsers(userData.users);
    setApplications(applicationData.applications);
    setTasks(taskData.tasks);
    setTeacherComments(commentData.comments);
    setTeacherConversations(teacherChatData.conversations);
    setParentConversations(parentChatData.conversations);
    setActiveTeacherId(teacherChatData.conversations[0]?.user.id || '');
    setActiveParentId(parentChatData.conversations[0]?.user.id || '');
  };

  useEffect(() => {
    loadAdminData().catch(() => {});
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const handleAnnouncement = (announcement) => {
      setAnnouncements((current) => [announcement, ...current.filter((item) => item.id !== announcement.id)]);
      notifyAnnouncement(announcement);
    };
    const handleComment = (comment) => {
      setTeacherComments((current) => [comment, ...current.filter((item) => item.id !== comment.id)]);
      notifyComment(comment);
    };
    const updateConversations = (current, message) => current.map((conversation) => {
      if (conversation.user.id === message.sender?.id || conversation.user.id === message.recipient?.id) {
        const messages = [...conversation.messages.filter((item) => item.id !== message.id), message];
        return { ...conversation, lastMessage: message, messages };
      }
      return conversation;
    });
    const handleChat = (message) => {
      if (message.audience === 'teacher') setTeacherConversations((current) => updateConversations(current, message));
      if (message.audience === 'parent') setParentConversations((current) => updateConversations(current, message));
    };
    socket.on('announcement:created', handleAnnouncement);
    socket.on('task:comment-created', handleComment);
    socket.on('chat:message', handleChat);
    return () => {
      socket.off('announcement:created', handleAnnouncement);
      socket.off('task:comment-created', handleComment);
      socket.off('chat:message', handleChat);
    };
  }, []);

  const handleDeleteUser = async (selectedUser) => {
    if (selectedUser.id === user.id) {
      window.alert(t('cannotDeleteOwnAccount'));
      return;
    }

    if (!window.confirm(t('confirmDeleteUser', { name: selectedUser.fullName }))) {
      return;
    }

    setDeletingUserId(selectedUser.id);

    try {
      await apiRequest(`/users/${selectedUser.id}`, { method: 'DELETE' });
      await loadAdminData();
    } finally {
      setDeletingUserId('');
    }
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(t('confirmDeleteTask', { title: task.title }))) {
      return;
    }

    setDeletingTaskId(task.id);

    try {
      await apiRequest(`/tasks/${task.id}`, { method: 'DELETE' });
      await loadAdminData();
    } finally {
      setDeletingTaskId('');
    }
  };

  const stats = useMemo(() => ({
    totalUsers: users.length,
    teachers: users.filter((item) => item.role === 'teacher').length,
    parents: users.filter((item) => item.role === 'parent').length,
    students: users.filter((item) => item.role === 'student').length,
  }), [users]);

  const handleSendMessage = async (recipientId, content) => {
    const data = await apiJson('/chat/messages', 'POST', { recipientId, content });
    const activeTeacher = teacherConversations.find((item) => item.user.id === recipientId)?.user || null;
    const activeParent = parentConversations.find((item) => item.user.id === recipientId)?.user || null;

    if (data.message.audience === 'teacher') {
      setTeacherConversations((current) => upsertConversation(current, data.message, activeTeacher));
    }

    if (data.message.audience === 'parent') {
      setParentConversations((current) => upsertConversation(current, data.message, activeParent));
    }
  };

  return (
    <>
    <NotificationStack notifications={notifications} onDismiss={dismissNotification} />
    <DashboardShell user={user} onLogout={onLogout} title={t('adminControlRoom')} subtitle={t('adminSubtitle')} accentClass="bg-gs-dark">
      <div className="flex flex-wrap gap-2 mb-6">
        {['overview', 'announcements', 'users', 'applications', 'tasks', 'comments', 'chatFromTeacher', 'chatFromParent'].map((tab) => <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>{t(tab)}</TabButton>)}
      </div>
      {activeTab === 'overview' ? <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">{[[t('totalUsers'), stats.totalUsers], [t('teachers'), stats.teachers], [t('parents'), stats.parents], [t('student'), stats.students]].map(([label, value]) => <div key={label} className="rounded-3xl p-6 bg-white border border-gs-dark/5"><p className="text-sm text-gray-500">{label}</p><p className="text-4xl font-serif text-gs-dark mt-3">{value}</p></div>)}</div> : null}
      {activeTab === 'announcements' ? <RoleAnnouncements announcements={announcements} canPost allowPublic onCreated={(announcement) => setAnnouncements((current) => [announcement, ...current])} defaultRoles={['teacher', 'student', 'parent', 'admin']} /> : null}
      {activeTab === 'users' ? <Panel title={t('userManagement')} subtitle={t('userManagement')}><UserRoleManager users={users} currentUserId={user.id} deletingUserId={deletingUserId} onDeleteUser={handleDeleteUser} /></Panel> : null}
      {activeTab === 'applications' ? <Panel title="Student applications" subtitle="Review submitted students, send reply emails, and request more details."><ApplicationManager applications={applications} selectedApplicationId={selectedApplicationId} setSelectedApplicationId={setSelectedApplicationId} onRefresh={loadAdminData} /></Panel> : null}
      {activeTab === 'tasks' ? <Panel title={t('uploadedTasks')} subtitle={t('adminTaskManagerSubtitle')}><div className="space-y-6">{tasks.length ? tasks.map((task) => <TaskCard key={task.id} task={task} comments={teacherComments} canComment={false} canDelete onDelete={handleDeleteTask} deletingTaskId={deletingTaskId} />) : <EmptyState text={t('noTasksYet')} />}</div></Panel> : null}
      {activeTab === 'comments' ? <Panel title={t('teacherComments')} subtitle={t('teacherCommentsSubtitle')}><div className="space-y-3">{teacherComments.length ? teacherComments.map((item) => <div key={item.id} className="rounded-2xl bg-[#fffaf4] border border-gs-dark/10 p-4"><div className="flex justify-between gap-4"><div><p className="font-bold text-gs-dark">{item.author?.fullName} ({item.author?.role})</p><p className="text-sm text-gray-500 mt-1">{t('task')}: {typeof item.task === 'string' ? item.task : item.task?.title}</p></div><span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</span></div><p className="text-gray-600 mt-3">{item.text}</p></div>) : <EmptyState text={t('noTeacherComments')} />}</div></Panel> : null}
      {activeTab === 'chatFromTeacher' ? <Panel title={t('chatFromTeacher')} subtitle={t('seeWhichTeacher')}><ChatPanel title={t('teachers')} people={teacherConversations} activePersonId={activeTeacherId} setActivePersonId={setActiveTeacherId} messages={teacherConversations.find((item) => item.user.id === activeTeacherId)?.messages || []} onSend={handleSendMessage} /></Panel> : null}
      {activeTab === 'chatFromParent' ? <Panel title={t('chatFromParent')} subtitle={t('liveParentConversations')}><ChatPanel title={t('parents')} people={parentConversations} activePersonId={activeParentId} setActivePersonId={setActiveParentId} messages={parentConversations.find((item) => item.user.id === activeParentId)?.messages || []} onSend={handleSendMessage} /></Panel> : null}
    </DashboardShell>
    </>
  );
}

function TeacherDashboard({ user, onLogout }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', firstComment: '', file: null });
  const [deletingTaskId, setDeletingTaskId] = useState('');
  const { notifications, dismissNotification, notifyAnnouncement, notifyComment } = useRealtimeNotifications();

  const loadTeacherData = async () => {
    const [taskData, announcementData, chatData] = await Promise.all([apiRequest('/tasks'), apiRequest('/announcements'), apiRequest('/chat/with-admin')]);
    setTasks(taskData.tasks);
    const commentGroups = await Promise.all(taskData.tasks.map((task) => apiRequest(`/tasks/${task.id}/comments`)));
    setComments(commentGroups.flatMap((group) => group.comments));
    setAnnouncements(announcementData.announcements);
    setChatMessages(chatData.messages);
    setAdminUser(chatData.admin);
  };

  useEffect(() => { loadTeacherData().catch(() => {}); }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onAnnouncement = (announcement) => {
      if (announcement.targetRoles.includes('teacher') || announcement.visibleToGuests || announcement.createdByRole === 'admin') {
        setAnnouncements((current) => [announcement, ...current.filter((item) => item.id !== announcement.id)]);
        notifyAnnouncement(announcement);
      }
    };
    const onComment = (comment) => {
      setComments((current) => [...current.filter((item) => item.id !== comment.id), comment]);
      notifyComment(comment);
    };
    const onChat = (message) => {
      if (message.audience === 'teacher') {
        setChatMessages((current) => [...current.filter((item) => item.id !== message.id), message]);
      }
    };
    socket.on('announcement:created', onAnnouncement);
    socket.on('task:comment-created', onComment);
    socket.on('chat:message', onChat);
    return () => { socket.off('announcement:created', onAnnouncement); socket.off('task:comment-created', onComment); socket.off('chat:message', onChat); };
  }, []);

  const handleTaskSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('title', taskForm.title);
    formData.append('description', taskForm.description);
    formData.append('firstComment', taskForm.firstComment);
    if (taskForm.file) formData.append('file', taskForm.file);
    await apiRequest('/tasks', { method: 'POST', body: formData });
    setTaskForm({ title: '', description: '', firstComment: '', file: null });
    await loadTeacherData();
  };

  const handleTaskComment = async (taskId, text) => {
    const data = await apiJson(`/tasks/${taskId}/comments`, 'POST', { text });
    setComments((current) => [...current.filter((item) => item.id !== data.comment.id), data.comment]);
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(t('confirmDeleteTask', { title: task.title }))) {
      return;
    }

    setDeletingTaskId(task.id);

    try {
      await apiRequest(`/tasks/${task.id}`, { method: 'DELETE' });
      await loadTeacherData();
    } finally {
      setDeletingTaskId('');
    }
  };

  return (
    <>
    <NotificationStack notifications={notifications} onDismiss={dismissNotification} />
    <DashboardShell user={user} onLogout={onLogout} title={t('teacherWorkspace')} subtitle={t('teacherSubtitle')} accentClass="bg-[linear-gradient(135deg,#1A3C34,#2d5b50)]">
      <div className="flex flex-wrap gap-2 mb-6">{['tasks', 'announcements', 'chat'].map((tab) => <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>{t(tab)}</TabButton>)}</div>
      {activeTab === 'tasks' ? <div className="grid xl:grid-cols-[380px_1fr] gap-6"><Panel title={t('uploadTask')} subtitle={t('uploadTaskFile')}><form onSubmit={handleTaskSubmit} className="grid gap-4"><input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder={t('taskTitle')} className="rounded-2xl border border-gs-dark/10 px-4 py-3" required /><textarea value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} placeholder={t('taskDescription')} className="rounded-2xl border border-gs-dark/10 px-4 py-3 min-h-28" required /><textarea value={taskForm.firstComment} onChange={(event) => setTaskForm((current) => ({ ...current, firstComment: event.target.value }))} placeholder={t('firstCommentForStudents')} className="rounded-2xl border border-gs-dark/10 px-4 py-3 min-h-24" /><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => setTaskForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} className="rounded-2xl border border-gs-dark/10 px-4 py-3" /><div className="text-sm text-gray-500">{t('teachersCanUpload')}</div><button type="submit" className="px-5 py-3 rounded-2xl bg-gs-accent text-white font-bold">{t('uploadTask')}</button></form></Panel><Panel title={t('uploadedTasks')} subtitle={t('uploadedTasksSubtitle')}><div className="space-y-6">{tasks.length ? tasks.map((task) => <TaskCard key={task.id} task={task} comments={comments} canComment onComment={handleTaskComment} canDelete onDelete={handleDeleteTask} deletingTaskId={deletingTaskId} />) : <EmptyState text={t('noTasksYet')} />}</div></Panel></div> : null}
      {activeTab === 'announcements' ? <RoleAnnouncements announcements={announcements} canPost allowPublic={false} onCreated={(announcement) => setAnnouncements((current) => [announcement, ...current])} defaultRoles={['student', 'parent', 'teacher']} /> : null}
      {activeTab === 'chat' ? <Panel title={t('talkToAdmin')} subtitle={t('parentChatSubtitle')}><ChatPanel title="Admin" people={adminUser ? [{ user: adminUser, messages: chatMessages, lastMessage: chatMessages.at(-1) || null }] : []} activePersonId={adminUser?.id || ''} setActivePersonId={() => {}} messages={chatMessages} onSend={async (_, content) => { const data = await apiJson('/chat/messages', 'POST', { content }); setChatMessages((current) => [...current.filter((item) => item.id !== data.message.id), data.message]); }} /></Panel> : null}
    </DashboardShell>
    </>
  );
}

function StudentDashboard({ user, onLogout }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const { notifications, dismissNotification, notifyAnnouncement, notifyComment } = useRealtimeNotifications();

  useEffect(() => {
    Promise.all([apiRequest('/tasks'), apiRequest('/announcements')]).then(async ([taskData, announcementData]) => {
      setTasks(taskData.tasks);
      setAnnouncements(announcementData.announcements);
      const commentGroups = await Promise.all(taskData.tasks.map((task) => apiRequest(`/tasks/${task.id}/comments`)));
      setComments(commentGroups.flatMap((group) => group.comments));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onAnnouncement = (announcement) => {
      if (announcement.targetRoles.includes('student') || announcement.visibleToGuests) {
        setAnnouncements((current) => [announcement, ...current.filter((item) => item.id !== announcement.id)]);
        notifyAnnouncement(announcement);
      }
    };
    const onComment = (comment) => {
      setComments((current) => [...current.filter((item) => item.id !== comment.id), comment]);
      notifyComment(comment);
    };
    socket.on('announcement:created', onAnnouncement);
    socket.on('task:comment-created', onComment);
    return () => { socket.off('announcement:created', onAnnouncement); socket.off('task:comment-created', onComment); };
  }, []);

  const handleTaskComment = async (taskId, text) => {
    const data = await apiJson(`/tasks/${taskId}/comments`, 'POST', { text });
    setComments((current) => [...current.filter((item) => item.id !== data.comment.id), data.comment]);
  };

  return (
    <>
    <NotificationStack notifications={notifications} onDismiss={dismissNotification} />
    <DashboardShell user={user} onLogout={onLogout} title={t('studentDashboard')} subtitle={t('studentSubtitle')} accentClass="bg-[linear-gradient(135deg,#C07756,#de9a7c)]">
      <div className="flex flex-wrap gap-2 mb-6">{['tasks', 'announcements'].map((tab) => <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>{t(tab)}</TabButton>)}</div>
      {activeTab === 'tasks' ? <Panel title={t('teacherTasks')} subtitle={t('teacherTasksSubtitle')}><div className="space-y-6">{tasks.length ? tasks.map((task) => <TaskCard key={task.id} task={task} comments={comments} canComment onComment={handleTaskComment} />) : <EmptyState text={t('noTeacherTasks')} />}</div></Panel> : null}
      {activeTab === 'announcements' ? <Panel title={t('announcements')} subtitle={t('parentAnnouncementsSubtitle')}><AnnouncementList announcements={announcements.filter((item) => item.visibleToGuests || item.targetRoles.includes('student'))} /></Panel> : null}
    </DashboardShell>
    </>
  );
}

function ParentDashboard({ user, onLogout }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const { notifications, dismissNotification, notifyAnnouncement } = useRealtimeNotifications();

  useEffect(() => {
    Promise.all([apiRequest('/announcements'), apiRequest('/chat/with-admin')]).then(([announcementData, chatData]) => {
      setAnnouncements(announcementData.announcements);
      setChatMessages(chatData.messages);
      setAdminUser(chatData.admin);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const onAnnouncement = (announcement) => {
      if (announcement.targetRoles.includes('parent') || announcement.visibleToGuests || announcement.createdByRole === 'teacher') {
        setAnnouncements((current) => [announcement, ...current.filter((item) => item.id !== announcement.id)]);
        notifyAnnouncement(announcement);
      }
    };
    const onChat = (message) => { if (message.audience === 'parent') setChatMessages((current) => [...current.filter((item) => item.id !== message.id), message]); };
    socket.on('announcement:created', onAnnouncement);
    socket.on('chat:message', onChat);
    return () => { socket.off('announcement:created', onAnnouncement); socket.off('chat:message', onChat); };
  }, []);

  return (
    <>
    <NotificationStack notifications={notifications} onDismiss={dismissNotification} />
    <DashboardShell user={user} onLogout={onLogout} title={t('parentDashboard')} subtitle={t('parentDashboardSubtitle')} accentClass="bg-[linear-gradient(135deg,#8f5e42,#C07756)]">
      <div className="flex flex-wrap gap-2 mb-6">{['announcements', 'chat', 'settings'].map((tab) => <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab === 'settings' ? t('settings') : t(tab)}</TabButton>)}</div>
      {activeTab === 'announcements' ? <Panel title={t('parentAnnouncementsTitle')} subtitle={t('parentAnnouncementsSubtitle')}><AnnouncementList announcements={announcements.filter((item) => item.visibleToGuests || item.targetRoles.includes('parent'))} /></Panel> : null}
      {activeTab === 'chat' ? <Panel title={t('talkToAdmin')} subtitle={t('parentChatSubtitle')}><ChatPanel title="Admin" people={adminUser ? [{ user: adminUser, messages: chatMessages, lastMessage: chatMessages.at(-1) || null }] : []} activePersonId={adminUser?.id || ''} setActivePersonId={() => {}} messages={chatMessages} onSend={async (_, content) => { const data = await apiJson('/chat/messages', 'POST', { content }); setChatMessages((current) => [...current.filter((item) => item.id !== data.message.id), data.message]); }} /></Panel> : null}
      {activeTab === 'settings' ? <Panel title={t('settings')} subtitle={t('pushNotificationsDesc')}><PushNotificationManager user={user} /></Panel> : null}
    </DashboardShell>
    </>
  );
}

export function RolePortal({ user, onLogout }) {
  if (user.role === 'admin') return <AdminDashboard user={user} onLogout={onLogout} />;
  if (user.role === 'teacher') return <TeacherDashboard user={user} onLogout={onLogout} />;
  if (user.role === 'parent') return <ParentDashboard user={user} onLogout={onLogout} />;
  return <StudentDashboard user={user} onLogout={onLogout} />;
}

export function PortalShortcut() {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
      {[
        ['Teacher tasks', 'Teachers upload task files and start the first comment thread.'],
        ['Student replies', 'Students comment on tasks and teachers receive those updates live.'],
        ['Announcements', 'Role-based announcements can also appear for public visitors.'],
        ['Live chat', 'Admin talks with teachers and parents in separate real-time spaces.'],
      ].map(([title, text]) => (
        <div key={title} className="rounded-3xl p-5 bg-white border border-gs-dark/5">
          <h4 className="font-serif text-xl text-gs-dark">{title}</h4>
          <p className="text-gray-600 mt-2 text-sm">{text}</p>
        </div>
      ))}
      <div className="md:col-span-2 xl:col-span-4">
        <Link to="/login" className="inline-flex px-6 py-3 rounded-full bg-gs-accent text-white font-bold">
          Open login to continue
        </Link>
      </div>
    </div>
  );
}
