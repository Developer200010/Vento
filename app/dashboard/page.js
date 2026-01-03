"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [chatrooms, setChatrooms] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user data and chatrooms
  useEffect(() => {
    fetchUserData();
    requestLocation();
  }, []);

  // Fetch nearby chatrooms when location is available
  useEffect(() => {
    if (location) {
      fetchNearbyChatrooms();
    }
  }, [location]);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyChatrooms = async () => {
    try {
      const res = await fetch("/api/createRoom/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatrooms(data.chatrooms);
      }
    } catch (error) {
      console.error("Failed to fetch chatrooms:", error);
    }
  };

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError("");
        },
        (error) => {
          setLocationError("Location access denied. Please enable location to use the app.");
          console.error("Location error:", error);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.push("/sign-in");
  };

  const handleJoinRoom = async (roomId) => {
    if (!location) {
      alert("Location is required to join");
      return;
    }

    try {
      const res = await fetch(`/api/createRoom/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Success! Go to chat room
        router.push(`/room/${roomId}`);
      } else {
        alert(data.error || "Failed to join chatroom");
      }
    } catch (error) {
      console.error("Join error:", error);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <h1 className="text-xl font-bold text-gray-900">LocalChat</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* User Info */}
              <div className="flex items-center gap-3">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.username}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location Status */}
        {locationError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-800 font-medium">Location Required</p>
              <p className="text-red-600 text-sm mt-1">{locationError}</p>
              <button
                onClick={requestLocation}
                className="mt-2 text-sm bg-red-600 text-white px-4 py-1 rounded-md hover:bg-red-700"
              >
                Enable Location
              </button>
            </div>
          </div>
        ) : location ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <span className="text-green-600 text-xl">✓</span>
            <div>
              <p className="text-green-800 font-medium">Location Enabled</p>
              <p className="text-green-600 text-sm">
                Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <span className="text-yellow-600 text-xl">⏳</span>
            <p className="text-yellow-800">Detecting your location...</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!location}
            className="bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            Create New Chatroom
          </button>

          <button
            onClick={() => alert("Feature coming soon!")}
            disabled={!location}
            className="bg-white text-gray-700 px-6 py-4 rounded-lg font-semibold hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition shadow-md border border-gray-200 flex items-center justify-center gap-2"
          >
            <span className="text-xl">🔍</span>
            Browse Nearby Chatrooms
          </button>
        </div>

        {/* Chatrooms Grid */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Available Chatrooms
          </h2>
          <span className="text-sm text-gray-500">
            {chatrooms.length} rooms found
          </span>
        </div>

        {chatrooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Chatrooms Nearby
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to create a chatroom in your area!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!location}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition"
            >
              Create Chatroom
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chatrooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {room.name}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {room.radius}km
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  📍 {room.distance}km away
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  👥 {room.memberCount} {room.memberCount === 1 ? "member" : "members"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    by {room.createdBy}
                  </span>
                  {room.isJoined ? (
                    <button
                      onClick={() => router.push(`/room/${room.id}`)}
                      className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 transition"
                    >
                      Open
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Chats</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rooms Joined</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-2xl">📨</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Chatroom Modal */}
      {showCreateModal && (
        <CreateChatroomModal
          location={location}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newRoom) => {
            setChatrooms([...chatrooms, newRoom]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// Create Chatroom Modal Component
function CreateChatroomModal({ location, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    radius: "2",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/createRoom/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          latitude: location.latitude,
          longitude: location.longitude,
          radius: parseFloat(formData.radius),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onCreated(data.chatroom);
        fetchNearbyChatrooms(); // Refresh the list
      } else {
        setError(data.error || "Failed to create chatroom");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create Chatroom</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chatroom Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Coffee Shop Chat"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Radius (kilometers)
            </label>
            <select
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="0.5">0.5 km (500m)</option>
              <option value="1">1 km</option>
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Only users within this radius can join
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              📍 Your location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}