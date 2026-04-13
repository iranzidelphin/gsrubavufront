import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiJson, apiRequest, buildFileUrl, getStoredUser } from '../lib/api';
import { getSocket } from '../lib/socket';

function DashboardShell({ user, onLogout, title, subtitle, accentClass = 'bg-gs-dark', children }) {
  return (
    <div className="bg-white/95 rounded-[28px] shadow-2xl overflow-hidden border border-white/60">
      <div className={`${accentClass} text-white p-8`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=1A3C34&color=fff`}
              className="w-14 h-14 rounded-full border-2 border-white/30"
              alt={user.fullName}
            />
            <div>
              <h3 className="font-serif text-3xl">{title}</h3>
              <p className="text-white/80 text-sm">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs uppercase tracking-[0.25em]">
              {user.role}
            </span>
            <button onClick={onLogout} className="px-4 py-2 rounded-full bg-white text-gs-dark font-bold">
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="p-6 md:p-8 bg-gradient-to-br from-white to-[#f8f2eb]">{children}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
        active ? 'bg-gs-accent text-white shadow-lg' : 'bg-white text-gs-dark border border-gs-dark/10'
      }`}
    >
      {children}
    </button>
  );
}

function Panel({ title, subtitle, children, action }) {
  return (
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-black/5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <h4 className="font-serif text-2xl text-gs-dark">{title}</h4>
          {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-2xl bg-[#f7f5f1] p-8 text-center text-gray-500">{text}</div>;
}

function AnnouncementList({ announcements }) {
  if (!announcements.length) {
    return <EmptyState text="No announcements available yet." />;
  }

  return (
    <div className="space-y-4">
      {announcements.map((item) => (
        <article key={item.id} className="rounded-2xl border border-gs-dark/10 bg-[#fffaf4] p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div className="flex gap-2 flex-wrap mb-2">
                <span className="text-xs uppercase tracking-[0.22em] font-bold text-gs-accent">
                  {item.createdByRole}
                </span>
                {item.visibleToGuests ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-gs-dark text-white">public</span>
                ) : null}
                {item.targetRoles.map((role) => (
                  <span key={role} className="text-xs px-2 py-1 rounded-full bg-white border border-gs-dark/10">
                    {role}
                  </span>
                ))}
              </div>
              <h5 className="font-serif text-xl text-gs-dark">{item.title}</h5>
              <p className="text-gray-600 mt-2">{item.message}</p>
            </div>
            <div className="text-sm text-gray-500 whitespace-nowrap">
              {new Date(item.date).toLocaleDateString()}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function AnnouncementComposer({ allowPublic, onCreated, defaultRoles }) {
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
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Announcement title" className="rounded-2xl border border-gs-dark/10 px-4 py-3" required />
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-2xl border border-gs-dark/10 px-4 py-3" required />
      </div>
      <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write the announcement message" className="rounded-2xl border border-gs-dark/10 px-4 py-3 min-h-28" required />
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
          Show this announcement to unlogged users too
        </label>
      ) : null}
      <button type="submit" disabled={saving} className="px-5 py-3 rounded-2xl bg-gs-dark text-white font-bold">
        {saving ? 'Saving...' : 'Post announcement'}
      </button>
    </form>
  );
}

function UserRoleManager({ users, onRoleChange }) {
  if (!users.length) {
    return <EmptyState text="No registered users found." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-sm text-gray-500 border-b border-gs-dark/10">
            <th className="pb-3">User</th>
            <th className="pb-3">Email</th>
            <th className="pb-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((item) => (
            <tr key={item.id} className="border-b border-gs-dark/5">
              <td className="py-4 font-bold text-gs-dark">{item.fullName}</td>
              <td className="py-4 text-gray-500">{item.email}</td>
              <td className="py-4">
                <select value={item.role} onChange={(event) => onRoleChange(item.id, event.target.value)} className="rounded-full border border-gs-dark/10 px-4 py-2">
                  {['student', 'teacher', 'parent', 'admin'].map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaskCard({ task, comments, canComment, onComment }) {
  const [commentText, setCommentText] = useState('');
  const taskComments = comments.filter((item) => (typeof item.task === 'string' ? item.task === task.id : item.task?.id === task.id));

  return (
    <article className="rounded-3xl bg-[#fffaf4] border border-gs-dark/10 p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h5 className="font-serif text-2xl text-gs-dark">{task.title}</h5>
          <p className="text-gray-600 mt-2">{task.description}</p>
          {task.firstComment ? <div className="mt-4 p-4 rounded-2xl bg-white border border-gs-dark/5"><p className="text-xs uppercase tracking-[0.2em] text-gs-accent font-bold mb-2">First comment</p><p className="text-gray-600">{task.firstComment}</p></div> : null}
          <div className="text-sm text-gray-500 mt-4">Teacher: {task.teacher?.fullName || 'Unknown'}</div>
        </div>
        <div className="flex flex-col gap-3 min-w-44">
          {task.fileUrl ? <a href={buildFileUrl(task.fileUrl)} target="_blank" rel="noreferrer" className="px-4 py-3 rounded-2xl bg-gs-dark text-white text-center font-bold">Download {task.fileName || 'file'}</a> : <div className="px-4 py-3 rounded-2xl bg-white border border-gs-dark/10 text-sm text-gray-500">No file uploaded</div>}
          <div className="text-xs text-gray-500">{new Date(task.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-6">
        <h6 className="font-bold text-gs-dark mb-3">Comments</h6>
        <div className="space-y-3">
          {taskComments.length ? taskComments.map((comment) => (
            <div key={comment.id} className="rounded-2xl bg-white p-4 border border-gs-dark/5">
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-bold text-gs-dark">{comment.author?.fullName} ({comment.author?.role})</span>
                <span className="text-gray-400">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-gray-600 mt-2">{comment.text}</p>
            </div>
          )) : <EmptyState text="No comments yet for this task." />}
        </div>
      </div>
      {canComment ? (
        <form onSubmit={(event) => { event.preventDefault(); if (!commentText.trim()) return; onComment(task.id, commentText); setCommentText(''); }} className="mt-6 flex flex-col md:flex-row gap-3">
          <input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Write a comment" className="flex-1 rounded-2xl border border-gs-dark/10 px-4 py-3" />
          <button type="submit" className="px-5 py-3 rounded-2xl bg-gs-accent text-white font-bold">Send comment</button>
        </form>
      ) : null}
    </article>
  );
}

function ChatPanel({ title, people, activePersonId, setActivePersonId, messages, onSend }) {
  const [messageText, setMessageText] = useState('');
  const activePerson = people.find((item) => item.user.id === activePersonId) || null;

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      <div className="rounded-3xl bg-[#f7f5f1] p-4 space-y-3">
        {people.length ? people.map((item) => (
          <button key={item.user.id} onClick={() => setActivePersonId(item.user.id)} className={`w-full text-left rounded-2xl p-4 ${activePersonId === item.user.id ? 'bg-gs-dark text-white' : 'bg-white text-gs-dark'}`}>
            <div className="font-bold">{item.user.fullName}</div>
            <div className={`text-xs mt-1 ${activePersonId === item.user.id ? 'text-white/70' : 'text-gray-500'}`}>{item.lastMessage?.content || 'No messages yet'}</div>
          </button>
        )) : <EmptyState text={`No ${title.toLowerCase()} yet.`} />}
      </div>
      <div className="rounded-3xl bg-white border border-gs-dark/10 p-5">
        {activePerson ? (
          <>
            <div className="border-b border-gs-dark/10 pb-4 mb-4">
              <h5 className="font-serif text-2xl text-gs-dark">{activePerson.user.fullName}</h5>
              <p className="text-sm text-gray-500">{activePerson.user.email}</p>
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {messages.length ? messages.map((message) => {
                const ownMessage = message.sender?.id === getStoredUser()?.id;
                return <div key={message.id} className={`max-w-[80%] rounded-3xl px-4 py-3 ${ownMessage ? 'ml-auto bg-gs-dark text-white' : 'bg-[#f7f5f1] text-gs-dark'}`}><div className="text-xs opacity-70 mb-1">{message.sender?.fullName}</div><div>{message.content}</div></div>;
              }) : <EmptyState text="No messages in this conversation yet." />}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); if (!messageText.trim()) return; onSend(activePerson.user.id, messageText); setMessageText(''); }} className="mt-5 flex gap-3">
              <input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Write a message" className="flex-1 rounded-2xl border border-gs-dark/10 px-4 py-3" />
              <button type="submit" className="px-5 py-3 rounded-2xl bg-gs-accent text-white font-bold">Send</button>
            </form>
          </>
        ) : <EmptyState text="Choose a person to open the conversation." />}
      </div>
    </div>
  );
}

function RoleAnnouncements({ announcements, canPost, allowPublic, onCreated, defaultRoles }) {
  return (
    <div className="grid xl:grid-cols-[1fr_360px] gap-6">
      <Panel title="Announcements" subtitle="Visible updates for this role dashboard.">
        <AnnouncementList announcements={announcements} />
      </Panel>
      {canPost ? (
        <Panel title="Post announcement" subtitle="Choose the audience carefully.">
          <AnnouncementComposer allowPublic={allowPublic} onCreated={onCreated} defaultRoles={defaultRoles} />
        </Panel>
      ) : null}
    </div>
  );
}

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [teacherComments, setTeacherComments] = useState([]);
  const [teacherConversations, setTeacherConversations] = useState([]);
  const [parentConversations, setParentConversations] = useState([]);
  const [activeTeacherId, setActiveTeacherId] = useState('');
  const [activeParentId, setActiveParentId] = useState('');

  useEffect(() => {
    Promise.all([apiRequest('/announcements'), apiRequest('/users'), apiRequest('/tasks/comments/feed'), apiRequest('/chat/admin/teacher'), apiRequest('/chat/admin/parent')]).then(([announcementData, userData, commentData, teacherChatData, parentChatData]) => {
      setAnnouncements(announcementData.announcements);
      setUsers(userData.users);
      setTeacherComments(commentData.comments);
      setTeacherConversations(teacherChatData.conversations);
      setParentConversations(parentChatData.conversations);
      setActiveTeacherId(teacherChatData.conversations[0]?.user.id || '');
      setActiveParentId(parentChatData.conversations[0]?.user.id || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;
    const handleAnnouncement = (announcement) => setAnnouncements((current) => [announcement, ...current.filter((item) => item.id !== announcement.id)]);
    const handleComment = (comment) => setTeacherComments((current) => [comment, ...current.filter((item) => item.id !== comment.id)]);
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

  const stats = useMemo(() => ({
    totalUsers: users.length,
    teachers: users.filter((item) => item.role === 'teacher').length,
    parents: users.filter((item) => item.role === 'parent').length,
    students: users.filter((item) => item.role === 'student').length,
  }), [users]);

  const handleRoleChange = async (userId, role) => {
    const data = await apiRequest(`/users/${userId}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    setUsers((current) => current.map((item) => (item.id === userId ? data.user : item)));
  };

  const handleSendMessage = async (recipientId, content) => {
    await apiJson('/chat/messages', 'POST', { recipientId, content });
  };

  return (
    <DashboardShell user={user} onLogout={onLogout} title="Admin Control Room" subtitle="Manage roles, announcements, teacher comments, and live conversations." accentClass="bg-gs-dark">
      <div className="flex flex-wrap gap-2 mb-6">
        {['overview', 'announcements', 'users', 'comments', 'chatFromTeacher', 'chatFromParent'].map((tab) => <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</TabButton>)}
      </div>
      {activeTab === 'overview' ? <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">{[['Total users', stats.totalUsers], ['Teachers', stats.teachers], ['Parents', stats.parents], ['Students', stats.students]].map(([label, value]) => <div key={label} className="rounded-3xl p-6 bg-white border border-gs-dark/5"><p className="text-sm text-gray-500">{label}</p><p className="text-4xl font-serif text-gs-dark mt-3">{value}</p></div>)}</div> : null}
      {activeTab === 'announcements' ? <RoleAnnouncements announcements={announcements} canPost allowPublic onCreated={(announcement) => setAnnouncements((current) => [announcement, ...current])} defaultRoles={['teacher', 'student', 'parent', 'admin']} /> : null}
      {activeTab === 'users' ? <Panel title="User management" subtitle="Change the selected role for any registered user."><UserRoleManager users={users} onRoleChange={handleRoleChange} /></Panel> : null}
      {activeTab === 'comments' ? <Panel title="Teacher comments feed" subtitle="Real-time task comments arriving from the learning area."><div className="space-y-3">{teacherComments.length ? teacherComments.map((item) => <div key={item.id} className="rounded-2xl bg-[#fffaf4] border border-gs-dark/10 p-4"><div className="flex justify-between gap-4"><div><p className="font-bold text-gs-dark">{item.author?.fullName} ({item.author?.role})</p><p className="text-sm text-gray-500 mt-1">Task: {typeof item.task === 'string' ? item.task : item.task?.title}</p></div><span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</span></div><p className="text-gray-600 mt-3">{item.text}</p></div>) : <EmptyState text="No teacher or student task comments yet." />}</div></Panel> : null}
      {activeTab === 'chatFromTeacher' ? <Panel title="chatFromTeacher" subtitle="See which teacher sent the message, then reply in real time."><ChatPanel title="Teachers" people={teacherConversations} activePersonId={activeTeacherId} setActivePersonId={setActiveTeacherId} messages={teacherConversations.find((item) => item.user.id === activeTeacherId)?.messages || []} onSend={handleSendMessage} /></Panel> : null}
      {activeTab === 'chatFromParent' ? <Panel title="chatFromParent" subtitle="Live parent conversations for the school leader."><ChatPanel title="Parents" people={parentConversations} activePersonId={activeParentId} setActivePersonId={setActiveParentId} messages={parentConversations.find((item) => item.user.id === activeParentId)?.messages || []} onSend={handleSendMessage} /></Panel> : null}
    </DashboardShell>
  );
}

function TeacherDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', firstComment: '', file: null });

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
      }
    };
    const onComment = (comment) => setComments((current) => [...current.filter((item) => item.id !== comment.id), comment]);
    const onChat = (message) => { if (message.audience === 'teacher') setChatMessages((current) => [...current.filter((item) => item.id !== message.id), message]); };
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

  return (
    <DashboardShell user={user} onLogout={onLogout} title="Teacher Workspace" subtitle="Upload task files, receive student comments, read announcements, and chat with admin." accentClass="bg-[linear-gradient(135deg,#1A3C34,#2d5b50)]">
      <div className="flex flex-wrap gap-2 mb-6">{['tasks', 'announcements', 'chat'].map((tab) => <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</TabButton>)}</div>
      {activeTab === 'tasks' ? <div className="grid xl:grid-cols-[380px_1fr] gap-6"><Panel title="Upload task" subtitle="Add task details, upload a task file, and write the first comment students will see."><form onSubmit={handleTaskSubmit} className="grid gap-4"><input value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="Task title" className="rounded-2xl border border-gs-dark/10 px-4 py-3" required /><textarea value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} placeholder="Task description" className="rounded-2xl border border-gs-dark/10 px-4 py-3 min-h-28" required /><textarea value={taskForm.firstComment} onChange={(event) => setTaskForm((current) => ({ ...current, firstComment: event.target.value }))} placeholder="First comment for students" className="rounded-2xl border border-gs-dark/10 px-4 py-3 min-h-24" /><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg" onChange={(event) => setTaskForm((current) => ({ ...current, file: event.target.files?.[0] || null }))} className="rounded-2xl border border-gs-dark/10 px-4 py-3" /><div className="text-sm text-gray-500">Teachers can upload the task file here. Students will be able to open or download it from their dashboard.</div><button type="submit" className="px-5 py-3 rounded-2xl bg-gs-accent text-white font-bold">Upload task</button></form></Panel><Panel title="Uploaded tasks" subtitle="Only students and this teacher can access these tasks."><div className="space-y-6">{tasks.length ? tasks.map((task) => <TaskCard key={task.id} task={task} comments={comments} canComment onComment={handleTaskComment} />) : <EmptyState text="No tasks uploaded yet." />}</div></Panel></div> : null}
      {activeTab === 'announcements' ? <RoleAnnouncements announcements={announcements} canPost allowPublic={false} onCreated={(announcement) => setAnnouncements((current) => [announcement, ...current])} defaultRoles={['student', 'parent', 'teacher']} /> : null}
      {activeTab === 'chat' ? <Panel title="Admin chat" subtitle="Real-time communication with the school leader."><ChatPanel title="Admin" people={adminUser ? [{ user: adminUser, messages: chatMessages, lastMessage: chatMessages.at(-1) || null }] : []} activePersonId={adminUser?.id || ''} setActivePersonId={() => {}} messages={chatMessages} onSend={async (_, content) => { await apiJson('/chat/messages', 'POST', { content }); }} /></Panel> : null}
    </DashboardShell>
  );
}

function StudentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

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
      }
    };
    const onComment = (comment) => setComments((current) => [...current.filter((item) => item.id !== comment.id), comment]);
    socket.on('announcement:created', onAnnouncement);
    socket.on('task:comment-created', onComment);
    return () => { socket.off('announcement:created', onAnnouncement); socket.off('task:comment-created', onComment); };
  }, []);

  const handleTaskComment = async (taskId, text) => {
    const data = await apiJson(`/tasks/${taskId}/comments`, 'POST', { text });
    setComments((current) => [...current.filter((item) => item.id !== data.comment.id), data.comment]);
  };

  return (
    <DashboardShell user={user} onLogout={onLogout} title="Student Dashboard" subtitle="Download teacher tasks, add comments, and keep up with announcements." accentClass="bg-[linear-gradient(135deg,#C07756,#de9a7c)]">
      <div className="flex flex-wrap gap-2 mb-6">{['tasks', 'announcements'].map((tab) => <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</TabButton>)}</div>
      {activeTab === 'tasks' ? <Panel title="Teacher tasks" subtitle="These files are visible only to students and the posting teacher."><div className="space-y-6">{tasks.length ? tasks.map((task) => <TaskCard key={task.id} task={task} comments={comments} canComment onComment={handleTaskComment} />) : <EmptyState text="No teacher tasks available yet." />}</div></Panel> : null}
      {activeTab === 'announcements' ? <Panel title="Announcements" subtitle="School updates from admin and teachers."><AnnouncementList announcements={announcements.filter((item) => item.visibleToGuests || item.targetRoles.includes('student'))} /></Panel> : null}
    </DashboardShell>
  );
}

function ParentDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminUser, setAdminUser] = useState(null);

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
      }
    };
    const onChat = (message) => { if (message.audience === 'parent') setChatMessages((current) => [...current.filter((item) => item.id !== message.id), message]); };
    socket.on('announcement:created', onAnnouncement);
    socket.on('chat:message', onChat);
    return () => { socket.off('announcement:created', onAnnouncement); socket.off('chat:message', onChat); };
  }, []);

  return (
    <DashboardShell user={user} onLogout={onLogout} title="Parent Dashboard" subtitle="Read announcements from admin or teachers and communicate with the school leader." accentClass="bg-[linear-gradient(135deg,#8f5e42,#C07756)]">
      <div className="flex flex-wrap gap-2 mb-6">{['announcements', 'chat'].map((tab) => <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</TabButton>)}</div>
      {activeTab === 'announcements' ? <Panel title="Announcements" subtitle="Updates shared by admin and teachers."><AnnouncementList announcements={announcements.filter((item) => item.visibleToGuests || item.targetRoles.includes('parent'))} /></Panel> : null}
      {activeTab === 'chat' ? <Panel title="Talk to admin" subtitle="This chat is live with Socket.IO."><ChatPanel title="Admin" people={adminUser ? [{ user: adminUser, messages: chatMessages, lastMessage: chatMessages.at(-1) || null }] : []} activePersonId={adminUser?.id || ''} setActivePersonId={() => {}} messages={chatMessages} onSend={async (_, content) => { await apiJson('/chat/messages', 'POST', { content }); }} /></Panel> : null}
    </DashboardShell>
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
