import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Issue {
  id: number
  what_wrong: string
  what_doing: string
  what_should_do: string
  page_url?: string
  screenshot_url?: string
  status: string
  priority: string
  created_by_name?: string
  created_at: string
}

export default function PanelIssues() {
  const { token } = useAuthStore()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newIssue, setNewIssue] = useState({
    what_wrong: '',
    what_doing: '',
    what_should_do: '',
    page_url: '',
    priority: 'MEDIUM'
  })
  const [screenshot, setScreenshot] = useState<File | null>(null)

  useEffect(() => {
    fetchIssues()
  }, [statusFilter])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      const response = await axios.get(`${API_URL}/api/issues?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setIssues(response.data.issues || [])
    } catch (error) {
      console.error('Failed to fetch issues:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('what_wrong', newIssue.what_wrong)
      formData.append('what_doing', newIssue.what_doing)
      formData.append('what_should_do', newIssue.what_should_do)
      formData.append('page_url', newIssue.page_url)
      formData.append('priority', newIssue.priority)
      if (screenshot) {
        formData.append('screenshot', screenshot)
      }

      await axios.post(`${API_URL}/api/issues`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      setShowCreateModal(false)
      setNewIssue({ what_wrong: '', what_doing: '', what_should_do: '', page_url: '', priority: 'MEDIUM' })
      setScreenshot(null)
      fetchIssues()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create issue')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-red-100 text-red-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-blue-100 text-blue-800'
    }
    return styles[priority] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/panel" className="p-2 hover:bg-white/50 rounded-full transition-colors">
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                  Issue Tracker
                </h1>
                <p className="mt-2 text-gray-600">{issues.length} issues</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full hover:from-red-700 hover:to-orange-700 transition-all"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Issue
            </button>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center text-gray-500">
              Loading issues...
            </div>
          ) : issues.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No issues found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 space-y-3">
                      {issue.what_wrong && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">What is wrong or what do you want done?</p>
                          <p className="text-sm text-gray-900">{issue.what_wrong}</p>
                        </div>
                      )}
                      {issue.what_doing && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">What is it doing?</p>
                          <p className="text-sm text-gray-900">{issue.what_doing}</p>
                        </div>
                      )}
                      {issue.what_should_do && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">What should it do?</p>
                          <p className="text-sm text-gray-900">{issue.what_should_do}</p>
                        </div>
                      )}
                      {issue.page_url && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Page URL:</p>
                          <a href={issue.page_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                            {issue.page_url}
                          </a>
                        </div>
                      )}
                      {issue.screenshot_url && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Screenshot:</p>
                          <a href={issue.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            View Screenshot
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(issue.status)}`}>
                        {issue.status}
                      </span>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created by {issue.created_by_name || 'Unknown'}</span>
                    <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-6">
              Report Issue
            </h2>
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What is wrong or what do you want done?</label>
                <textarea
                  value={newIssue.what_wrong}
                  onChange={(e) => setNewIssue({ ...newIssue, what_wrong: e.target.value })}
                  rows={4}
                  placeholder="Describe the issue or what you'd like to see changed..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What is it doing?</label>
                <textarea
                  value={newIssue.what_doing}
                  onChange={(e) => setNewIssue({ ...newIssue, what_doing: e.target.value })}
                  rows={4}
                  placeholder="Describe the current behavior..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What should it do?</label>
                <textarea
                  value={newIssue.what_should_do}
                  onChange={(e) => setNewIssue({ ...newIssue, what_should_do: e.target.value })}
                  rows={4}
                  placeholder="Describe the expected behavior..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page URL</label>
                <input
                  type="url"
                  value={newIssue.page_url}
                  onChange={(e) => setNewIssue({ ...newIssue, page_url: e.target.value })}
                  placeholder="https://beautycita.com/page-with-issue"
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
                {screenshot && (
                  <p className="mt-2 text-sm text-gray-600">Selected: {screenshot.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={newIssue.priority}
                  onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-full hover:from-red-700 hover:to-orange-700 transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
