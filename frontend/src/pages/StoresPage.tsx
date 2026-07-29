import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Video, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storeAPI } from "@/lib/api";
import type { Store, Shelf, Camera } from "@/types";
import { toast } from "react-toastify";

const StoresPage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);

  // Store form
  const [storeName, setStoreName] = useState("");
  const [storeLocation, setStoreLocation] = useState("");

  // Edit store
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editStoreName, setEditStoreName] = useState("");
  const [editStoreLocation, setEditStoreLocation] = useState("");

  // Shelf form
  const [shelfName, setShelfName] = useState("");
  const [shelfDescription, setShelfDescription] = useState("");

  // Edit shelf
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [editShelfName, setEditShelfName] = useState("");
  const [editShelfDescription, setEditShelfDescription] = useState("");

  // Camera form
  const [cameraName, setCameraName] = useState("");
  const [cameraStreamUrl, setCameraStreamUrl] = useState("");
  const [cameraDescription, setCameraDescription] = useState("");

  // Edit camera
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [editCameraName, setEditCameraName] = useState("");
  const [editCameraStreamUrl, setEditCameraStreamUrl] = useState("");
  const [editCameraDescription, setEditCameraDescription] = useState("");

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchShelves(selectedStore.id);
      fetchCameras(selectedStore.id);
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    try {
      const res = await storeAPI.getStores();
      setStores(res.data);
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    }
  };

  const fetchShelves = async (storeId: number) => {
    try {
      const res = await storeAPI.getShelves(storeId);
      setShelves(res.data);
    } catch (error) {
      console.error("Failed to fetch shelves:", error);
    }
  };

  const fetchCameras = async (storeId: number) => {
    try {
      const res = await storeAPI.getCameras(storeId);
      setCameras(res.data);
    } catch (error) {
      console.error("Failed to fetch cameras:", error);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await storeAPI.createStore({ name: storeName, location: storeLocation });
      setStoreName("");
      setStoreLocation("");
      fetchStores();
      toast.success("Store created successfully!");
    } catch (error) {
      console.error("Failed to create store:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    setEditStoreName(store.name);
    setEditStoreLocation(store.location || "");
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;
    setLoading(true);
    try {
      await storeAPI.updateStore(editingStore.id, { 
        name: editStoreName, 
        location: editStoreLocation 
      });
      setEditingStore(null);
      fetchStores();
      toast.success("Store updated successfully!");
    } catch (error) {
      console.error("Failed to update store:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this store?")) {
      try {
        await storeAPI.deleteStore(id);
        if (selectedStore?.id === id) {
          setSelectedStore(null);
        }
        fetchStores();
        toast.success("Store deleted successfully!");
      } catch (error) {
        console.error("Failed to delete store:", error);
      }
    }
  };

  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    setLoading(true);
    try {
      await storeAPI.createShelf(selectedStore.id, { 
        name: shelfName, 
        description: shelfDescription 
      });
      setShelfName("");
      setShelfDescription("");
      fetchShelves(selectedStore.id);
      toast.success("Shelf created successfully!");
    } catch (error) {
      console.error("Failed to create shelf:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditShelf = (shelf: Shelf) => {
    setEditingShelf(shelf);
    setEditShelfName(shelf.name);
    setEditShelfDescription(shelf.description || "");
  };

  const handleUpdateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShelf || !selectedStore) return;
    setLoading(true);
    try {
      await storeAPI.updateShelf(selectedStore.id, editingShelf.id, { 
        name: editShelfName, 
        description: editShelfDescription 
      });
      setEditingShelf(null);
      fetchShelves(selectedStore.id);
      toast.success("Shelf updated successfully!");
    } catch (error) {
      console.error("Failed to update shelf:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShelf = async (id: number) => {
    if (!selectedStore) return;
    if (window.confirm("Are you sure you want to delete this shelf?")) {
      try {
        await storeAPI.deleteShelf(selectedStore.id, id);
        fetchShelves(selectedStore.id);
        toast.success("Shelf deleted successfully!");
      } catch (error) {
        console.error("Failed to delete shelf:", error);
      }
    }
  };

  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    setLoading(true);
    try {
      await storeAPI.createCamera(selectedStore.id, { 
        name: cameraName, 
        stream_url: cameraStreamUrl, 
        description: cameraDescription 
      });
      setCameraName("");
      setCameraStreamUrl("");
      setCameraDescription("");
      fetchCameras(selectedStore.id);
      toast.success("Camera created successfully!");
    } catch (error) {
      console.error("Failed to create camera:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCamera = (camera: Camera) => {
    setEditingCamera(camera);
    setEditCameraName(camera.name);
    setEditCameraStreamUrl(camera.stream_url);
    setEditCameraDescription(camera.description || "");
  };

  const handleUpdateCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCamera || !selectedStore) return;
    setLoading(true);
    try {
      await storeAPI.updateCamera(selectedStore.id, editingCamera.id, { 
        name: editCameraName, 
        stream_url: editCameraStreamUrl, 
        description: editCameraDescription 
      });
      setEditingCamera(null);
      fetchCameras(selectedStore.id);
      toast.success("Camera updated successfully!");
    } catch (error) {
      console.error("Failed to update camera:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCamera = async (id: number) => {
    if (!selectedStore) return;
    if (window.confirm("Are you sure you want to delete this camera?")) {
      try {
        await storeAPI.deleteCamera(selectedStore.id, id);
        fetchCameras(selectedStore.id);
        toast.success("Camera deleted successfully!");
      } catch (error) {
        console.error("Failed to delete camera:", error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stores</h1>
        <p className="text-gray-600">Manage your retail stores, shelves, and cameras.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stores List */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Store</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateStore} className="space-y-4">
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="storeLocation">Location</Label>
                  <Input
                    id="storeLocation"
                    type="text"
                    value={storeLocation}
                    onChange={(e) => setStoreLocation(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? "Creating..." : "Create Store"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {stores.map((store) => (
              <Card 
                key={store.id} 
                className={`cursor-pointer transition-all ${selectedStore?.id === store.id ? 'border-blue-500 bg-blue-50' : ''}`}
                onClick={() => setSelectedStore(store)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{store.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-2">
                    {store.location || "No location specified"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStore(store);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStore(store.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Selected Store Details */}
        <div className="lg:col-span-2">
          {selectedStore ? (
            <div className="space-y-6">
              {/* Edit Store Form */}
              {editingStore && (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Store</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateStore} className="space-y-4">
                      <div>
                        <Label htmlFor="editStoreName">Store Name</Label>
                        <Input
                          id="editStoreName"
                          type="text"
                          value={editStoreName}
                          onChange={(e) => setEditStoreName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="editStoreLocation">Location</Label>
                        <Input
                          id="editStoreLocation"
                          type="text"
                          value={editStoreLocation}
                          onChange={(e) => setEditStoreLocation(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading}>
                          {loading ? "Updating..." : "Update Store"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingStore(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Shelves Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LayoutGrid className="w-5 h-5 mr-2" />
                    Shelves
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleCreateShelf} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <Label htmlFor="shelfName">Shelf Name</Label>
                      <Input
                        id="shelfName"
                        type="text"
                        value={shelfName}
                        onChange={(e) => setShelfName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="shelfDescription">Description</Label>
                      <Input
                        id="shelfDescription"
                        type="text"
                        value={shelfDescription}
                        onChange={(e) => setShelfDescription(e.target.value)}
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Shelf
                    </Button>
                  </form>

                  {editingShelf && (
                    <Card className="mt-4">
                      <CardContent className="pt-6">
                        <form onSubmit={handleUpdateShelf} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <Label htmlFor="editShelfName">Shelf Name</Label>
                            <Input
                              id="editShelfName"
                              type="text"
                              value={editShelfName}
                              onChange={(e) => setEditShelfName(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="editShelfDescription">Description</Label>
                            <Input
                              id="editShelfDescription"
                              type="text"
                              value={editShelfDescription}
                              onChange={(e) => setEditShelfDescription(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                              Update
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingShelf(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shelves.map((shelf) => (
                      <Card key={shelf.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{shelf.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 text-sm mb-2">
                            {shelf.description || "No description"}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditShelf(shelf)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteShelf(shelf.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cameras Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="w-5 h-5 mr-2" />
                    Cameras
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleCreateCamera} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <Label htmlFor="cameraName">Camera Name</Label>
                      <Input
                        id="cameraName"
                        type="text"
                        value={cameraName}
                        onChange={(e) => setCameraName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cameraStreamUrl">Stream URL</Label>
                      <Input
                        id="cameraStreamUrl"
                        type="text"
                        placeholder="0 for webcam, RTSP URL, or MP4 path"
                        value={cameraStreamUrl}
                        onChange={(e) => setCameraStreamUrl(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cameraDescription">Description</Label>
                      <Input
                        id="cameraDescription"
                        type="text"
                        value={cameraDescription}
                        onChange={(e) => setCameraDescription(e.target.value)}
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="md:col-span-3">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Camera
                    </Button>
                  </form>

                  {editingCamera && (
                    <Card className="mt-4">
                      <CardContent className="pt-6">
                        <form onSubmit={handleUpdateCamera} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <Label htmlFor="editCameraName">Camera Name</Label>
                            <Input
                              id="editCameraName"
                              type="text"
                              value={editCameraName}
                              onChange={(e) => setEditCameraName(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="editCameraStreamUrl">Stream URL</Label>
                            <Input
                              id="editCameraStreamUrl"
                              type="text"
                              value={editCameraStreamUrl}
                              onChange={(e) => setEditCameraStreamUrl(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="editCameraDescription">Description</Label>
                            <Input
                              id="editCameraDescription"
                              type="text"
                              value={editCameraDescription}
                              onChange={(e) => setEditCameraDescription(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 md:col-span-3">
                            <Button type="submit" disabled={loading}>
                              Update
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingCamera(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cameras.map((camera) => (
                      <Card key={camera.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{camera.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 text-sm mb-2">
                            {camera.description || "No description"}
                          </p>
                          <p className="text-gray-500 text-xs mb-2 break-all">
                            Stream: {camera.stream_url}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCamera(camera)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCamera(camera.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-gray-500">Select a store to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoresPage;
