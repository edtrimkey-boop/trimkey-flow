export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Organization and account settings</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-medium mb-4">Platform Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-gray-400">Platform</span>
            <span className="text-white">Trim Key Flow V1</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-gray-400">API Endpoint</span>
            <span className="text-indigo-400 font-mono text-xs">https://flow.trimkey.in/api/v1</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-gray-400">Webhook Endpoint</span>
            <span className="text-indigo-400 font-mono text-xs">https://flow.trimkey.in/api/webhooks/razorpay</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Provider</span>
            <span className="text-white">Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  )
}
