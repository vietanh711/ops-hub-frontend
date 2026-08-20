import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY

function ShiftHandover({ currentUser }) {
  const [handovers, setHandovers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [members, setMembers] = useState([])
  const [myTasks, setMyTasks] = useState([])
  const [selectedMemberEmail, setSelectedMemberEmail] = useState('')
  const [taskContent, setTaskContent] = useState('')
  
  const [assignee, setAssignee] = useState('')
  const [issueTitle, setIssueTitle] = useState('')
  const [handoverNote, setHandoverNote] = useState('')

  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editNoteContent, setEditNoteContent] = useState('')

  const fetchHandovers = () => {
    axios.get('https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/handovers')
      .then(res => setHandovers(res.data))
      .catch(err => console.error(err))
  }

  const fetchMyTasks = () => {
    if (!currentUser?.email) return

    axios.get(`https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/tasks/${currentUser.email}`)
      .then(res => setMyTasks(res.data))
      .catch(err => console.error(err))
  }

  useEffect(() => {
    fetchHandovers()

    if (currentUser?.role === 'lead team') {
      axios.get('https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/users')
        .then(res => setMembers(res.data))
        .catch(err => console.error(err))
    }

    if (currentUser?.role === 'member') {
      fetchMyTasks()
    }
  }, [currentUser])

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  }

  // ==========================================
  // LOGIC GỘP NHÓM (GROUPING) THEO NGƯỜI TRỰC
  // ==========================================
  const groupedHandovers = handovers.reduce((groups, item) => {
    const key = item.assignee.trim().toLowerCase(); // Gộp những tên giống nhau (bỏ qua viết hoa/thường)
    if (!groups[key]) {
      groups[key] = {
        originalName: item.assignee, // Giữ lại tên gốc để hiển thị
        items: []
      };
    }
    groups[key].items.push(item);
    return groups;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!assignee || !issueTitle) {
      alert('Vui lòng điền Người trực và Tên sự cố')
      return
    }

    try {
      await axios.post('https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/handovers', {
        assignee: assignee,
        issue_title: issueTitle,
        handover_note: handoverNote
      })
      
      setAssignee('')
      setIssueTitle('')
      setHandoverNote('')
      setShowForm(false)
      fetchHandovers()
    } catch (error) {
      console.error("Lỗi khi thêm ca trực:", error)
    }
  }

  // Hàm xử lý khi bấm nút "+ Thêm sự cố" ở từng nhóm
  const handleQuickAdd = (name) => {
    setAssignee(name);
    setIssueTitle('');
    setHandoverNote('');
    setShowForm(true);
    // Cuộn trang lên vị trí form mượt mà
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleStatusChange = async (id, newStatus, currentNote) => {
    try {
      await axios.put(`https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/handovers/${id}`, {
        status: newStatus,
        handover_note: currentNote
      })
      fetchHandovers()
    } catch (error) {
      console.error("Lỗi:", error)
    }
  }

  const handleSaveNote = async (id, currentStatus) => {
    try {
      await axios.put(`https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/handovers/${id}`, {
        status: currentStatus,
        handover_note: editNoteContent
      })
      setEditingNoteId(null)
      fetchHandovers()
    } catch (error) {
      console.error("Lỗi:", error)
    }
  }

  const handleAssignTask = async (e) => {
    e.preventDefault()
    if (!selectedMemberEmail || !taskContent) {
      alert('Vui lòng chọn member và nhập nội dung công việc.')
      return
    }

    try {
      await axios.post('https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/tasks', {
        assignee_email: selectedMemberEmail,
        content: taskContent
      })
      setTaskContent('')
      alert('Giao việc thành công!')
    } catch (error) {
      console.error('Lỗi khi giao việc:', error)
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.delete(`https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/tasks/${taskId}`)
      fetchMyTasks()
    } catch (error) {
      console.error('Lỗi khi hoàn thành task:', error)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', margin: 0 }}>Quản lý Ca trực & Bàn giao</h2>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) { setAssignee(''); setIssueTitle(''); setHandoverNote(''); }
          }}
          style={{ padding: '8px 15px', backgroundColor: showForm ? '#6c757d' : '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
        >
          {showForm ? 'Đóng' : '+ Tạo ca trực mới'}
        </button>
      </div>
      
      {currentUser?.role === 'lead team' && (
        <div style={{ backgroundColor: '#e8f4f8', padding: '15px', borderRadius: '4px', border: '1px solid #b3d7ff', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#0056b3' }}>Giao việc cho Member</h3>
          <form onSubmit={handleAssignTask} style={{ display: 'flex', gap: '10px' }}>
            <select value={selectedMemberEmail} onChange={(e) => setSelectedMemberEmail(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
              <option value="">-- Chọn Member --</option>
              {members.map(member => (
                <option key={member.id} value={member.email}>{member.name} ({member.email})</option>
              ))}
            </select>
            <input type="text" value={taskContent} onChange={(e) => setTaskContent(e.target.value)} style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Nhập nội dung checklist..." />
            <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Gửi</button>
          </form>
        </div>
      )}

      {currentUser?.role === 'member' && myTasks.length > 0 && (
        <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '4px', border: '1px solid #ffeeba', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#856404' }}>Leader giao việc:</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myTasks.map(task => (
              <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" onChange={() => handleCompleteTask(task.id)} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <span style={{ color: '#333', fontSize: '12px' }}>{task.content}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FORM THÊM MỚI */}
      {showForm && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Người trực *</label>
              <input type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Sự cố / Công việc *</label>
              <input type="text" value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Ghi chú ban đầu</label>
              <input type="text" value={handoverNote} onChange={(e) => setHandoverNote(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '62px' }}>
              <button type="submit" style={{ padding: '9px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>Lưu</button>
            </div>
          </form>
        </div>
      )}

      {/* BẢNG HIỂN THỊ ĐÃ GỘP NHÓM */}
      <div style={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ddd', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f6f8', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px 15px', color: '#333', fontSize: '14px', width: '15%' }}>Người trực</th>
              <th style={{ padding: '12px 15px', color: '#333', fontSize: '14px', width: '15%' }}>Thời gian</th>
              <th style={{ padding: '12px 15px', color: '#333', fontSize: '14px', width: '20%' }}>Sự cố / Công việc</th>
              <th style={{ padding: '12px 15px', color: '#333', fontSize: '14px', width: '15%' }}>Trạng thái</th>
              <th style={{ padding: '12px 15px', color: '#333', fontSize: '14px', width: '35%' }}>Ghi chú / Cách giải quyết</th>
            </tr>
          </thead>
          
          {Object.keys(groupedHandovers).length === 0 ? (
            <tbody>
              <tr><td colSpan="5" style={{ padding: '15px', textAlign: 'center', color: '#666' }}>Chưa có dữ liệu ca trực.</td></tr>
            </tbody>
          ) : (
            // Dùng nhiều thẻ tbody để tách biệt từng nhóm người trực
            Object.values(groupedHandovers).map((group, groupIndex) => (
              <tbody key={groupIndex} style={{ borderBottom: '2px solid #999' }}>
                {group.items.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    
                    {/* Cột Người Trực: Chỉ hiển thị ở hàng đầu tiên của nhóm và gộp hàng (rowSpan) */}
                    {index === 0 && (
                      <td 
                        rowSpan={group.items.length + 1} 
                        style={{ padding: '12px 15px', backgroundColor: '#f8f9fa', borderRight: '1px solid #ddd', verticalAlign: 'top', fontSize: '15px' }}
                      >
                        <strong>{group.originalName}</strong>
                      </td>
                    )}
                    
                    <td style={{ padding: '12px 15px', fontSize: '13px', color: '#555', borderLeft: index !== 0 ? '1px solid #ddd' : 'none' }}>
                      {formatDateTime(item.shift_date)}
                    </td>
                    <td style={{ padding: '12px 15px', color: '#0056b3', fontWeight: 'bold', fontSize: '14px' }}>
                      {item.issue_title}
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <select 
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value, item.handover_note)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '13px', backgroundColor: item.status === 'Resolved' ? '#e2f0e5' : (item.status === 'In Progress' ? '#e8f4f8' : '#fcf3cf') }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 15px', fontSize: '14px', color: '#555' }}>
                      {editingNoteId === item.id ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <input type="text" value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)} style={{ flex: 1, padding: '4px 8px', border: '1px solid #0056b3', borderRadius: '4px' }} />
                          <button onClick={() => handleSaveNote(item.id, item.status)} style={{ padding: '4px 8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                          <button onClick={() => setEditingNoteId(null)} style={{ padding: '4px 8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ wordBreak: 'break-word', paddingRight: '10px' }}>{item.handover_note || "-"}</span>
                          <button onClick={() => { setEditingNoteId(item.id); setEditNoteContent(item.handover_note || ''); }} style={{ padding: '2px 8px', backgroundColor: '#f4f6f8', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}>Sửa</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* Hàng chứa nút thêm sự cố bổ sung cho người này */}
                <tr style={{ backgroundColor: '#fcfcfc' }}>
                  <td colSpan="4" style={{ padding: '8px 15px', borderLeft: '1px solid #ddd' }}>
                    <button 
                      onClick={() => handleQuickAdd(group.originalName)}
                      style={{ padding: '4px 10px', backgroundColor: '#e9ecef', color: '#333', border: '1px dashed #aaa', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      + Thêm sự cố 
                    </button>
                  </td>
                </tr>
              </tbody>
            ))
          )}
        </table>
      </div>
    </div>
  )
}


// ==========================================
// 2. MODULE: KNOWLEDGE BASE (Tài liệu)
// ==========================================
function KnowledgeBase() {
  const [docs, setDocs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingDocId, setEditingDocId] = useState(null)

  // State cho form
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')

  const fetchDocs = () => {
    axios.get('https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/knowledge')
      .then(res => setDocs(res.data))
      .catch(err => console.error(err))
  }

  useEffect(() => {
    fetchDocs()
  }, [])

  const resetForm = () => {
    setTitle('')
    setCategory('')
    setContent('')
    setEditingDocId(null)
  }

  // Xử lý khi chọn ảnh bằng nút Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    processImageFile(file)
  }

  // Xử lý khi ấn Ctrl+V (Paste) vào ô text
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      // Nếu dữ liệu paste vào là hình ảnh
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Chặn hành vi paste text mặc định của trình duyệt
        const file = items[i].getAsFile();
        processImageFile(file);
        break;
      }
    }
  }

  // Hàm dùng chung để xử lý file ảnh chuyển thành Base64
  // Hàm xử lý file ảnh: Đẩy lên Cloud và lấy Link ngắn
  const processImageFile = async (file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh có dung lượng dưới 2MB.')
        return
      }
      
      const formData = new FormData()
      formData.append('image', file)

      try {
        // Gọi API đẩy ảnh lên Cloud
        const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData)
        
        // Lấy đường link ảnh (URL) trả về
        const imageUrl = res.data.data.url
        
        // Chèn gọn gàng vào Markdown
        setContent((prevContent) => prevContent + `\n\n![Ảnh minh họa](${imageUrl})\n\n`)
      } catch (error) {
        console.error("Lỗi khi upload ảnh:", error)
        alert('Upload ảnh thất bại. Vui lòng kiểm tra lại mạng hoặc API Key.')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !category || !content) {
      alert('Vui lòng điền đầy đủ Tiêu đề, Phân loại và Nội dung.')
      return
    }

    try {
      const payload = {
        title: title,
        category: category,
        content: content
      }

      if (editingDocId) {
        await axios.put(`https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/knowledge/${editingDocId}`, payload)
      } else {
        await axios.post('https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/knowledge', payload)
      }

      resetForm()
      setShowForm(false)
      fetchDocs()
    } catch (error) {
      console.error("Lỗi khi lưu tài liệu:", error)
    }
  }

  const handleEdit = (doc) => {
    setEditingDocId(doc.id)
    setTitle(doc.title || '')
    setCategory(doc.category || '')
    setContent(doc.content || '')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa tài liệu này?')) return

    try {
      await axios.delete(`https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/knowledge/${id}`)
      if (editingDocId === id) {
        resetForm()
        setShowForm(false)
      }
      fetchDocs()
    } catch (error) {
      console.error("Lỗi khi xóa tài liệu:", error)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#2c3e50', margin: '0 0 5px 0' }}>Tài liệu Hệ thống</h2>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Lưu trữ tài liệu thiết kế và sổ tay vận hành.</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) resetForm()
            setShowForm(!showForm)
          }}
          style={{ padding: '8px 15px', backgroundColor: showForm ? '#6c757d' : '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
        >
          {showForm ? 'Đóng' : '+ Thêm tài liệu mới'}
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Tiêu đề tài liệu *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="VD: Hướng dẫn cài đặt DB" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Phân loại (Category) *</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="VD: Setup Manual" />
              </div>
            </div>
            
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px', backgroundColor: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Nội dung (Hỗ trợ Markdown & Paste ảnh Ctrl+V) *</label>
                
                <div>
                  <label htmlFor="file-upload" style={{ cursor: 'pointer', backgroundColor: '#e9ecef', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', border: '1px solid #ccc', color: '#333' }}>
                     Đính kèm ảnh
                  </label>
                  <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </div>
              </div>

              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste} // Gọi hàm lắng nghe sự kiện Paste ở đây
                rows="8"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'monospace', backgroundColor: '#fff', boxSizing: 'border-box' }} 
                placeholder="# Tiêu đề lớn&#10;Có thể sử dụng Snipping Tool (Ctrl+Shift+S) chụp ảnh rồi ấn Ctrl+V thẳng vào ô này..."
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              {editingDocId && (
                <button type="button" onClick={() => { resetForm(); setShowForm(false); }} style={{ padding: '9px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginRight: '8px' }}>Hủy</button>
              )}
              <button type="submit" style={{ padding: '9px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>{editingDocId ? 'Cập nhật tài liệu' : 'Lưu tài liệu'}</button>
            </div>
          </form>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {docs.length === 0 ? <p style={{ color: '#666' }}>Chưa có dữ liệu.</p> : null}
        {docs.map((doc) => (
          <div key={doc.id} style={{ border: '1px solid #e1e4e8', padding: '20px', borderRadius: '4px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#2980b9' }}>{doc.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ backgroundColor: '#e8f4f8', color: '#0984e3', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #b3d7ff' }}>
                  {doc.category}
                </span>
                <button onClick={() => handleEdit(doc)} style={{ padding: '4px 10px', backgroundColor: '#f4f6f8', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Sửa</button>
                <button onClick={() => handleDelete(doc.id)} style={{ padding: '4px 10px', backgroundColor: '#fff5f5', color: '#dc3545', border: '1px solid #f5c2c7', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Xóa</button>
              </div>
            </div>
            
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '4px', fontSize: '14px', lineHeight: '1.6', border: '1px solid #e1e4e8', overflowX: 'auto' }}>
              <ReactMarkdown 
  components={{
    // Can thiệp vào cách React Markdown render thẻ ảnh
    img: ({node, ...props}) => (
      <img 
        {...props} 
        style={{ 
          maxWidth: '100%',       // Không bao giờ được rộng hơn khung chứa
          maxHeight: '500px',     // Cố định chiều cao tối đa là 500px (bạn có thể tự chỉnh)
          objectFit: 'contain',   // Giữ nguyên tỷ lệ ảnh, không bị méo
          display: 'block',       // Đẩy ảnh đứng thành 1 dòng riêng
          margin: '15px 0',       // Tạo khoảng cách trên dưới cho đẹp
          borderRadius: '4px',    // Bo góc nhẹ cho ảnh
          border: '1px solid #ddd'// Viền mỏng bao quanh ảnh
        }} 
      />
    )
  }}
>
  {doc.content}
</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
// ==========================================
// 3. MODULE: TRAINING & QA (Đào tạo)
// ==========================================
function TrainingQA() {
  const [qaList, setQaList] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingQaId, setEditingQaId] = useState(null)

  // State cho form
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const fetchQA = () => {
    axios.get('https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/training')
      .then(res => setQaList(res.data))
      .catch(err => console.error(err))
  }

  useEffect(() => {
    fetchQA()
  }, [])

  const resetForm = () => {
    setQuestion('')
    setAnswer('')
    setTagsInput('')
    setEditingQaId(null)
  }

  // --- HÀM XỬ LÝ ẢNH CHO Q&A ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    processImageFile(file)
  }

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        processImageFile(file);
        break;
      }
    }
  }

  const processImageFile = async (file) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh có dung lượng dưới 2MB.')
        return
      }
      
      const formData = new FormData()
      formData.append('image', file)

      try {
        const res = await axios.post(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, formData)
        const imageUrl = res.data.data.url
        setAnswer((prev) => prev + `\n\n![Ảnh minh họa](${imageUrl})\n\n`)
      } catch (error) {
        console.error("Lỗi khi upload ảnh:", error)
        alert('Upload ảnh thất bại. Vui lòng kiểm tra lại mạng hoặc API Key.')
      }
    }
  }
  // ------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question || !answer) {
      alert('Vui lòng điền đủ Câu hỏi và Câu trả lời.')
      return
    }

    const tagsArray = tagsInput
      ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
      : []

    try {
      const payload = {
        question: question,
        answer: answer,
        tags: tagsArray
      }

      if (editingQaId) {
        await axios.put(`https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/training/${editingQaId}`, payload)
      } else {
        await axios.post('https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/training', payload)
      }

      resetForm()
      setShowForm(false)
      fetchQA()
    } catch (error) {
      console.error("Lỗi khi lưu Q&A:", error)
    }
  }

  const handleEdit = (qa) => {
    setEditingQaId(qa.id)
    setQuestion(qa.question || '')
    setAnswer(qa.answer || '')
    setTagsInput(qa.tags ? qa.tags.join(', ') : '')
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa Q&A này?')) return

    try {
      await axios.delete(`https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/training/${id}`)
      if (editingQaId === id) {
        resetForm()
        setShowForm(false)
      }
      fetchQA()
    } catch (error) {
      console.error("Lỗi khi xóa Q&A:", error)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ color: '#2c3e50', margin: '0 0 5px 0' }}>Đào tạo & Hỏi đáp </h2>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Lưu trữ kinh nghiệm vận hành và giải quyết sự cố.</p>
        </div>
        <button 
          onClick={() => {
            if (showForm) resetForm()
            setShowForm(!showForm)
          }}
          style={{ padding: '8px 15px', backgroundColor: showForm ? '#6c757d' : '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
        >
          {showForm ? 'Đóng' : '+ Thêm Q&A mới'}
        </button>
      </div>

      {/* FORM THÊM Q&A */}
      {showForm && (
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Câu hỏi / Sự cố *</label>
              <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="VD: Khắc phục lỗi lệch tồn kho?" />
            </div>

            {/* BOX NHẬP NỘI DUNG MỚI (Hỗ trợ upload, Markdown và Auto-resize) */}
            <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '10px', backgroundColor: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '14px', color: '#555', fontWeight: 'bold' }}>Hướng dẫn giải quyết / Đáp án (Hỗ trợ Markdown & Paste ảnh Ctrl+V) *</label>
                
                <div>
                  <label htmlFor="qa-file-upload" style={{ cursor: 'pointer', backgroundColor: '#e9ecef', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', border: '1px solid #ccc', color: '#333' }}>
                     Đính kèm ảnh
                  </label>
                  <input id="qa-file-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </div>
              </div>

              <textarea 
                value={answer} 
                onChange={(e) => setAnswer(e.target.value)} 
                onPaste={handlePaste}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                rows="3" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  minHeight: '75px',
                  maxHeight: '300px', // Giới hạn chiều cao tối đa
                  overflowY: 'auto',  // Hiển thị thanh cuộn nếu vượt quá 300px
                  resize: 'none',     // Tắt nút kéo giãn thủ công
                  fontFamily: 'monospace', 
                  backgroundColor: '#fff', 
                  boxSizing: 'border-box'
                }} 
                placeholder="Nhập cách xử lý chi tiết hoặc dán (Ctrl+V) ảnh vào đây..." 
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#555' }}>Thẻ phân loại (Tags) - Ngăn cách bằng dấu phẩy</label>
              <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="VD: Bug, Database, Deploy" />
            </div>
            <div style={{ textAlign: 'right' }}>
              {editingQaId && (
                <button type="button" onClick={() => { resetForm(); setShowForm(false); }} style={{ padding: '9px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', marginRight: '8px' }}>Hủy</button>
              )}
              <button type="submit" style={{ padding: '9px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>{editingQaId ? 'Cập nhật Q&A' : 'Lưu Q&A'}</button>
            </div>
          </form>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {qaList.length === 0 ? <p style={{ color: '#666' }}>Chưa có dữ liệu.</p> : null}
        {qaList.map((qa) => (
          <div key={qa.id} style={{ border: '1px solid #ddd', borderLeft: '4px solid #6c757d', padding: '15px', borderRadius: '4px', backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#333', fontSize: '16px', flex: 1 }}>Hỏi: {qa.question}</h4>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => handleEdit(qa)} style={{ padding: '4px 10px', backgroundColor: '#f4f6f8', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Sửa</button>
                <button onClick={() => handleDelete(qa.id)} style={{ padding: '4px 10px', backgroundColor: '#fff5f5', color: '#dc3545', border: '1px solid #f5c2c7', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Xóa</button>
              </div>
            </div>
            <div style={{ color: '#444', fontSize: '14px', marginBottom: '10px' }}>
              <strong>Đáp:</strong>
              <ReactMarkdown 
                components={{
                  img: ({node, ...props}) => (
                    <img 
                      {...props} 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '400px',
                        objectFit: 'contain', 
                        display: 'block', 
                        margin: '10px 0', 
                        borderRadius: '4px', 
                        border: '1px solid #ddd' 
                      }} 
                    />
                  )
                }}
              >
                {qa.answer}
              </ReactMarkdown>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {qa.tags && qa.tags.map(tag => (
                <span key={tag} style={{ backgroundColor: '#e9ecef', color: '#495057', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #ced4da' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// COMPONENT: SIDEBAR LINK (Xử lý Hover & Active)
// ==========================================
function SidebarLink({ to, children }) {
  const location = useLocation()
  const isActive = location.pathname === to
  const [isHovered, setIsHovered] = useState(false)

  return (
    <li style={{ textAlign: 'left', marginBottom: '5px' }}>
      <Link 
        to={to} 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          color: isActive ? '#ffffff' : (isHovered ? '#60a5fa' : '#cbd5e1'), // Trắng nếu active, xanh nhạt nếu hover
          backgroundColor: isActive ? '#3b82f6' : (isHovered ? '#334155' : 'transparent'), // Xanh dương nếu active, xám đậm nếu hover
          textDecoration: 'none', 
          fontSize: '15px', 
          display: 'block',
          padding: '10px 15px',
          borderRadius: '6px', // Bo góc nhìn hiện đại hơn
          transition: 'all 0.2s ease-in-out', // Hiệu ứng chuyển màu mượt
          fontWeight: isActive ? 'bold' : 'normal'
        }}
      >
        {children}
      </Link>
    </li>
  )
}

// ==========================================
// 4. MAIN APP BỐ CỤC (LAYOUT)
// ==========================================
function MainLayout() {
  const { instance, accounts } = useMsal()
  const [dbUser, setDbUser] = useState(null)

  useEffect(() => {
    if (accounts.length > 0) {
      axios.post('https://opshub-backend-vva-hcdqd9c3hxgcf5dv.japaneast-01.azurewebsites.net/api/auth/sync', {
        email: accounts[0].username,
        name: accounts[0].name
      })
        .then(res => setDbUser(res.data))
        .catch(err => console.error('Lỗi đồng bộ user:', err))
    }
  }, [accounts])

  const handleLogout = () => {
    instance.logoutPopup()
  }

  if (!dbUser) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Đang đồng bộ dữ liệu bảo mật...</div>
  }

  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ width: '250px', backgroundColor: '#1e293b', color: 'white', padding: '20px', textAlign: 'left' }}>
          <h2 style={{ borderBottom: '1px solid #334155', paddingBottom: '15px', margin: '0 0 20px 0', fontSize: '20px', color: 'white' }}>Internal Ops Hub</h2>
          <div style={{ marginBottom: '30px', backgroundColor: '#334155', padding: '10px', borderRadius: '4px', fontSize: '13px' }}>
            <p style={{ margin: '0 0 5px 0' }}>{dbUser.name}</p>
            <p style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>{dbUser.role}</p>
            <button onClick={handleLogout} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>Đăng xuất</button>
          </div>

          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}>
            <SidebarLink to="/">Quản lý Ca trực</SidebarLink>
            <SidebarLink to="/knowledge">Tài liệu</SidebarLink>
            <SidebarLink to="/training">Đào tạo & Hỏi đáp</SidebarLink>
          </ul>
        </div>

        <div style={{ flex: 1, padding: '30px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
          <Routes>
            <Route path="/" element={<ShiftHandover currentUser={dbUser} />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/training" element={<TrainingQA />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

function App() {
  const { instance } = useMsal()

  // Đổi từ loginPopup sang loginRedirect
  const handleLogin = () => {
    instance.loginRedirect({ scopes: ['user.read'] }).catch(e => console.error(e))
  }

  return (
    <>
      <UnauthenticatedTemplate>
        <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f8' }}>
          <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h1 style={{ color: '#2c3e50', marginBottom: '50px' }}>Internal Ops Hub</h1>
            <p style={{ color: '#666', marginBottom: '30px' }}>Vui lòng đăng nhập bằng tài khoản Microsoft của bạn.</p>
            <button onClick={handleLogin} style={{ padding: '10px 20px', backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
              Đăng nhập bằng Microsoft
            </button>
          </div>
        </div>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <MainLayout />
      </AuthenticatedTemplate>
    </>
  )
}

export default App