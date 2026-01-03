"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import AppShell from "../../components/AppShell";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { motion } from "framer-motion";

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
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="text-center text-neutral-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppShell
      title="Dashboard"
      right={
        <>
          <div className="hidden sm:flex items-center gap-3 mr-2">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.username} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <span className="text-sm text-neutral-300">{user?.username}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
        </>
      }
    >
        {/* Location Status */}
        {locationError ? (
          <Card className="border-red-900/40 bg-red-950/40" padding="p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-red-300 font-medium">Location Required</p>
              <p className="text-red-400 text-sm mt-1">{locationError}</p>
              <Button onClick={requestLocation} size="sm" variant="danger" className="mt-2">Enable Location</Button>
            </div>
          </div>
        </Card>
        ) : location ? (
          <Card className="border-emerald-900/40 bg-emerald-950/40" padding="p-4">
            <span className="text-emerald-400 text-xl">✓</span>
            <div>
              <p className="text-emerald-300 font-medium">Location Enabled</p>
              <p className="text-emerald-400 text-sm">
                Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="border-yellow-900/40 bg-yellow-950/40" padding="p-4">
            <span className="text-yellow-400 text-xl">⏳</span>
            <p className="text-yellow-300">Detecting your location...</p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button onClick={() => setShowCreateModal(true)} disabled={!location} className="w-full h-14">
            <span className="text-xl">+</span>
            <span className="ml-2">Create New Chatroom</span>
          </Button>
          <Button onClick={() => alert("Feature coming soon!")} disabled={!location} variant="outline" className="w-full h-14">
            <span className="text-xl">🔍</span>
            <span className="ml-2">Browse Nearby Chatrooms</span>
          </Button>
        </div>

        {/* Chatrooms Grid */}
        <div className="mb-2 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Available Chatrooms</h2>
          <span className="text-sm text-neutral-400">{chatrooms.length} rooms found</span>
        </div>

        {chatrooms.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2">
              No Chatrooms Nearby
            </h3>
            <p className="text-neutral-400 mb-6">
              Be the first to create a chatroom in your area!
            </p>
            <Button onClick={() => setShowCreateModal(true)} disabled={!location}>Create Chatroom</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chatrooms.map((room) => (
              <Card key={room.id} className="hover:border-emerald-500/40 transition">
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
                  <span className="text-xs text-neutral-400">by {room.createdBy}</span>
                  {room.isJoined ? (
                    <Button onClick={() => router.push(`/room/${room.id}`)} size="sm" variant="outline">Open</Button>
                  ) : (
                    <Button onClick={() => handleJoinRoom(room.id)} size="sm">Join</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-neutral-800 rounded-full p-3 border border-neutral-700">
                <span className="text-2xl">💬</span>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Active Chats</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-neutral-800 rounded-full p-3 border border-neutral-700">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Rooms Joined</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-neutral-800 rounded-full p-3 border border-neutral-700">
                <span className="text-2xl">📨</span>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Messages Sent</p>
                <p className="text-2xl font-bold">0</p>
              </div>
            </div>
          </Card>
        </div>
      </AppShell>

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
   </>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-neutral-100">Create Chatroom</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">✕</Button>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900/50 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Chatroom Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="e.g., Coffee Shop Chat"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Radius (kilometers)</label>
            <select
              value={formData.radius}
              onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              disabled={loading}
            >
              <option value="0.5">0.5 km (500m)</option>
              <option value="1">1 km</option>
              <option value="2">2 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="20">20 km</option>
            </select>
            <p className="text-xs text-neutral-500 mt-1">Only users within this radius can join</p>
          </div>

          <Card className="p-3 border-neutral-800 bg-neutral-900">
            <p className="text-sm text-neutral-300">📍 Your location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}