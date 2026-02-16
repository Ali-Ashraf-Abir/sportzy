import Link from 'next/link'
import { Eye, MessageSquare, Plus } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Sports Commentary Live
          </h1>
          <p className="text-xl text-gray-600">
            Real-time match commentary platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Viewer Card */}
          <Link href="/viewer">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all cursor-pointer group">
              <div className="flex justify-center mb-6">
                <div className="bg-blue-100 p-6 rounded-full group-hover:bg-blue-200 transition-colors">
                  <Eye className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
                Viewer
              </h2>
              <p className="text-gray-600 text-center">
                Watch live matches and follow real-time commentary
              </p>
            </div>
          </Link>

          {/* Commentator Card */}
          <Link href="/commentator">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all cursor-pointer group">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 p-6 rounded-full group-hover:bg-green-200 transition-colors">
                  <MessageSquare className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
                Commentator
              </h2>
              <p className="text-gray-600 text-center">
                Provide live commentary for ongoing matches
              </p>
            </div>
          </Link>

          {/* Match Creator Card */}
          <Link href="/creator">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all cursor-pointer group">
              <div className="flex justify-center mb-6">
                <div className="bg-purple-100 p-6 rounded-full group-hover:bg-purple-200 transition-colors">
                  <Plus className="w-12 h-12 text-purple-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3 text-center">
                Match Creator
              </h2>
              <p className="text-gray-600 text-center">
                Create and manage new match events
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}