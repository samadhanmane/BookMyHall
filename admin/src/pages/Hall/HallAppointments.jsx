import React, { useContext, useEffect, useState } from 'react'
import { HallContext } from '../../context/HallContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets.js'
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
    <div className="w-full max-w-6xl mx-auto p-5 font-[Poppins] text-[#030303]">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold">All Appointments</h2>
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-[#123458] text-white rounded border border-[#123458] shadow-sm hover:shadow-md transition"
        >
          Download CSV
        </button>
      </div>

      <div className="bg-white border rounded-md overflow-y-scroll max-h-[80vh] min-h-[50vh] shadow-sm">
        <div className="hidden sm:grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr_1fr_1fr] px-6 py-3 border-b font-medium text-sm text-[#030303] bg-[#f9f9f9]">
          <p className="text-center">#</p>
          <p className="text-center">User</p>
          <p className="text-center">Email</p>
          <p className="text-center">Date & Time</p>
          <p className="text-center">Status</p>
          <p className="text-center">Feedback</p>
          <p className="text-center">Action</p>
          <p className="text-center">Complete</p>
        </div>

        {appointments.length > 0 ? (
          appointments.slice().reverse().map((item, index) => (
            <div
              key={item._id}
              className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr_1fr_1fr] gap-2 px-6 py-3 items-center border-b hover:shadow-sm transition text-sm"
            >
              <p className="sm:block hidden text-center">{index + 1}</p>

              <div className="flex items-center gap-2 justify-center text-center">
                <img
                  className="w-8 h-8 rounded-full object-cover shadow-sm border"
                  src={item.userData && item.userData.image ? item.userData.image : assets.userIcon}
                  alt="User"
                />
                <p>{item.userData && item.userData.name ? item.userData.name : 'User'}</p>
              </div>

              <p className="sm:block hidden text-center">{item.userData && item.userData.email ? item.userData.email : '-'}</p>

              <p className="text-center">{slotDateFormat(item.slotDate)}, {item.slotTime}</p>

              <p className="text-center">
                {item.cancelled ? (
                  <span className="text-red-600 font-semibold text-sm">Cancelled</span>
                ) : item.coordinatorDecision === 'pending' ? (
                  <span className="text-orange-500 font-semibold text-sm">Pending Coordinator Approval</span>
                ) : item.coordinatorDecision === 'rejected' ? (
                  <span className="text-red-500 font-semibold text-sm">Rejected by Coordinator{item.coordinatorComment ? `: ${item.coordinatorComment}` : ''}</span>
                ) : item.directorDecision === 'pending' ? (
                  <span className="text-orange-500 font-semibold text-sm">Pending Director Approval</span>
                ) : item.directorDecision === 'rejected' ? (
                  <span className="text-red-500 font-semibold text-sm">Rejected by Director{item.directorComment ? `: ${item.directorComment}` : ''}</span>
                ) : item.directorDecision === 'approved' ? (
                  <span className="text-green-600 font-semibold text-sm">Approved</span>
                ) : item.isAccepted ? (
                  <span className="text-green-600 font-semibold text-sm">Confirmed</span>
                ) : (item.isAccepted || item.directorDecision === 'approved') ? (
                  <span className="text-green-600 font-semibold text-sm">Confirmed</span>
                ) : (
                  <span className="text-yellow-600 font-semibold text-sm">Pending</span>
                )}
              </p>

              <div className="flex flex-wrap gap-2 justify-center text-center">
                {item.isCompleted && getFeedbacksForAppointment(item._id).length > 0 ? (
                  getFeedbacksForAppointment(item._id).map(fb => (
                    <button
                      key={fb._id}
                      className="px-3 py-1 rounded bg-[#123458] text-white text-xs shadow hover:bg-[#0e2e47] transition"
                      onClick={() => handleShowFeedback(fb)}
                    >
                      Feedback
                    </button>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>

              <div className="flex gap-3 justify-center text-center">
                {!item.cancelled &&
                  item.coordinatorDecision === 'pending' &&
                  (!item.directorDecision || item.directorDecision === 'pending') && (
                    <>
                      <img
                        onClick={() => handleCancelAppointment(item._id)}
                        className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                        src={assets.cancel_icon}
                        alt="Cancel"
                      />
                      <img
                        onClick={() => handleRequestAppointment(item._id, item.hallData?.isGuestRoom ? 'guestroom' : item.hallData?.isVehicle ? 'vehicle' : 'hall')}
                        className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                        src={assets.tick_icon}
                        alt="Confirm"
                      />
                    </>
                  )}
              </div>

              <div className="flex justify-center text-center">
                {(item.isAccepted || item.directorDecision === 'approved') && !item.isCompleted && (
                  <img
                    onClick={() => handleCompleteAppointment(item._id)}
                    className="w-8 h-8 cursor-pointer hover:scale-110 transition-transform"
                    src={assets.tick_icon}
                    alt="Complete"
                  />
                )}
                {item.isCompleted && (
                  <p className="text-green-600 font-semibold text-sm">Completed</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-[#123458] font-medium">No appointments found.</p>
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
