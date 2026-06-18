export default function BookingStatusBadge({ status }) {
  const cls = {
    Confirmed:   'badge-confirmed',
    Cancelled:   'badge-cancelled',
    WaitingList: 'badge-waiting',
    Completed:   'badge-completed',
  }[status] || 'bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold'
  return <span className={cls}>{status}</span>
}
