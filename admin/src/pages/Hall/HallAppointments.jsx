import React, { useContext, useEffect, useState } from 'react'
import { HallContext } from '../../context/HallContext'
import { AppContext } from '../../context/AppContext'
import { XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import FeedbackModal from '../../components/FeedbackModal'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const HallAppointments = () => {
  const { dToken, appointments, getAppointments, completeAppointment, cancelAppointment, requestAppointment, feedbacks, getFeedbacks } = useContext(HallContext)
  const { calculateAge, slotDateFormat } = useContext(AppContext)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [adminRating, setAdminRating] = useState(0)
  const [adminMessage, setAdminMessage] = useState('')
  const [openFeedback, setOpenFeedback] = useState(null)

  useEffect(() => {
    if (dToken) {
      getAppointments()
      getFeedbacks()
    }
  }, [dToken])

  useEffect(() => {
    const interval = setInterval(() => {
      if (dToken) {
        getAppointments()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [dToken])

  const handleCancelAppointment = async (appointmentId) => {
    await cancelAppointment(appointmentId)
    getAppointments()
  }

  const handleRequestAppointment = async (appointmentId, facilityType) => {
    await requestAppointment(appointmentId, facilityType)
    getAppointments()
  }

  const handleCompleteAppointment = async (appointmentId) => {
    await completeAppointment(appointmentId)
    getAppointments()
  }

  const openReviewModal = (feedback) => {
    setSelectedFeedback(feedback)
    setAdminRating(feedback.adminRating || 0)
    setAdminMessage(feedback.adminMessage || '')
    setReviewModalOpen(true)
    setOpenFeedback(feedback)
  }

  const handleShowFeedback = (feedback) => {
    setOpenFeedback(feedback)
    setSelectedFeedback(feedback)
    setAdminRating(feedback.adminRating || 0)
    setAdminMessage(feedback.adminMessage || '')
    setReviewModalOpen(true)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFeedback) return
    setReviewLoading(true)
    try {
      const res = await axios.patch(
        import.meta.env.VITE_BACKEND_URL + '/api/hall/review-feedback',
        {
          feedbackId: selectedFeedback._id,
          adminRating,
          adminMessage,
        },
        { headers: { dToken } }
      )
      if (res.data.success) {
        toast.success('Feedback reviewed!')
        setReviewModalOpen(false)
        setSelectedFeedback(null)
        getFeedbacks()
      } else {
        toast.error(res.data.message || 'Failed to review feedback')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to review feedback')
    } finally {
      setReviewLoading(false)
    }
  }

  const getFeedbacksForAppointment = (appointmentId) => {
    return feedbacks.filter(fb => (fb.appointmentId === appointmentId) || (fb.appointmentId && fb.appointmentId._id === appointmentId))
  }

  const hallAppointments = appointments.filter(
    (appointment) => appointment.hallId === dToken.hallId
  )

  const downloadCSV = () => {
    if (appointments.length === 0) {
      alert('No appointments available for download.')
      return
    }

    const csvHeaders = ['#', 'User Name', 'User Email', 'Date', 'Time', 'Hall Name', 'Status']
    const csvRows = appointments.slice().reverse().map((appointment, index) => {
      const status = appointment.cancelled
        ? 'Cancelled'
        : appointment.isCompleted
        ? 'Completed'
        : appointment.isAccepted
        ? 'Confirmed'
        : 'Pending'
      return [
        index + 1,
        appointment.userData && appointment.userData.name ? appointment.userData.name : 'User',
        appointment.userData && appointment.userData.email ? appointment.userData.email : '-',
        slotDateFormat(appointment.slotDate),
        appointment.slotTime,
        appointment.hallData && appointment.hallData.name ? appointment.hallData.name : '-',
        status,
      ].join(',')
    })

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'all_appointments.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 font-[Poppins] text-[#030303] bg-[#f8fafc]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#123458]">All Appointments</h2>
        <button
          onClick={downloadCSV}
          className="px-5 py-2 bg-[#123458] text-white rounded-lg border-none shadow font-semibold hover:bg-[#0e2e47] transition"
        >
          Download CSV
        </button>
      </div>

      {/* Table header */}
      <div className="w-full bg-gray-50 border border-[#123458]/30 rounded-xl shadow-lg overflow-x-auto">
        <div className="grid grid-cols-[0.5fr_2fr_2.5fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr_1.5fr] py-3 px-8 bg-[#f8fafc] border-b border-[#123458]/10 font-medium text-[#030303] text-sm rounded-t-xl">
          <p className="text-center">#</p>
          <p className="text-center">User</p>
          <p className="text-center">Email</p>
          <p className="text-center">Date & Time</p>
          <p className="text-center">Facility</p>
          <p className="text-center">Status</p>
          <p className="text-center">Feedback</p>
          <p className="text-center">Action</p>
          <p className="text-center">Complete</p>
        </div>
        {appointments.length > 0 ? (
          appointments.slice().reverse().map((item, index) => (
            <div
              key={item._id}
              className={`grid grid-cols-[0.5fr_2fr_2.5fr_2fr_1.5fr_1.5fr_1.5fr_1.5fr_1.5fr] items-center py-4 px-8 border-b border-[#123458]/10 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} min-h-[60px] text-sm`}
              style={{ lineHeight: 1.5 }}
            >
              <p className="text-center">{index + 1}</p>
              <div className="flex items-center gap-2 justify-center">
                <img
                  className="w-8 h-8 rounded-full object-cover shadow-sm border"
                  src={item.userData && item.userData.image ? item.userData.image : ''}
                  alt="User"
                />
                <span className="truncate font-medium" title={item.userData?.name}>{item.userData?.name || 'User'}</span>
              </div>
              <p className="truncate text-center" title={item.userData?.email}>{item.userData?.email || '-'}</p>
              <div className="flex flex-col text-center">
                <span className="text-base">{slotDateFormat(item.slotDate)}</span>
                <span className="text-xs text-black">{item.slotTime}</span>
              </div>
              <span className="truncate font-bold text-base text-[#123458] text-center" title={item.hallData?.name || item.facilityName}>{item.hallData?.name || item.facilityName || 'Facility'}</span>
              {/* Status */}
              <p className="text-center">
                {item.cancelled ? (
                  <span className="text-red-600 font-semibold text-sm">Cancelled</span>
                ) : item.isCompleted ? (
                  <span className="text-green-600 font-semibold text-sm">Completed</span>
                ) : item.isAccepted ? (
                  <span className="text-green-600 font-semibold text-sm">Confirmed</span>
                ) : (
                  <span className="text-yellow-600 font-semibold text-sm">Pending</span>
                )}
              </p>
              {/* Feedback */}
              <div className="flex flex-wrap gap-2 justify-center">
                {item.isCompleted && getFeedbacksForAppointment(item._id).length > 0 ? (
                  getFeedbacksForAppointment(item._id).map(fb => (
                    <button
                      key={fb._id}
                      className="px-3 py-1 rounded-lg bg-[#123458] text-white text-xs shadow hover:bg-[#0e2e47] transition"
                      onClick={() => handleShowFeedback(fb)}
                    >
                      Feedback
                    </button>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
              {/* Action */}
              <div className="flex gap-2 justify-center">
                {item.cancelled || item.directorDecision === 'rejected' || item.coordinatorDecision === 'rejected' || item.isCompleted ? null : (
                    <>
                    <XCircleIcon
                        onClick={() => handleCancelAppointment(item._id)}
                      className="w-6 h-6 text-red-500 cursor-pointer"
                      aria-label="Cancel"
                      />
                    <CheckCircleIcon
                        onClick={() => handleRequestAppointment(item._id, item.hallData?.isGuestRoom ? 'guestroom' : item.hallData?.isVehicle ? 'vehicle' : 'hall')}
                      className="w-6 h-6 text-green-500 cursor-pointer"
                      aria-label="Accept"
                      />
                    </>
                  )}
              </div>
              {/* Complete */}
              <div className="flex justify-center">
                {item.isAccepted && !item.isCompleted && (
                  <CheckCircleIcon
                    onClick={() => handleCompleteAppointment(item._id)}
                    className="w-6 h-6 text-green-500 cursor-pointer"
                    aria-label="Complete"
                  />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">No appointments found.</div>
        )}
      </div>

      <FeedbackModal
        open={reviewModalOpen && !!openFeedback}
        onClose={() => { setReviewModalOpen(false); setOpenFeedback(null); setSelectedFeedback(null); }}
        onSubmit={handleReviewSubmit}
        loading={reviewLoading}
        adminMode={true}
        adminRating={adminRating}
        setAdminRating={setAdminRating}
        adminMessage={adminMessage}
        setAdminMessage={setAdminMessage}
        feedback={openFeedback}
      />
    </div>
  )
}

export default HallAppointments
